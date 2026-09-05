import type { PoolClient } from 'pg'
import { query, withTransaction, resolveOrCreateUser, type OkrAllyUser } from '@/lib/okrAlly'
import { gstBreakdown } from '@/lib/okrAllyBilling'
import { createAndSendInvoice } from '@/lib/okrAllyInvoice'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { pdfSafe } from '@/lib/okrAllyReport'
import { assertFulfillmentAllowed, FulfillmentBlockedError } from '@/lib/fulfillmentGuard'
import { tokens } from '@/lib/okrAllyTokens'
import { type Brand, type BrandVocab, DEFAULT_BRAND, vocab, reviewCount } from '@/lib/okrAllyBrand'

/**
 * OKR Ally — self-serve corporate / organization credits (migration 009).
 *
 * A company buys one of three fixed bundles; a designated org admin allocates
 * credits to employee emails from the Company Admin screen. Org-allocated
 * credits live in `org_credit_balance`, a balance kept strictly separate from
 * an employee's personal `user_credit_balance` — the two never merge, so the
 * company gets clean org-scoped cost reporting. Deduction order on review
 * submission is coupon → org → personal (lib/okrAllySubmission.ts).
 */

// ─── Bundles ──────────────────────────────────────────────────────────────

export type BundleId = 'b100' | 'b200' | 'b500'

export interface Bundle {
  id: BundleId
  credits: number
  basePrice: number // INR, excl. GST — the bundle total, GST added on top
}

/** Three fixed bundles only. Nothing self-serve above 500 — the corporate
 *  page tells buyers to email pgs@embiggen.co.in for more. */
export const CORP_BUNDLES: Record<BundleId, Bundle> = {
  b100: { id: 'b100', credits: 100, basePrice: 6000 },
  b200: { id: 'b200', credits: 200, basePrice: 11000 },
  b500: { id: 'b500', credits: 500, basePrice: 25000 },
}

export function getBundle(id: unknown): Bundle | null {
  return typeof id === 'string' && id in CORP_BUNDLES ? CORP_BUNDLES[id as BundleId] : null
}

export function bundlePricing(b: Bundle) {
  const g = gstBreakdown(b.basePrice)
  return { credits: b.credits, base: g.base, gst: g.gst, total: g.total, amountInPaise: g.amountInPaise }
}

// ─── Guards ───────────────────────────────────────────────────────────────

export class OrgError extends Error {}

/** The company-admin gate — strictly `is_org_admin`. Throws OrgError otherwise. */
export function requireOrgAdmin(user: OkrAllyUser): string {
  if (!user.is_org_admin || !user.organization_id) {
    throw new OrgError('Not an organization admin')
  }
  return user.organization_id
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const ALLOC_MAX = 5000

// ─── Corporate purchase fulfilment (verify-payment + webhook) ──────────────

export interface FulfilCorporateInput {
  /** Which surface the purchase came through — sets the vocabulary in the
   *  admin-welcome email and on the invoice line item. Defaults to 'okr_ally'. */
  brand?: Brand
  purchaserUserId: string
  purchaserName: string
  purchaserEmail: string
  adminEmail: string
  companyName: string
  gstin: string
  registeredAddress: string
  /** Buyer state name — place of supply on the invoice. */
  placeOfSupply: string
  credits: number
  listPrice: number
  baseAmount: number
  gstAmount: number
  totalAmount: number
  razorpayPaymentId: string
  razorpayOrderId: string | null
}

export interface FulfilCorporateResult {
  ok: boolean
  alreadyProcessed: boolean
  organizationId?: string
  creditsPurchased?: number
  invoiceNumber?: string | null
  /** True when the pool + admin tag succeeded but the invoice did NOT issue —
   *  the one corporate step with no automatic retry. When true, PGS has been
   *  emailed and the `org_purchase` ledger row is stamped. */
  invoiceUnissued?: boolean
  /** Whether the "you're now the admin" email to the designated admin was
   *  accepted by Brevo. BCCs PGS — it confirms a corporate payment landed. */
  adminNotified?: boolean
}

/**
 * The GST invoice is created just after the guarded fulfilment transaction, so a
 * failure here (Brevo / Blob / config) leaves the pool + admin tag correct but
 * no invoice — and a webhook retry sees the guard row and skips the invoice.
 * This is the only corporate step with no automatic recovery, so make it loud:
 *  1. stamp the `org_purchase` ledger row (durable, queryable), and
 *  2. email PGS directly with everything needed to re-issue it by hand.
 */
async function alertCorporateInvoiceUnissued(
  input: FulfilCorporateInput,
  organizationId: string | undefined,
  reason: string
): Promise<void> {
  console.error('OKR Ally corporate invoice UNISSUED —', input.razorpayPaymentId, reason)

  const detail =
    `A corporate credit bundle was fulfilled but its GST invoice was NOT issued. Issue it by hand.\n\n` +
    `Reason: ${reason}\n\n` +
    `Re-run createAndSendInvoice (idempotent on the payment id, safe to repeat) with:\n` +
    `  razorpayPaymentId : ${input.razorpayPaymentId}\n` +
    `  razorpayOrderId   : ${input.razorpayOrderId ?? '(none)'}\n` +
    `  organizationId    : ${organizationId ?? '(unknown)'}\n` +
    `  companyName       : ${input.companyName}\n` +
    `  gstin             : ${input.gstin}\n` +
    `  registeredAddress : ${input.registeredAddress}\n` +
    `  placeOfSupply     : ${input.placeOfSupply}\n` +
    `  credits           : ${input.credits}\n` +
    `  list / base / gst / total : ${input.listPrice} / ${input.baseAmount} / ${input.gstAmount} / ${input.totalAmount}\n` +
    `  purchaser         : ${input.purchaserEmail} (user ${input.purchaserUserId})\n` +
    `  designated admin  : ${input.adminEmail}\n`

  try {
    await query(
      `UPDATE credit_transactions
          SET note = COALESCE(note, '') || $2
        WHERE razorpay_payment_id = $1 AND type = 'org_purchase'`,
      [input.razorpayPaymentId, `  [INVOICE NOT ISSUED — ${reason}]`]
    )
  } catch (e) {
    console.error('OKR Ally: could not stamp invoice-unissued note', e)
  }

  try {
    await sendBrevoEmail({
      to: 'pgs@embiggen.co.in',
      toName: 'Subramaniam P G',
      subject: `Action needed — OKR Ally corporate invoice not issued (${input.companyName})`,
      htmlContent: `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;white-space:pre-wrap;color:${tokens.textPrimary};">${detail
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</pre>`,
      textContent: detail,
      skipBcc: true,
    })
  } catch (e) {
    console.error('OKR Ally: invoice-unissued alert email failed', e)
  }
}

/**
 * Fulfil a confirmed corporate purchase. Idempotent on the `org_purchase`
 * partial-unique index (razorpay_payment_id) — safe to call from both
 * verify-payment and the webhook for the same payment.
 *
 * 1. Upsert the organization by GSTIN: create it, or top up `credits_purchased`
 *    on an existing one (name / address left untouched on a top-up).
 * 2. Record the `org_purchase` credit_transactions row (the idempotency guard).
 * 3. Tag the designated admin's account: `is_org_admin = true` and, only if they
 *    have no home org yet, `organization_id`. Nothing else on the account is
 *    touched — an existing personal user keeps all their data and credits.
 * 4. Issue a GST tax invoice addressed to the company (non-blocking).
 */
export async function fulfilCorporatePurchase(
  input: FulfilCorporateInput
): Promise<FulfilCorporateResult> {
  const brand: Brand = input.brand ?? DEFAULT_BRAND
  const v = vocab(brand)
  try {
    assertFulfillmentAllowed('okr-ally corporate fulfil', input.razorpayPaymentId, input.razorpayOrderId)
  } catch (e) {
    if (e instanceof FulfillmentBlockedError) {
      console.error(e.message)
      return { ok: false, alreadyProcessed: false }
    }
    throw e
  }

  const gstin = input.gstin.trim().toUpperCase()
  // Create the admin user outside the transaction (own connection); the tag
  // itself happens inside so it rolls back with everything else.
  const admin = await resolveOrCreateUser(input.adminEmail)

  const txnResult = await withTransaction(async (client: PoolClient) => {
    // Serialise all fulfilment for one company so two payments landing together
    // cannot both create the org / both miss the idempotency check.
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`okr-ally-org-fulfil:${gstin}`])

    const dup = await client.query<{ organization_id: string }>(
      `SELECT organization_id FROM credit_transactions
        WHERE razorpay_payment_id = $1 AND type = 'org_purchase'`,
      [input.razorpayPaymentId]
    )
    if (dup.rows[0]) {
      return { alreadyProcessed: true, organizationId: dup.rows[0].organization_id, creditsPurchased: 0 }
    }

    const org = await client.query<{ id: string; credits_purchased: number }>(
      `INSERT INTO organizations (name, gstin, registered_address, credits_purchased)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (gstin)
       DO UPDATE SET credits_purchased = organizations.credits_purchased + EXCLUDED.credits_purchased
       RETURNING id, credits_purchased`,
      [input.companyName.trim(), gstin, input.registeredAddress.trim(), input.credits]
    )
    const organizationId = org.rows[0].id

    await client.query(
      `INSERT INTO credit_transactions (user_id, organization_id, razorpay_payment_id, amount, type, note)
       VALUES ($1, $2, $3, $4, 'org_purchase', $5)`,
      [
        input.purchaserUserId,
        organizationId,
        input.razorpayPaymentId,
        input.credits,
        `Corporate bundle — ${input.credits} credits for ${input.companyName.trim()}`,
      ]
    )

    await client.query(
      `UPDATE users
          SET is_org_admin = true,
              organization_id = COALESCE(organization_id, $2)
        WHERE id = $1`,
      [admin.id, organizationId]
    )

    return { alreadyProcessed: false, organizationId, creditsPurchased: org.rows[0].credits_purchased }
  })

  let invoiceNumber: string | null = null
  if (!txnResult.alreadyProcessed) {
    try {
      const inv = await createAndSendInvoice({
        userId: input.purchaserUserId,
        razorpayPaymentId: input.razorpayPaymentId,
        listPrice: input.listPrice,
        baseAmount: input.baseAmount,
        gstAmount: input.gstAmount,
        totalAmount: input.totalAmount,
        discountPercent: null,
        couponCode: null,
        buyerGstin: gstin,
        buyerAddress: input.registeredAddress.trim(),
        placeOfSupply: input.placeOfSupply,
        buyerName: input.companyName.trim(),
        buyerEmail: input.purchaserEmail,
        brand,
        serviceLabel: `${v.product} — corporate ${v.reviews} (${input.credits})`,
        emailDescriptor: `for ${input.companyName.trim()}'s pool of ${v.reviews}`,
      })
      if (inv.ok) invoiceNumber = inv.invoice.invoice_number
      else await alertCorporateInvoiceUnissued(input, txnResult.organizationId, `soft-fail (${inv.reason})`)
    } catch (err) {
      await alertCorporateInvoiceUnissued(
        input,
        txnResult.organizationId,
        `threw: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // Tell the designated admin they're now running the pool. Default
  // sendBrevoEmail behaviour (no skipBcc) copies PGS — this email, like the
  // invoice, is a direct signal that a corporate payment landed correctly.
  // (Allocations from the pool afterwards are not payments and do NOT copy
  // him.) Non-blocking.
  let adminNotified = false
  if (!txnResult.alreadyProcessed) {
    try {
      const company = input.companyName.trim()
      const pool = txnResult.creditsPurchased ?? input.credits
      const added = input.credits
      const addedUnit = added === 1 ? v.review : v.reviews
      adminNotified = await sendBrevoEmail({
        to: input.adminEmail,
        toName: company,
        subject: `You're the ${v.product} admin for ${company}`,
        htmlContent: `
          <div style="font-family:Inter,Arial,sans-serif;color:${tokens.textPrimary};line-height:1.6;">
            <p>${company} has bought a pool of ${v.product} ${v.reviews}, and this email address is its admin.</p>
            <p>This purchase added <strong>${added}</strong> ${addedUnit} &mdash; the pool now holds <strong>${pool}</strong>.</p>
            <p>Your first step is to set your company's shared context — your team can't run reviews until you publish it.</p>
            <p>
              <a href="https://subramaniampg.guru${v.path}?tab=company" style="background:${tokens.primary};color:${tokens.onPrimary};padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                Set up your company
              </a>
            </p>
            <p style="font-size:13px;color:${tokens.textSecondary};">You'll be asked for a one-time code sent to this email address — sign in and you'll land on the Company tab, where you set the context, allocate ${v.reviews} to your team, and see usage.</p>
            <p style="font-size:13px;color:${tokens.textSecondary};">&mdash; Subramaniam P G</p>
          </div>`,
        textContent:
          `${company} has bought a pool of ${v.product} ${v.reviews}, and this email address is its admin. ` +
          `This purchase added ${added} ${addedUnit} — the pool now holds ${pool}.\n\n` +
          `Your first step is to set your company's shared context — your team can't run reviews until you publish it. ` +
          `Open:\n\nhttps://subramaniampg.guru${v.path}?tab=company\n\n` +
          `Sign in with a one-time code sent to this email address and you'll land on the Company tab, where you set the context, allocate ${v.reviews}, and see usage.`,
      })
    } catch (err) {
      console.error('OKR Ally corporate admin-notification failed:', input.razorpayPaymentId, err)
    }
  }

  return {
    ok: true,
    alreadyProcessed: txnResult.alreadyProcessed,
    organizationId: txnResult.organizationId,
    creditsPurchased: txnResult.creditsPurchased,
    invoiceUnissued: !txnResult.alreadyProcessed && invoiceNumber === null,
    invoiceNumber,
    adminNotified,
  }
}

// ─── Company Admin screen ─────────────────────────────────────────────────

/** Org-admin shared context limits — company gets more room (matches the
 *  individual review form), business stays at 1000. */
export const ORG_CONTEXT_MAX = 1000
export const ORG_COMPANY_CONTEXT_MAX = 2000

export interface OrgAdminContext {
  organization: { id: string; name: string; gstin: string; registeredAddress: string }
  poolPurchased: number
  poolAllocated: number
  poolAvailable: number
  /** Shared company + business context the admin publishes for the whole org
   *  (migration 011). `contextConfirmedAt` is null until "Confirm and publish". */
  companyContext: string | null
  businessContext: string | null
  contextConfirmedAt: string | null
}

export async function getOrgAdminContext(user: OkrAllyUser): Promise<OrgAdminContext> {
  const orgId = requireOrgAdmin(user)
  const r = await query<{
    id: string
    name: string
    gstin: string
    registered_address: string
    credits_purchased: number
    credits_allocated: number
    company_context: string | null
    business_context: string | null
    context_confirmed_at: string | null
  }>(
    `SELECT id, name, gstin, registered_address, credits_purchased, credits_allocated,
            company_context, business_context, context_confirmed_at
       FROM organizations WHERE id = $1`,
    [orgId]
  )
  const o = r.rows[0]
  if (!o) throw new OrgError('Organization not found')
  return {
    organization: { id: o.id, name: o.name, gstin: o.gstin, registeredAddress: o.registered_address },
    poolPurchased: o.credits_purchased,
    poolAllocated: o.credits_allocated,
    poolAvailable: o.credits_purchased - o.credits_allocated,
    companyContext: o.company_context,
    businessContext: o.business_context,
    contextConfirmedAt: o.context_confirmed_at,
  }
}

export type SetOrgContextOutcome =
  | { ok: true; contextConfirmedAt: string }
  | { ok: false; error: string }

/**
 * Org admin publishes the shared company + business context for the whole org.
 * There is no separate "save draft" — this one action both stores the text AND
 * stamps `context_confirmed_at = now()`, which is what unblocks employees. A
 * later re-publish just re-stamps it; past submissions are untouched (their
 * `context_snapshot` froze the old text at submit time).
 */
export async function setOrgContext(
  user: OkrAllyUser,
  input: { companyContext: string; businessContext: string }
): Promise<SetOrgContextOutcome> {
  const orgId = requireOrgAdmin(user)
  const company = (input.companyContext || '').trim()
  const business = (input.businessContext || '').trim()
  if (!company || !business) {
    return { ok: false, error: 'Both company context and business context are required before publishing.' }
  }
  if (company.length > ORG_COMPANY_CONTEXT_MAX) {
    return { ok: false, error: `Company context must be ${ORG_COMPANY_CONTEXT_MAX} characters or fewer.` }
  }
  if (business.length > ORG_CONTEXT_MAX) {
    return { ok: false, error: `Business context must be ${ORG_CONTEXT_MAX} characters or fewer.` }
  }
  const r = await query<{ context_confirmed_at: string }>(
    `UPDATE organizations
        SET company_context = $2, business_context = $3, context_confirmed_at = now()
      WHERE id = $1
      RETURNING context_confirmed_at`,
    [orgId, company, business]
  )
  return { ok: true, contextConfirmedAt: r.rows[0].context_confirmed_at }
}

export interface OrgContextForMember {
  organizationId: string
  organizationName: string
  companyContext: string | null
  businessContext: string | null
  /** null until the admin has run "Confirm and publish" at least once. */
  contextConfirmedAt: string | null
  /** The designated admin's email, so an employee knows who to ask. */
  adminEmail: string | null
}

/**
 * The org's shared context as seen by ANY member (admin or employee) — anyone
 * whose `users.organization_id` is this org. Returns null for a user with no
 * home org. Used by /api/okr-ally/me and the review route.
 */
export async function getOrgContextForMember(user: OkrAllyUser): Promise<OrgContextForMember | null> {
  if (!user.organization_id) return null
  const r = await query<{
    name: string
    company_context: string | null
    business_context: string | null
    context_confirmed_at: string | null
  }>(
    `SELECT name, company_context, business_context, context_confirmed_at
       FROM organizations WHERE id = $1`,
    [user.organization_id]
  )
  const o = r.rows[0]
  if (!o) return null
  const admin = await query<{ email: string }>(
    `SELECT email FROM users
      WHERE organization_id = $1 AND is_org_admin = true
      ORDER BY created_at LIMIT 1`,
    [user.organization_id]
  )
  return {
    organizationId: user.organization_id,
    organizationName: o.name,
    companyContext: o.company_context,
    businessContext: o.business_context,
    contextConfirmedAt: o.context_confirmed_at,
    adminEmail: admin.rows[0]?.email ?? null,
  }
}

class Rollback extends Error {
  constructor(
    public msg: string,
    public row?: number,
    public email?: string
  ) {
    super(msg)
  }
}

/**
 * The per-employee allocation writes, shared by the single-entry admin UI and
 * the bulk-CSV upload: lock the org row, check the pool, decrement it, tag the
 * recipient with this org (never moving them off an existing home org), log to
 * `organization_allocations`, and upsert `org_credit_balance`. Runs on
 * whatever transaction `client` belongs to — the single-entry path opens its
 * own one-row transaction; the bulk path shares one transaction across every
 * row in the file so the whole upload commits or rolls back together. Throws
 * `Rollback` (never returns an error) so either caller's `withTransaction`
 * rolls back cleanly on an insufficient pool.
 */
async function allocateOrgCreditsTx(
  client: PoolClient,
  orgId: string,
  recipient: OkrAllyUser,
  email: string,
  credits: number,
  v: BrandVocab
): Promise<{ employeeOrgBalance: number; poolAvailable: number }> {
  const org = await client.query<{ credits_purchased: number; credits_allocated: number }>(
    `SELECT credits_purchased, credits_allocated FROM organizations WHERE id = $1 FOR UPDATE`,
    [orgId]
  )
  const o = org.rows[0]
  if (!o) throw new Rollback('Organization not found.')
  const available = o.credits_purchased - o.credits_allocated
  if (credits > available) {
    throw new Rollback(
      `Only ${available === 1 ? `1 ${v.review}` : `${available} ${v.reviews}`} left in the pool. Buy more, or reclaim unused ${v.reviews} first.`
    )
  }

  await client.query(`UPDATE organizations SET credits_allocated = credits_allocated + $2 WHERE id = $1`, [
    orgId,
    credits,
  ])
  await client.query(`UPDATE users SET organization_id = COALESCE(organization_id, $2) WHERE id = $1`, [
    recipient.id,
    orgId,
  ])
  await client.query(
    `INSERT INTO organization_allocations (organization_id, user_id, email, credits_allocated)
     VALUES ($1, $2, $3, $4)`,
    [orgId, recipient.id, email, credits]
  )
  const bal = await client.query<{ credits_remaining: number }>(
    `INSERT INTO org_credit_balance (user_id, organization_id, credits_remaining)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id, organization_id)
     DO UPDATE SET credits_remaining = org_credit_balance.credits_remaining + EXCLUDED.credits_remaining,
                   updated_at = now()
     RETURNING credits_remaining`,
    [recipient.id, orgId, credits]
  )
  return { employeeOrgBalance: bal.rows[0].credits_remaining, poolAvailable: available - credits }
}

/** The "you've been given reviews" notification, shared by the single-entry
 *  and bulk allocation paths. Non-blocking by design — a failed send never
 *  rolls back an allocation that has already committed. */
async function sendAllocationEmail(
  recipient: OkrAllyUser,
  credits: number,
  v: BrandVocab,
  organizationName: string
): Promise<boolean> {
  const unit = credits === 1 ? v.review : v.reviews
  return sendBrevoEmail({
    to: recipient.email,
    toName: recipient.name,
    subject: `${credits} ${unit} from ${organizationName}`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;color:${tokens.textPrimary};line-height:1.6;">
        <p><strong>${organizationName}</strong> has given you <strong>${credits} ${unit}</strong> in ${v.product}.</p>
        <p>Sign in at <a href="https://subramaniampg.guru${v.path}">subramaniampg.guru${v.path}</a> with this email address to use them. These are separate from any ${v.reviews} you bought yourself — your reviews spend the company ones first.</p>
        <p style="font-size:13px;color:${tokens.textSecondary};">— Subramaniam P G</p>
      </div>`,
    textContent:
      `${organizationName} has given you ${credits} ${unit} in ${v.product}. ` +
      `Sign in at https://subramaniampg.guru${v.path} with this email address to use them. ` +
      `They are separate from any ${v.reviews} you bought yourself; your reviews spend the company ones first.`,
    // An org admin allocating from their own pool is not a payment event —
    // PGS is not copied. The corporate purchase itself (invoice + the
    // "you're the admin" email) already copied him.
    skipBcc: true,
  })
}

export interface AllocateResult {
  ok: true
  email: string
  name: string
  credits: number
  employeeOrgBalance: number
  poolAvailable: number
  emailed: boolean
}
export type AllocateOutcome = AllocateResult | { ok: false; error: string }

/**
 * Allocate `credits` from the org pool to an employee email. Creates the user
 * if they don't exist; tags an existing user with this org only if they have no
 * home org yet (never moves them). Logs to `organization_allocations`, credits
 * their `org_credit_balance` for this org (NOT their personal balance),
 * decrements the pool, and emails the employee. Atomic.
 */
export async function allocateOrgCredits(
  user: OkrAllyUser,
  input: { email: string; credits: number; brand?: Brand }
): Promise<AllocateOutcome> {
  const v = vocab(input.brand ?? DEFAULT_BRAND)
  const orgId = requireOrgAdmin(user)
  const email = (input.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid employee email address.' }
  const credits = Number(input.credits)
  if (!Number.isInteger(credits) || credits < 1 || credits > ALLOC_MAX) {
    return { ok: false, error: `Credits must be a whole number between 1 and ${ALLOC_MAX}.` }
  }

  const recipient = await resolveOrCreateUser(email)

  let result: { employeeOrgBalance: number; poolAvailable: number }
  try {
    result = await withTransaction((client) => allocateOrgCreditsTx(client, orgId, recipient, email, credits, v))
  } catch (e) {
    if (e instanceof Rollback) return { ok: false, error: e.msg }
    throw e
  }

  const ctx = await getOrgAdminContext(user)
  const emailed = await sendAllocationEmail(recipient, credits, v, ctx.organization.name)

  return {
    ok: true,
    email: recipient.email,
    name: recipient.name,
    credits,
    employeeOrgBalance: result.employeeOrgBalance,
    poolAvailable: result.poolAvailable,
    emailed,
  }
}

export interface BulkAllocateRowInput {
  /** The file line number this row came from (the header is row 1) — passed
   *  through by the caller so it survives any rows the caller already
   *  dropped (blank lines, wrong column count) without re-deriving it from
   *  this array's own index, which would no longer match the file. */
  row: number
  email: string
  credits: number
}
export interface BulkAllocateRowError {
  /** 1-based file line number (the header is row 1), or 0 for a whole-file error. */
  row: number
  email: string
  error: string
}
export interface BulkAllocateEmployeeResult {
  email: string
  credits: number
  emailed: boolean
}
export type BulkAllocateOutcome =
  | { ok: true; allocated: number; totalCredits: number; results: BulkAllocateEmployeeResult[] }
  | { ok: false; errors: BulkAllocateRowError[] }

/**
 * Bulk-allocate from a parsed CSV upload — one `{ row, email, credits }` row
 * per employee, in file order (the caller strips the header and any blank or
 * malformed-shape lines before calling this, but must pass through each
 * surviving row's true file line number in `row` rather than array position).
 *
 * Every row is validated up front — malformed email, non-positive/non-integer
 * amount, a duplicate email within the file, or a total exceeding the org's
 * available pool — and the whole file is rejected with a row-by-row error
 * list if any check fails. Nothing is allocated unless every row passes.
 *
 * On success, every row runs through the exact same DB writes as the
 * single-entry admin UI (`allocateOrgCreditsTx`) — same user resolution,
 * same `organization_allocations` log, same `org_credit_balance` upsert, same
 * pool decrement — but all rows share ONE transaction, so the entire file
 * commits or rolls back atomically. Notification emails (the same one the
 * single-entry path sends) go out only after that commit.
 */
export async function bulkAllocateOrgCredits(
  user: OkrAllyUser,
  rows: BulkAllocateRowInput[],
  brand?: Brand
): Promise<BulkAllocateOutcome> {
  const v = vocab(brand ?? DEFAULT_BRAND)
  const orgId = requireOrgAdmin(user)

  if (rows.length === 0) {
    return { ok: false, errors: [{ row: 0, email: '', error: 'The file has no rows to allocate.' }] }
  }

  const errors: BulkAllocateRowError[] = []
  const seen = new Set<string>()
  const normalized: { row: number; email: string; credits: number }[] = []

  rows.forEach((r) => {
    const row = r.row
    const rawEmail = (r.email || '').trim()
    const email = rawEmail.toLowerCase()
    if (!EMAIL_RE.test(email)) {
      errors.push({ row, email: rawEmail, error: 'Not a valid email address.' })
      return
    }
    const credits = Number(r.credits)
    if (!Number.isInteger(credits) || credits < 1) {
      errors.push({ row, email, error: `${v.reviews} must be a positive whole number.` })
      return
    }
    if (credits > ALLOC_MAX) {
      errors.push({ row, email, error: `${v.reviews} cannot exceed ${ALLOC_MAX} in a single allocation.` })
      return
    }
    if (seen.has(email)) {
      errors.push({ row, email, error: 'Duplicate email — already appears earlier in this file.' })
      return
    }
    seen.add(email)
    normalized.push({ row, email, credits })
  })

  if (errors.length > 0) return { ok: false, errors }

  const totalRequested = normalized.reduce((sum, r) => sum + r.credits, 0)
  const ctxBefore = await getOrgAdminContext(user)
  if (totalRequested > ctxBefore.poolAvailable) {
    return {
      ok: false,
      errors: [
        {
          row: 0,
          email: '',
          error: `The file requests ${reviewCount(v.key, totalRequested)}, but only ${reviewCount(v.key, ctxBefore.poolAvailable)} are available in the pool.`,
        },
      ],
    }
  }

  // Resolve/create every recipient outside the transaction, same as the
  // single-entry path. Independent, already-deduplicated emails, so this is
  // safe to run concurrently rather than one round-trip at a time.
  const recipientEntries = await Promise.all(
    normalized.map(async (r) => [r.email, await resolveOrCreateUser(r.email)] as const)
  )
  const recipients = new Map(recipientEntries)

  let txResults: { email: string; credits: number }[]
  try {
    txResults = await withTransaction(async (client) => {
      const out: { email: string; credits: number }[] = []
      for (const r of normalized) {
        const recipient = recipients.get(r.email)!
        try {
          await allocateOrgCreditsTx(client, orgId, recipient, r.email, r.credits, v)
        } catch (e) {
          if (e instanceof Rollback) {
            e.row = r.row
            e.email = r.email
          }
          throw e
        }
        out.push({ email: recipient.email, credits: r.credits })
      }
      return out
    })
  } catch (e) {
    if (e instanceof Rollback) {
      return {
        ok: false,
        errors: [
          {
            row: e.row ?? 0,
            email: e.email ?? '',
            error: `${e.msg} (the pool changed after this file was checked — nothing in this upload was allocated)`,
          },
        ],
      }
    }
    throw e
  }

  // Notifications go out after commit, bounded to a handful in flight at once
  // so a large upload doesn't burst past Brevo's rate limit. sendBrevoEmail
  // never throws (it returns false on any failure), so one bad send can't
  // take down the rest of the batch or make an already-committed upload look
  // like it failed.
  const EMAIL_CONCURRENCY = 10
  const results: BulkAllocateEmployeeResult[] = new Array(txResults.length)
  let next = 0
  async function sendNext() {
    while (next < txResults.length) {
      const i = next++
      const { email, credits } = txResults[i]
      const recipient = recipients.get(email)!
      const emailed = await sendAllocationEmail(recipient, credits, v, ctxBefore.organization.name)
      results[i] = { email, credits, emailed }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(EMAIL_CONCURRENCY, txResults.length) }, sendNext)
  )

  return { ok: true, allocated: results.length, totalCredits: totalRequested, results }
}

export interface ReclaimResult {
  ok: true
  email: string
  reclaimed: number
  employeeOrgBalance: number
  poolAvailable: number
}
export type ReclaimOutcome = ReclaimResult | { ok: false; error: string }

/**
 * Reclaim an employee's UNUSED org credits back into the pool. Keyed by email.
 * Takes exactly the current `org_credit_balance` for this employee+org (never
 * negative, never clawing back credits already spent on reviews), zeroes their
 * org balance, returns that amount to the pool, and logs a negative
 * `organization_allocations` row.
 */
export async function reclaimOrgCredits(
  user: OkrAllyUser,
  input: { email: string; brand?: Brand }
): Promise<ReclaimOutcome> {
  const v = vocab(input.brand ?? DEFAULT_BRAND)
  const orgId = requireOrgAdmin(user)
  const email = (input.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid employee email address.' }

  const u = await query<{ id: string; email: string }>(`SELECT id, email FROM users WHERE email = $1`, [email])
  const recipient = u.rows[0]
  if (!recipient) return { ok: false, error: 'No employee with that email.' }

  const allocated = await query<{ n: string }>(
    `SELECT COALESCE(SUM(credits_allocated) FILTER (WHERE credits_allocated > 0), 0) AS n
       FROM organization_allocations WHERE organization_id = $1 AND lower(email) = lower($2)`,
    [orgId, email]
  )
  if (Number(allocated.rows[0].n) === 0) {
    return { ok: false, error: `Your organization has not allocated ${v.reviews} to that email.` }
  }

  const out = await withTransaction(async (client) => {
    const bal = await client.query<{ credits_remaining: number }>(
      `SELECT credits_remaining FROM org_credit_balance
        WHERE user_id = $1 AND organization_id = $2 FOR UPDATE`,
      [recipient.id, orgId]
    )
    const r = bal.rows[0]?.credits_remaining ?? 0
    if (r > 0) {
      await client.query(
        `UPDATE org_credit_balance SET credits_remaining = 0, updated_at = now()
          WHERE user_id = $1 AND organization_id = $2`,
        [recipient.id, orgId]
      )
      await client.query(`UPDATE organizations SET credits_allocated = credits_allocated - $2 WHERE id = $1`, [
        orgId,
        r,
      ])
      await client.query(
        `INSERT INTO organization_allocations (organization_id, user_id, email, credits_allocated)
         VALUES ($1, $2, $3, $4)`,
        [orgId, recipient.id, recipient.email, -r]
      )
    }
    const org = await client.query<{ credits_purchased: number; credits_allocated: number }>(
      `SELECT credits_purchased, credits_allocated FROM organizations WHERE id = $1`,
      [orgId]
    )
    return { reclaimed: r, poolAvailable: org.rows[0].credits_purchased - org.rows[0].credits_allocated }
  })

  return {
    ok: true,
    email: recipient.email,
    reclaimed: out.reclaimed,
    employeeOrgBalance: 0,
    poolAvailable: out.poolAvailable,
  }
}

// ─── Per-employee usage report ───────────────────────────────────────────

export interface EmployeeOrgReport {
  organizationName: string
  email: string
  name: string | null
  /** Gross credits this org has allocated to this email (excludes reclaims). */
  allocated: number
  /** Credits this org has reclaimed from this email. */
  reclaimed: number
  /** Credits this email has spent on reviews funded by this org. */
  used: number
  /** Credits still available to this email from this org. */
  remaining: number
  ledger: { credits: number; at: string; kind: 'allocation' | 'reclaim' }[]
}

/**
 * Exactly what THIS organization allocated to / reclaimed from / this email has
 * used and has left — sourced only from `organization_allocations` +
 * `org_credit_balance` scoped to the admin's org. Touches nothing in the
 * employee's personal account (`user_credit_balance`, personal
 * `credit_transactions`, submissions). Returns null if the org never allocated
 * to that email.
 */
export async function getEmployeeOrgReport(
  user: OkrAllyUser,
  emailInput: string
): Promise<EmployeeOrgReport | null> {
  const orgId = requireOrgAdmin(user)
  const email = (emailInput || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw new OrgError('Enter a valid employee email address.')

  const org = await query<{ name: string }>(`SELECT name FROM organizations WHERE id = $1`, [orgId])
  const agg = await query<{ gross: string; reclaimed: string; net: string }>(
    `SELECT
        COALESCE(SUM(credits_allocated) FILTER (WHERE credits_allocated > 0), 0) AS gross,
        COALESCE(-SUM(credits_allocated) FILTER (WHERE credits_allocated < 0), 0) AS reclaimed,
        COALESCE(SUM(credits_allocated), 0) AS net
       FROM organization_allocations
      WHERE organization_id = $1 AND lower(email) = lower($2)`,
    [orgId, email]
  )
  const gross = Number(agg.rows[0].gross)
  if (gross === 0) return null

  const u = await query<{ id: string; name: string }>(`SELECT id, name FROM users WHERE email = $1`, [email])
  const balRow = u.rows[0]
    ? await query<{ credits_remaining: number }>(
        `SELECT credits_remaining FROM org_credit_balance WHERE user_id = $1 AND organization_id = $2`,
        [u.rows[0].id, orgId]
      )
    : null
  const remaining = balRow?.rows[0]?.credits_remaining ?? 0
  const net = Number(agg.rows[0].net)
  const used = net - remaining

  const led = await query<{ credits_allocated: number; allocated_at: string }>(
    `SELECT credits_allocated, allocated_at FROM organization_allocations
      WHERE organization_id = $1 AND lower(email) = lower($2)
      ORDER BY allocated_at`,
    [orgId, email]
  )

  return {
    organizationName: org.rows[0]?.name ?? '',
    email,
    name: u.rows[0]?.name ?? null,
    allocated: gross,
    reclaimed: Number(agg.rows[0].reclaimed),
    used: Math.max(0, used),
    remaining,
    ledger: led.rows.map((r) => ({
      credits: r.credits_allocated,
      at: r.allocated_at,
      kind: r.credits_allocated >= 0 ? 'allocation' : 'reclaim',
    })),
  }
}

/** The usage report as a PDF (jsPDF, same font conventions as the review report). */
export async function renderOrgReportPdf(
  report: EmployeeOrgReport,
  brand: Brand = DEFAULT_BRAND
): Promise<Buffer> {
  const v = vocab(brand)
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const M = 18
  const PW = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text(`${v.product} — ${v.review} usage report`, M, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(pdfSafe(report.organizationName), M, y)
  y += 5
  doc.text(`Employee: ${pdfSafe(report.name ? `${report.name} <${report.email}>` : report.email)}`, M, y)
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(
    `Generated ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
    M,
    y
  )
  doc.setTextColor(0)
  y += 10

  const rows: [string, string][] = [
    [`${v.reviews} allocated by this organization`, String(report.allocated)],
    ['Used on reviews', String(report.used)],
    ['Reclaimed by this organization', String(report.reclaimed)],
    ['Remaining', String(report.remaining)],
  ]
  doc.setDrawColor(200)
  doc.line(M, y, PW - M, y)
  y += 6
  doc.setFontSize(11)
  for (const [label, value] of rows) {
    doc.setFont('helvetica', label === 'Remaining' ? 'bold' : 'normal')
    doc.text(label, M, y)
    doc.text(value, PW - M, y, { align: 'right' })
    y += 7
  }
  doc.line(M, y, PW - M, y)
  y += 12

  if (report.ledger.length) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text('Allocation history', M, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    for (const e of report.ledger) {
      if (y > 275) {
        doc.addPage()
        y = 20
      }
      const when = new Date(e.at).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      const label = e.kind === 'allocation' ? `Allocated ${e.credits}` : `Reclaimed ${-e.credits}`
      doc.text(when, M, y)
      doc.text(label, M + 40, y)
      y += 5
    }
    y += 6
  }

  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text(
    pdfSafe(
      `These figures cover ${report.organizationName} only and are independent of this employee's personal OKR Ally account.`
    ),
    M,
    y
  )

  return Buffer.from(doc.output('arraybuffer'))
}
