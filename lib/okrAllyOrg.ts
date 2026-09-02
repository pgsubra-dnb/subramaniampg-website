import type { PoolClient } from 'pg'
import { query, withTransaction, resolveOrCreateUser, type OkrAllyUser } from '@/lib/okrAlly'
import { gstBreakdown } from '@/lib/okrAllyBilling'
import { createAndSendInvoice } from '@/lib/okrAllyInvoice'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { pdfSafe } from '@/lib/okrAllyReport'
import { assertFulfillmentAllowed, FulfillmentBlockedError } from '@/lib/fulfillmentGuard'

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
      htmlContent: `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;white-space:pre-wrap;color:#2C2C2A;">${detail
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
        serviceLabel: `OKR Ally — corporate review credits (${input.credits})`,
        emailDescriptor: `for ${input.companyName.trim()}'s OKR Ally credit bundle`,
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
      adminNotified = await sendBrevoEmail({
        to: input.adminEmail,
        toName: company,
        subject: `You're the OKR Ally admin for ${company}`,
        htmlContent: `
          <div style="font-family:Inter,Arial,sans-serif;color:#2C2C2A;line-height:1.6;">
            <p>${company} has bought a pool of OKR Ally review credits, and this email address is its admin.</p>
            <p>This purchase added <strong>${added}</strong> credit${added === 1 ? '' : 's'} &mdash; the pool now holds <strong>${pool}</strong>.</p>
            <p>Your first step is to set your company's shared context — your team can't run reviews until you publish it.</p>
            <p>
              <a href="https://subramaniampg.guru/okr-ally?tab=company" style="background:#1F6F54;color:#FAF8F5;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
                Set up your company
              </a>
            </p>
            <p style="font-size:13px;color:#6b6b66;">Sign in with this email address — it opens straight to the Company tab, where you set the context, allocate credits to your team, and see usage.</p>
            <p style="font-size:13px;color:#6b6b66;">&mdash; Subramaniam P G</p>
          </div>`,
        textContent:
          `${company} has bought a pool of OKR Ally review credits, and this email address is its admin. ` +
          `This purchase added ${added} credit${added === 1 ? '' : 's'} — the pool now holds ${pool}.\n\n` +
          `Your first step is to set your company's shared context — your team can't run reviews until you publish it. ` +
          `Sign in with this email address at:\n\nhttps://subramaniampg.guru/okr-ally?tab=company\n\n` +
          `That opens straight to the Company tab, where you set the context, allocate credits, and see usage.`,
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

export const ORG_CONTEXT_MAX = 1000

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
  if (company.length > ORG_CONTEXT_MAX || business.length > ORG_CONTEXT_MAX) {
    return { ok: false, error: `Each field must be ${ORG_CONTEXT_MAX} characters or fewer.` }
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
  constructor(public msg: string) {
    super(msg)
  }
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
  input: { email: string; credits: number }
): Promise<AllocateOutcome> {
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
    result = await withTransaction(async (client) => {
      const org = await client.query<{ credits_purchased: number; credits_allocated: number }>(
        `SELECT credits_purchased, credits_allocated FROM organizations WHERE id = $1 FOR UPDATE`,
        [orgId]
      )
      const o = org.rows[0]
      if (!o) throw new Rollback('Organization not found.')
      const available = o.credits_purchased - o.credits_allocated
      if (credits > available) {
        throw new Rollback(
          `Only ${available} credit${available === 1 ? '' : 's'} left in the pool. Buy more, or reclaim unused credits first.`
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
    })
  } catch (e) {
    if (e instanceof Rollback) return { ok: false, error: e.msg }
    throw e
  }

  const ctx = await getOrgAdminContext(user)
  const plural = credits === 1 ? 'credit' : 'credits'
  const emailed = await sendBrevoEmail({
    to: recipient.email,
    toName: recipient.name,
    subject: `${credits} OKR Ally review ${plural} from ${ctx.organization.name}`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;color:#2C2C2A;line-height:1.6;">
        <p><strong>${ctx.organization.name}</strong> has given you <strong>${credits} OKR Ally review ${plural}</strong>.</p>
        <p>Sign in at <a href="https://subramaniampg.guru/okr-ally">subramaniampg.guru/okr-ally</a> with this email address to use them. These are separate from any personal credits you may have — your reviews spend the company credits first.</p>
        <p style="font-size:13px;color:#6b6b66;">— Subramaniam P G</p>
      </div>`,
    textContent:
      `${ctx.organization.name} has given you ${credits} OKR Ally review ${plural}. ` +
      `Sign in at https://subramaniampg.guru/okr-ally with this email address to use them. ` +
      `They are separate from any personal credits; your reviews spend the company credits first.`,
    // An org admin allocating from their own pool is not a payment event —
    // PGS is not copied. The corporate purchase itself (invoice + the
    // "you're the admin" email) already copied him.
    skipBcc: true,
  })

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
  input: { email: string }
): Promise<ReclaimOutcome> {
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
    return { ok: false, error: 'Your organization has not allocated credits to that email.' }
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
export async function renderOrgReportPdf(report: EmployeeOrgReport): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const M = 18
  const PW = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('OKR Ally — Credit usage report', M, y)
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
    ['Allocated by this organization', String(report.allocated)],
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
