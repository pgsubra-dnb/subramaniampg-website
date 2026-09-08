import type { PoolClient } from 'pg'
import { query, withTransaction } from '@/lib/okrAlly'
import { gstBreakdown } from '@/lib/okrAllyBilling'
import { createAndSendInvoice } from '@/lib/okrAllyInvoice'
import { assertFulfillmentAllowed, FulfillmentBlockedError } from '@/lib/fulfillmentGuard'
import { sanityClient, sendBrevoEmail, enrolLearnerByEmail } from '@/lib/academy'

/**
 * Academy — corporate bulk purchase & seat assignment.
 *
 * A company buys N seats of ONE named course against its GSTIN (flat price:
 * course price × seats + 18% GST, a coupon may discount). A designated admin
 * then assigns seats to employee emails — each assignment enrols that employee
 * (a Sanity learnerRecord) in the course and emails a login link. Unused seats
 * can be revoked while the employee has not started.
 *
 * The org / seat pool / assignment ledger / purchase-idempotency lives in Neon
 * (db/academy-corporate-schema-001.sql). Learner PROGRESS stays in Sanity.
 * GST invoices go through the shared house series via lib/okrAllyInvoice.ts
 * (createAndSendInvoice, user_id = NULL) — exactly like paid consulting.
 *
 * Shape mirrors lib/okrAllyOrg.ts, simplified: a seat assignment is terminal
 * (it enrols the employee), so there is no per-employee spendable balance.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
/** Sanity has no more than a few hundred lessons per course; a defensive cap. */
const BULK_MAX_ROWS = 1000

export class AcademyOrgError extends Error {}

class Rollback extends Error {
  constructor(
    public msg: string,
    public row?: number,
    public email?: string
  ) {
    super(msg)
  }
}

// ─── Pricing ──────────────────────────────────────────────────────────────

export interface SeatPricing {
  seats: number
  /** INR excl. GST — undiscounted course price × seats. */
  listPrice: number
  /** INR excl. GST — net taxable value after any coupon. */
  base: number
  gst: number
  total: number
  amountInPaise: number
  discountPercent: number
}

/** Flat pricing: course price × seats, then an optional percentage coupon, then 18% GST. */
export function seatPricing(coursePrice: number, seats: number, discountPercent = 0): SeatPricing {
  const n = Math.max(1, Math.floor(seats))
  const pct = Math.min(100, Math.max(0, discountPercent))
  const listPrice = Math.round(coursePrice) * n
  const discounted = Math.round(listPrice * (1 - pct / 100))
  const g = gstBreakdown(discounted)
  return {
    seats: n,
    listPrice,
    base: g.base,
    gst: g.gst,
    total: g.total,
    amountInPaise: g.amountInPaise,
    discountPercent: pct,
  }
}

// ─── Corporate purchase fulfilment (verify-payment + webhook) ──────────────

export interface FulfilAcademyCorporateInput {
  /** Buyer email — where the GST invoice PDF is sent. */
  purchaserEmail: string
  companyName: string
  gstin: string
  registeredAddress: string
  /** Buyer state name — place of supply on the invoice. */
  placeOfSupply: string
  adminEmail: string
  courseId: string
  courseSlug: string
  courseTitle: string
  seats: number
  listPrice: number
  baseAmount: number
  gstAmount: number
  totalAmount: number
  discountPercent: number | null
  couponCode: string | null
  razorpayPaymentId: string
  razorpayOrderId: string | null
}

export interface FulfilAcademyCorporateResult {
  ok: boolean
  alreadyProcessed: boolean
  organizationId?: string
  invoiceNumber?: string | null
  /** True when the pool was created but the GST invoice did NOT issue — the one
   *  step with no automatic retry. PGS has been emailed and the purchase row
   *  note stamped. */
  invoiceUnissued?: boolean
}

async function alertInvoiceUnissued(
  input: FulfilAcademyCorporateInput,
  organizationId: string | undefined,
  reason: string
): Promise<void> {
  console.error('Academy corporate invoice UNISSUED —', input.razorpayPaymentId, reason)

  const detail =
    `An Academy corporate seat purchase was fulfilled but its GST invoice was NOT issued. Issue it by hand.\n\n` +
    `Reason: ${reason}\n\n` +
    `Re-run createAndSendInvoice (idempotent on the payment id, safe to repeat) with:\n` +
    `  razorpayPaymentId : ${input.razorpayPaymentId}\n` +
    `  razorpayOrderId   : ${input.razorpayOrderId ?? '(none)'}\n` +
    `  organizationId    : ${organizationId ?? '(unknown)'}\n` +
    `  companyName       : ${input.companyName}\n` +
    `  gstin             : ${input.gstin}\n` +
    `  registeredAddress : ${input.registeredAddress}\n` +
    `  placeOfSupply     : ${input.placeOfSupply}\n` +
    `  course            : ${input.courseTitle} (${input.courseId})\n` +
    `  seats             : ${input.seats}\n` +
    `  list / base / gst / total : ${input.listPrice} / ${input.baseAmount} / ${input.gstAmount} / ${input.totalAmount}\n` +
    `  coupon            : ${input.couponCode ?? '(none)'}\n` +
    `  buyer email       : ${input.purchaserEmail}\n` +
    `  designated admin  : ${input.adminEmail}\n`

  try {
    await query(
      `UPDATE academy_corp_purchases
          SET note = COALESCE(note, '') || $2
        WHERE razorpay_payment_id = $1`,
      [input.razorpayPaymentId, `  [INVOICE NOT ISSUED — ${reason}]`]
    )
  } catch (e) {
    console.error('Academy corporate: could not stamp invoice-unissued note', e)
  }

  try {
    await sendBrevoEmail(
      'pgs@embiggen.co.in',
      `Action needed — Academy corporate invoice not issued (${input.companyName})`,
      `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;white-space:pre-wrap;">${detail
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')}</pre>`,
      true
    )
  } catch (e) {
    console.error('Academy corporate: invoice-unissued alert email failed', e)
  }
}

/**
 * Fulfil a confirmed corporate seat purchase. Idempotent on
 * academy_corp_purchases.razorpay_payment_id — safe to call from both
 * verify-payment and the webhook for the same payment.
 *
 * 1. Upsert academy_organizations by GSTIN (create, or reuse an existing one —
 *    name / address / admin_email left as first set on a repeat purchase).
 * 2. Upsert academy_course_seats for (org, course): seats_purchased += seats.
 * 3. Insert the academy_corp_purchases idempotency row.
 * 4. Issue a GST tax invoice addressed to the company (non-blocking).
 * 5. Email the designated admin that they now manage the pool.
 */
export async function fulfilAcademyCorporatePurchase(
  input: FulfilAcademyCorporateInput
): Promise<FulfilAcademyCorporateResult> {
  try {
    assertFulfillmentAllowed('academy corporate fulfil', input.razorpayPaymentId, input.razorpayOrderId)
  } catch (e) {
    if (e instanceof FulfillmentBlockedError) {
      console.error(e.message)
      return { ok: false, alreadyProcessed: false }
    }
    throw e
  }

  const gstin = input.gstin.trim().toUpperCase()
  const adminEmail = input.adminEmail.trim().toLowerCase()

  const txn = await withTransaction(async (client: PoolClient) => {
    await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`academy-org-fulfil:${gstin}`])

    const dup = await client.query<{ organization_id: string; invoice_number: string | null }>(
      `SELECT organization_id, invoice_number FROM academy_corp_purchases WHERE razorpay_payment_id = $1`,
      [input.razorpayPaymentId]
    )
    if (dup.rows[0]) {
      return {
        alreadyProcessed: true,
        organizationId: dup.rows[0].organization_id,
        invoiceNumber: dup.rows[0].invoice_number,
      }
    }

    const org = await client.query<{ id: string }>(
      `INSERT INTO academy_organizations (name, gstin, registered_address, admin_email)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (gstin) DO UPDATE SET name = academy_organizations.name
       RETURNING id`,
      [input.companyName.trim(), gstin, input.registeredAddress.trim(), adminEmail]
    )
    const organizationId = org.rows[0].id

    await client.query(
      `INSERT INTO academy_course_seats
         (organization_id, course_id, course_slug, course_title, seats_purchased)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (organization_id, course_id)
       DO UPDATE SET seats_purchased = academy_course_seats.seats_purchased + EXCLUDED.seats_purchased`,
      [organizationId, input.courseId, input.courseSlug, input.courseTitle.trim(), input.seats]
    )

    await client.query(
      `INSERT INTO academy_corp_purchases
         (organization_id, razorpay_payment_id, razorpay_order_id, course_id, seats,
          list_price, base_amount, gst_amount, total_amount, coupon_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        organizationId,
        input.razorpayPaymentId,
        input.razorpayOrderId,
        input.courseId,
        input.seats,
        input.listPrice,
        input.baseAmount,
        input.gstAmount,
        input.totalAmount,
        input.couponCode,
      ]
    )

    return { alreadyProcessed: false, organizationId, invoiceNumber: null as string | null }
  })

  if (txn.alreadyProcessed) {
    return {
      ok: true,
      alreadyProcessed: true,
      organizationId: txn.organizationId,
      invoiceNumber: txn.invoiceNumber,
    }
  }

  let invoiceNumber: string | null = null
  try {
    const seatWord = input.seats === 1 ? 'seat' : 'seats'
    const inv = await createAndSendInvoice({
      userId: null,
      razorpayPaymentId: input.razorpayPaymentId,
      listPrice: input.listPrice,
      baseAmount: input.baseAmount,
      gstAmount: input.gstAmount,
      totalAmount: input.totalAmount,
      discountPercent: input.discountPercent,
      couponCode: input.couponCode,
      buyerGstin: gstin,
      buyerAddress: input.registeredAddress.trim(),
      placeOfSupply: input.placeOfSupply,
      buyerName: input.companyName.trim(),
      buyerEmail: input.purchaserEmail,
      serviceLabel: `Academy — ${input.courseTitle.trim()} (${input.seats} ${seatWord})`,
      emailDescriptor: `for ${input.companyName.trim()}'s purchase of ${input.seats} ${seatWord} of ${input.courseTitle.trim()}`,
      emailSubjectTag: ' — Academy',
    })
    if (inv.ok) {
      invoiceNumber = inv.invoice.invoice_number
      await query(`UPDATE academy_corp_purchases SET invoice_number = $2 WHERE razorpay_payment_id = $1`, [
        input.razorpayPaymentId,
        invoiceNumber,
      ])
    } else {
      await alertInvoiceUnissued(input, txn.organizationId, `soft-fail (${inv.reason})`)
    }
  } catch (err) {
    await alertInvoiceUnissued(
      input,
      txn.organizationId,
      `threw: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  try {
    const company = input.companyName.trim()
    const seatWord = input.seats === 1 ? 'seat' : 'seats'
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
    await sendBrevoEmail(
      input.adminEmail,
      `You manage ${company}'s Academy seats`,
      `
        <p>${company} has bought <strong>${input.seats} ${seatWord}</strong> of
        <strong>${input.courseTitle.trim()}</strong>, and this email address manages them.</p>
        <p>Sign in with this email at
        <a href="${siteUrl}/academy/company">${siteUrl}/academy/company</a>
        to assign seats to your team's email addresses, track progress, and reclaim
        any unused seat before someone starts.</p>
        <p>Each person you assign is enrolled automatically and gets their own login link.</p>
        <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
      `
    )
  } catch (err) {
    console.error('Academy corporate admin-notification failed:', input.razorpayPaymentId, err)
  }

  return {
    ok: true,
    alreadyProcessed: false,
    organizationId: txn.organizationId,
    invoiceNumber,
    invoiceUnissued: invoiceNumber === null,
  }
}

// ─── Admin gate ───────────────────────────────────────────────────────────

export interface AcademyOrg {
  id: string
  name: string
  gstin: string
  registeredAddress: string
  adminEmail: string
}

/**
 * The company an email administers, or throws AcademyOrgError. If the same
 * address is admin for more than one company (rare), the most recent wins.
 */
export async function requireAcademyOrgAdmin(sessionEmail: string): Promise<AcademyOrg> {
  const email = (sessionEmail || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) throw new AcademyOrgError('Not a company admin')
  const r = await query<{
    id: string
    name: string
    gstin: string
    registered_address: string
    admin_email: string
  }>(
    `SELECT id, name, gstin, registered_address, admin_email
       FROM academy_organizations
      WHERE lower(admin_email) = $1
      ORDER BY created_at DESC
      LIMIT 1`,
    [email]
  )
  const o = r.rows[0]
  if (!o) throw new AcademyOrgError('Not a company admin')
  return {
    id: o.id,
    name: o.name,
    gstin: o.gstin,
    registeredAddress: o.registered_address,
    adminEmail: o.admin_email,
  }
}

/** True if the email administers any company — for the dashboard link. */
export async function isAcademyOrgAdmin(sessionEmail: string): Promise<boolean> {
  try {
    await requireAcademyOrgAdmin(sessionEmail)
    return true
  } catch {
    return false
  }
}

// ─── Seat assignment ──────────────────────────────────────────────────────

interface SeatRow {
  id: string
  organization_id: string
  course_id: string
  course_slug: string
  course_title: string
  seats_purchased: number
  seats_assigned: number
}

async function getSeatRowForOrg(orgId: string, courseSeatsId: string): Promise<SeatRow> {
  const r = await query<SeatRow>(
    `SELECT id, organization_id, course_id, course_slug, course_title, seats_purchased, seats_assigned
       FROM academy_course_seats WHERE id = $1 AND organization_id = $2`,
    [courseSeatsId, orgId]
  )
  if (!r.rows[0]) throw new AcademyOrgError('That course pool does not belong to your company.')
  return r.rows[0]
}

/**
 * Reserve one seat in the given pool for `email` — the DB side only. Locks the
 * pool row, checks availability + no duplicate active assignment, bumps the
 * counter, inserts the assignment row (learner_id NULL — the Sanity enrolment
 * happens after the transaction commits). Throws Rollback on an empty pool or a
 * duplicate so the caller's withTransaction rolls back cleanly.
 */
async function reserveSeatTx(
  client: PoolClient,
  seatRowId: string,
  orgId: string,
  email: string
): Promise<string> {
  const s = await client.query<{ seats_purchased: number; seats_assigned: number }>(
    `SELECT seats_purchased, seats_assigned FROM academy_course_seats WHERE id = $1 FOR UPDATE`,
    [seatRowId]
  )
  const row = s.rows[0]
  if (!row) throw new Rollback('That course pool no longer exists.')
  if (row.seats_purchased - row.seats_assigned < 1) {
    throw new Rollback('No seats left in this pool. Buy more, or revoke an unused seat first.')
  }
  const dup = await client.query(
    `SELECT 1 FROM academy_seat_assignments
      WHERE course_seats_id = $1 AND lower(email) = $2 AND status = 'assigned'`,
    [seatRowId, email]
  )
  if (dup.rowCount) throw new Rollback(`${email} already holds a seat for this course.`)

  await client.query(
    `UPDATE academy_course_seats SET seats_assigned = seats_assigned + 1 WHERE id = $1`,
    [seatRowId]
  )
  const ins = await client.query<{ id: string }>(
    `INSERT INTO academy_seat_assignments (organization_id, course_seats_id, email, status)
     VALUES ($1, $2, $3, 'assigned')
     RETURNING id`,
    [orgId, seatRowId, email]
  )
  return ins.rows[0].id
}

/** Enrol the seat holder in Sanity and email their login link. Best-effort;
 *  a failure here leaves a reserved seat with no enrolment, which the admin
 *  screen shows as "Enrolment pending" with a Resend action. */
async function enrolAssignedSeat(
  assignmentId: string,
  email: string,
  course: { id: string; slug: string; title: string },
  companyName: string
): Promise<{ enrolled: boolean; emailed: boolean; alreadyEnrolled: boolean }> {
  try {
    const res = await enrolLearnerByEmail(email, course, {
      sendWelcomeEmail: true,
      customEmail: {
        subject: `${companyName} has enrolled you in ${course.title}`,
        introHtml: `<p><strong>${companyName}</strong> has given you a seat in <strong>${course.title}</strong> on the Embiggen Academy.</p>`,
      },
    })
    await query(`UPDATE academy_seat_assignments SET learner_id = $2 WHERE id = $1`, [
      assignmentId,
      res.learnerId,
    ])
    return { enrolled: true, emailed: res.welcomeEmailSent, alreadyEnrolled: res.alreadyEnrolled }
  } catch (e) {
    console.error('Academy corporate: seat enrolment failed', assignmentId, email, e)
    return { enrolled: false, emailed: false, alreadyEnrolled: false }
  }
}

export interface AssignResult {
  ok: true
  email: string
  enrolled: boolean
  emailed: boolean
  alreadyEnrolled: boolean
  poolAvailable: number
}
export type AssignOutcome = AssignResult | { ok: false; error: string }

/** Assign one seat from a pool to an employee email. */
export async function assignSeat(
  sessionEmail: string,
  input: { courseSeatsId: string; email: string }
): Promise<AssignOutcome> {
  const org = await requireAcademyOrgAdmin(sessionEmail)
  const email = (input.email || '').trim().toLowerCase()
  if (!EMAIL_RE.test(email)) return { ok: false, error: 'Enter a valid employee email address.' }

  const seatRow = await getSeatRowForOrg(org.id, input.courseSeatsId)
  const course = { id: seatRow.course_id, slug: seatRow.course_slug, title: seatRow.course_title }

  let assignmentId: string
  try {
    assignmentId = await withTransaction((client) => reserveSeatTx(client, seatRow.id, org.id, email))
  } catch (e) {
    if (e instanceof Rollback) return { ok: false, error: e.msg }
    throw e
  }

  const enrol = await enrolAssignedSeat(assignmentId, email, course, org.name)
  const avail = await poolAvailable(seatRow.id)

  return {
    ok: true,
    email,
    enrolled: enrol.enrolled,
    emailed: enrol.emailed,
    alreadyEnrolled: enrol.alreadyEnrolled,
    poolAvailable: avail,
  }
}

async function poolAvailable(seatRowId: string): Promise<number> {
  const r = await query<{ seats_purchased: number; seats_assigned: number }>(
    `SELECT seats_purchased, seats_assigned FROM academy_course_seats WHERE id = $1`,
    [seatRowId]
  )
  const row = r.rows[0]
  return row ? row.seats_purchased - row.seats_assigned : 0
}

export interface BulkAssignRowError {
  row: number
  email: string
  error: string
}
export interface BulkAssignEmployeeResult {
  email: string
  enrolled: boolean
  emailed: boolean
  alreadyEnrolled: boolean
}
export type BulkAssignOutcome =
  | { ok: true; assigned: number; poolAvailable: number; results: BulkAssignEmployeeResult[] }
  | { ok: false; errors: BulkAssignRowError[] }

/**
 * Bulk-assign one seat each to a list of employee emails from a CSV upload
 * (the caller parses the file and passes `{ row, email }` per data line, `row`
 * being the true file line number).
 *
 * Every row is validated up front — bad email, a duplicate within the file, an
 * email that already holds an active seat for this course, or a count that
 * exceeds the pool. If any check fails, the whole file is rejected with a
 * row-by-row list and nothing is assigned. On success all rows share ONE
 * transaction (all-or-nothing); Sanity enrolments + emails run after commit.
 */
export async function bulkAssignSeats(
  sessionEmail: string,
  input: { courseSeatsId: string; rows: { row: number; email: string }[] }
): Promise<BulkAssignOutcome> {
  const org = await requireAcademyOrgAdmin(sessionEmail)

  if (input.rows.length === 0) {
    return { ok: false, errors: [{ row: 0, email: '', error: 'The file has no rows.' }] }
  }
  if (input.rows.length > BULK_MAX_ROWS) {
    return { ok: false, errors: [{ row: 0, email: '', error: `Too many rows (max ${BULK_MAX_ROWS}).` }] }
  }

  const seatRow = await getSeatRowForOrg(org.id, input.courseSeatsId)
  const course = { id: seatRow.course_id, slug: seatRow.course_slug, title: seatRow.course_title }

  const errors: BulkAssignRowError[] = []
  const seen = new Set<string>()
  const emails: { row: number; email: string }[] = []

  input.rows.forEach((r) => {
    const raw = (r.email || '').trim()
    const email = raw.toLowerCase()
    if (!EMAIL_RE.test(email)) {
      errors.push({ row: r.row, email: raw, error: 'Not a valid email address.' })
      return
    }
    if (seen.has(email)) {
      errors.push({ row: r.row, email, error: 'Duplicate — already appears earlier in this file.' })
      return
    }
    seen.add(email)
    emails.push({ row: r.row, email })
  })
  if (errors.length) return { ok: false, errors }

  // Already-assigned check + pool-size check, before touching anything.
  const existing = await query<{ email: string }>(
    `SELECT lower(email) AS email FROM academy_seat_assignments
      WHERE course_seats_id = $1 AND status = 'assigned' AND lower(email) = ANY($2)`,
    [seatRow.id, emails.map((e) => e.email)]
  )
  const already = new Set(existing.rows.map((r) => r.email))
  for (const e of emails) {
    if (already.has(e.email)) {
      errors.push({ row: e.row, email: e.email, error: 'Already holds a seat for this course.' })
    }
  }
  if (errors.length) return { ok: false, errors }

  const available = seatRow.seats_purchased - seatRow.seats_assigned
  if (emails.length > available) {
    return {
      ok: false,
      errors: [
        {
          row: 0,
          email: '',
          error: `The file assigns ${emails.length} seats, but only ${available} are left in the pool.`,
        },
      ],
    }
  }

  let assignmentIds: { email: string; assignmentId: string }[]
  try {
    assignmentIds = await withTransaction(async (client) => {
      const out: { email: string; assignmentId: string }[] = []
      for (const e of emails) {
        try {
          const id = await reserveSeatTx(client, seatRow.id, org.id, e.email)
          out.push({ email: e.email, assignmentId: id })
        } catch (err) {
          if (err instanceof Rollback) {
            err.row = e.row
            err.email = e.email
          }
          throw err
        }
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
            error: `${e.msg} (the pool changed after this file was checked — nothing was assigned)`,
          },
        ],
      }
    }
    throw e
  }

  // Enrol + email after commit, a handful in flight at a time.
  const CONCURRENCY = 10
  const results: BulkAssignEmployeeResult[] = new Array(assignmentIds.length)
  let next = 0
  async function worker() {
    while (next < assignmentIds.length) {
      const i = next++
      const { email, assignmentId } = assignmentIds[i]
      const enrol = await enrolAssignedSeat(assignmentId, email, course, org.name)
      results[i] = {
        email,
        enrolled: enrol.enrolled,
        emailed: enrol.emailed,
        alreadyEnrolled: enrol.alreadyEnrolled,
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, assignmentIds.length) }, worker))

  return {
    ok: true,
    assigned: results.length,
    poolAvailable: await poolAvailable(seatRow.id),
    results,
  }
}

// ─── Revoke ───────────────────────────────────────────────────────────────

/** Lesson _ids that make up a course (across all its modules). */
async function courseLessonIds(courseId: string): Promise<string[]> {
  const doc = await sanityClient.fetch<{ ids: (string | null)[] } | null>(
    `*[_type == 'course' && _id == $id][0]{ "ids": modules[]->lessons[]->_id }`,
    { id: courseId },
    { cache: 'no-store' }
  )
  return (doc?.ids ?? []).filter((x): x is string => !!x)
}

/** Whether a learner has completed at least one lesson in the course. */
async function hasStartedCourse(learnerId: string, courseId: string): Promise<boolean> {
  const [learner, lessonIds] = await Promise.all([
    sanityClient.fetch<{ completionLog?: { lessonId: string }[] } | null>(
      `*[_type == 'learnerRecord' && _id == $id][0]{ completionLog }`,
      { id: learnerId },
      { cache: 'no-store' }
    ),
    courseLessonIds(courseId),
  ])
  if (!learner?.completionLog?.length || !lessonIds.length) return false
  const done = new Set(learner.completionLog.map((c) => c.lessonId))
  return lessonIds.some((id) => done.has(id))
}

export type RevokeOutcome =
  | { ok: true; email: string; poolAvailable: number }
  | { ok: false; error: string }

/**
 * Reclaim an employee's seat back into the pool — only while they have not
 * started the course. Flips the assignment to 'revoked', decrements the pool
 * counter, and removes the course from that learner's enrolledCourses.
 */
export async function revokeSeat(
  sessionEmail: string,
  input: { assignmentId: string }
): Promise<RevokeOutcome> {
  const org = await requireAcademyOrgAdmin(sessionEmail)

  const r = await query<{
    id: string
    status: string
    email: string
    learner_id: string | null
    course_seats_id: string
    seat_org: string
    course_id: string
  }>(
    `SELECT a.id, a.status, a.email, a.learner_id, a.course_seats_id,
            s.organization_id AS seat_org, s.course_id
       FROM academy_seat_assignments a
       JOIN academy_course_seats s ON s.id = a.course_seats_id
      WHERE a.id = $1`,
    [input.assignmentId]
  )
  const a = r.rows[0]
  if (!a || a.seat_org !== org.id) return { ok: false, error: 'That assignment does not belong to your company.' }
  if (a.status !== 'assigned') return { ok: false, error: 'That seat is not currently assigned.' }

  if (a.learner_id && (await hasStartedCourse(a.learner_id, a.course_id))) {
    return { ok: false, error: 'They have already started the course — the seat cannot be reclaimed.' }
  }

  await withTransaction(async (client) => {
    const upd = await client.query(
      `UPDATE academy_seat_assignments SET status = 'revoked', revoked_at = now()
        WHERE id = $1 AND status = 'assigned'`,
      [a.id]
    )
    if (upd.rowCount === 0) throw new Rollback('That seat is no longer assigned.')
    await client.query(
      `UPDATE academy_course_seats SET seats_assigned = GREATEST(seats_assigned - 1, 0) WHERE id = $1`,
      [a.course_seats_id]
    )
  }).catch((e) => {
    if (e instanceof Rollback) throw new AcademyOrgError(e.msg)
    throw e
  })

  // Remove the course from the learner's enrolment (best-effort).
  if (a.learner_id) {
    try {
      const learner = await sanityClient.fetch<{ enrolledCourses?: { _key?: string; _ref: string }[] } | null>(
        `*[_type == 'learnerRecord' && _id == $id][0]{ enrolledCourses }`,
        { id: a.learner_id },
        { cache: 'no-store' }
      )
      const ref = learner?.enrolledCourses?.find((c) => c._ref === a.course_id)
      if (ref) {
        await sanityClient
          .patch(a.learner_id)
          .unset([ref._key ? `enrolledCourses[_key=="${ref._key}"]` : `enrolledCourses[_ref=="${a.course_id}"]`])
          .commit()
      }
    } catch (e) {
      console.error('Academy corporate: could not un-enrol revoked seat', a.id, e)
    }
  }

  return { ok: true, email: a.email, poolAvailable: await poolAvailable(a.course_seats_id) }
}

// ─── Company status / report ─────────────────────────────────────────────

export interface CompanySeatEmployee {
  assignmentId: string
  email: string
  name: string | null
  status: 'assigned' | 'revoked'
  enrolmentPending: boolean
  started: boolean
  completed: boolean
  assignedAt: string
}
export interface CompanyCoursePool {
  courseSeatsId: string
  courseId: string
  courseSlug: string
  courseTitle: string
  purchased: number
  assigned: number
  available: number
  employees: CompanySeatEmployee[]
}
export interface CompanyStatus {
  organization: { id: string; name: string; gstin: string }
  courses: CompanyCoursePool[]
}

export async function getCompanyStatus(sessionEmail: string): Promise<CompanyStatus> {
  const org = await requireAcademyOrgAdmin(sessionEmail)

  const [seatRows, assignRows] = await Promise.all([
    query<SeatRow>(
      `SELECT id, organization_id, course_id, course_slug, course_title, seats_purchased, seats_assigned
         FROM academy_course_seats WHERE organization_id = $1 ORDER BY created_at`,
      [org.id]
    ),
    query<{
      id: string
      course_seats_id: string
      email: string
      learner_id: string | null
      status: 'assigned' | 'revoked'
      assigned_at: string
    }>(
      `SELECT id, course_seats_id, email, learner_id, status, assigned_at
         FROM academy_seat_assignments WHERE organization_id = $1 ORDER BY assigned_at`,
      [org.id]
    ),
  ])

  const emails = Array.from(new Set(assignRows.rows.map((a) => a.email.toLowerCase())))
  const courseIds = Array.from(new Set(seatRows.rows.map((s) => s.course_id)))

  const [learners, courseLessons] = await Promise.all([
    emails.length
      ? sanityClient.fetch<
          { email: string; name: string; completionLog?: { lessonId: string }[]; certCourseIds: string[] }[]
        >(
          `*[_type == 'learnerRecord' && email in $emails]{
            email, name, completionLog,
            "certCourseIds": certificateRefs[]->courseRef._ref
          }`,
          { emails },
          { cache: 'no-store' }
        )
      : Promise.resolve([]),
    courseIds.length
      ? sanityClient.fetch<{ _id: string; ids: (string | null)[] }[]>(
          `*[_type == 'course' && _id in $ids]{ _id, "ids": modules[]->lessons[]->_id }`,
          { ids: courseIds },
          { cache: 'no-store' }
        )
      : Promise.resolve([]),
  ])

  const learnerByEmail = new Map(learners.map((l) => [l.email.toLowerCase(), l]))
  const lessonIdsByCourse = new Map(
    courseLessons.map((c) => [c._id, new Set((c.ids ?? []).filter((x): x is string => !!x))])
  )

  const courses: CompanyCoursePool[] = seatRows.rows.map((s) => {
    const forCourse = assignRows.rows.filter((a) => a.course_seats_id === s.id)
    const lessonIds = lessonIdsByCourse.get(s.course_id) ?? new Set<string>()
    const employees: CompanySeatEmployee[] = forCourse.map((a) => {
      const learner = learnerByEmail.get(a.email.toLowerCase())
      const done = new Set(learner?.completionLog?.map((c) => c.lessonId) ?? [])
      const started = lessonIds.size > 0 && Array.from(lessonIds).some((id) => done.has(id))
      const completed = !!learner?.certCourseIds?.includes(s.course_id)
      return {
        assignmentId: a.id,
        email: a.email,
        name: learner?.name ?? null,
        status: a.status,
        enrolmentPending: a.status === 'assigned' && !a.learner_id,
        started,
        completed,
        assignedAt: a.assigned_at,
      }
    })
    return {
      courseSeatsId: s.id,
      courseId: s.course_id,
      courseSlug: s.course_slug,
      courseTitle: s.course_title,
      purchased: s.seats_purchased,
      assigned: s.seats_assigned,
      available: s.seats_purchased - s.seats_assigned,
      employees,
    }
  })

  return {
    organization: { id: org.id, name: org.name, gstin: org.gstin },
    courses,
  }
}

/** The company seat-usage report as a PDF (jsPDF, same conventions as the OKR
 *  Ally org report). */
export async function renderCompanyReportPdf(status: CompanyStatus): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const M = 18
  const PW = doc.internal.pageSize.getWidth()
  let y = 20

  const safe = (s: string) => s.replace(/[^\x20-\x7E]/g, '?')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(15)
  doc.text('Embiggen Academy — seat usage report', M, y)
  y += 8
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.text(safe(status.organization.name), M, y)
  y += 5
  doc.text(`GSTIN: ${status.organization.gstin}`, M, y)
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

  for (const c of status.courses) {
    if (y > 250) {
      doc.addPage()
      y = 20
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text(safe(c.courseTitle), M, y)
    y += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(
      `Purchased ${c.purchased}   ·   Assigned ${c.assigned}   ·   Available ${c.available}`,
      M,
      y
    )
    y += 7

    doc.setDrawColor(210)
    doc.line(M, y, PW - M, y)
    y += 5
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Employee', M, y)
    doc.text('Status', M + 90, y)
    doc.text('Progress', M + 125, y)
    y += 4
    doc.line(M, y, PW - M, y)
    y += 5
    doc.setFont('helvetica', 'normal')

    const active = c.employees.filter((e) => e.status === 'assigned')
    if (active.length === 0) {
      doc.setTextColor(110)
      doc.text('No seats assigned yet.', M, y)
      doc.setTextColor(0)
      y += 6
    }
    for (const e of active) {
      if (y > 278) {
        doc.addPage()
        y = 20
      }
      const who = e.name ? `${e.name} <${e.email}>` : e.email
      const progress = e.completed ? 'Completed' : e.started ? 'In progress' : 'Not started'
      doc.text(safe(who).slice(0, 52), M, y)
      doc.text(e.enrolmentPending ? 'Pending' : 'Enrolled', M + 90, y)
      doc.text(progress, M + 125, y)
      y += 5
    }

    const revoked = c.employees.filter((e) => e.status === 'revoked')
    if (revoked.length) {
      y += 2
      doc.setTextColor(110)
      doc.setFontSize(8)
      doc.text(`Reclaimed seats: ${revoked.map((e) => e.email).join(', ')}`, M, y, { maxWidth: PW - 2 * M })
      doc.setTextColor(0)
      doc.setFontSize(9)
      y += 6
    }
    y += 6
  }

  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text(
    'Progress is drawn from each learner’s Academy record. "Started" means at least one lesson completed.',
    M,
    Math.min(y, 288)
  )

  return Buffer.from(doc.output('arraybuffer'))
}

/** Re-run the Sanity enrolment + login email for a seat whose enrolment is
 *  pending (or to re-send the link). */
export async function resendSeatEnrolment(
  sessionEmail: string,
  input: { assignmentId: string }
): Promise<{ ok: true; email: string; emailed: boolean } | { ok: false; error: string }> {
  const org = await requireAcademyOrgAdmin(sessionEmail)
  const r = await query<{
    id: string
    email: string
    status: string
    seat_org: string
    course_id: string
    course_slug: string
    course_title: string
  }>(
    `SELECT a.id, a.email, a.status, s.organization_id AS seat_org,
            s.course_id, s.course_slug, s.course_title
       FROM academy_seat_assignments a
       JOIN academy_course_seats s ON s.id = a.course_seats_id
      WHERE a.id = $1`,
    [input.assignmentId]
  )
  const a = r.rows[0]
  if (!a || a.seat_org !== org.id) return { ok: false, error: 'That assignment does not belong to your company.' }
  if (a.status !== 'assigned') return { ok: false, error: 'That seat is not currently assigned.' }

  const enrol = await enrolAssignedSeat(
    a.id,
    a.email,
    { id: a.course_id, slug: a.course_slug, title: a.course_title },
    org.name
  )
  if (!enrol.enrolled) return { ok: false, error: 'Could not enrol that email — try again shortly.' }
  return { ok: true, email: a.email, emailed: enrol.emailed }
}
