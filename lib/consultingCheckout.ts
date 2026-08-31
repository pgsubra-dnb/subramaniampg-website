import crypto from 'crypto'
import { query, getSiteSettings } from '@/lib/okrAlly'
import { createAndSendInvoice } from '@/lib/okrAllyInvoice'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { stateCodeFromGstin } from '@/lib/indiaGstStates'
import { assertFulfillmentAllowed, FulfillmentBlockedError } from '@/lib/fulfillmentGuard'
import {
  CONSULTING_SLOTS,
  slotForAmountInInr,
  gstFromInclusive,
  formatDuration,
  formatInr,
  type ConsultingSlot,
} from '@/lib/consultingBooking'

/**
 * "A Conversation with PGS" — payment fulfilment.
 *
 * Two entry points feed the SAME idempotent core (fulfilConsultingPayment):
 *   1. The Razorpay Payment Link redirect (GET) → /work/book-consulting/confirmed
 *      → confirmConsultingPayment() — verifies the redirect signature, then
 *      fetches the link for amount + customer.
 *   2. The `payment_link.paid` webhook → /api/consulting/webhook — the closed-tab
 *      fallback for a payer who never completes the redirect. The webhook body
 *      already carries the payment + link entities, so no extra API call.
 *
 * Fulfilment = match the paid amount to a duration, issue the GST invoice
 * (existing pipeline, GST-inclusive math), email the Cal.id link. Idempotent on
 * the Razorpay payment id via the invoice row: a refresh, or the webhook and the
 * redirect both firing, never double-charge, double-invoice, or double-email.
 *
 * Cal.id events themselves are free and un-gated — the payment gate lives here.
 */

const SUPPORT_EMAIL = 'pgs@embiggen.co.in'

// ── Fulfilment core ─────────────────────────────────────────────────────────

export interface FulfilInput {
  paymentId: string
  paymentLinkId: string
  /** GST-inclusive amount actually paid, in paise. */
  amountPaise: number
  customerEmail: string | null
  customerName: string | null
}

export type FulfilOutcome =
  | {
      status: 'confirmed'
      /** null only in the rare case a prior invoice's amount maps to no current slot. */
      slot: ConsultingSlot | null
      email: string | null
      invoiceNumber: string | null
      firstTime: boolean
    }
  | { status: 'unrecognised' } // paid, but the amount matches no configured duration
  | { status: 'error' } // blocked (non-prod / implausible id) or an unexpected failure

async function findExistingInvoice(
  paymentId: string
): Promise<{ invoice_number: string; total_amount: string } | null> {
  try {
    const r = await query<{ invoice_number: string; total_amount: string }>(
      'SELECT invoice_number, total_amount FROM invoices WHERE razorpay_payment_id = $1',
      [paymentId]
    )
    return r.rows[0] ?? null
  } catch (e) {
    console.error('consulting: invoice lookup failed', e)
    return null
  }
}

export async function fulfilConsultingPayment(input: FulfilInput): Promise<FulfilOutcome> {
  try {
    assertFulfillmentAllowed('consulting fulfilment', input.paymentId, input.paymentLinkId)
  } catch (e) {
    if (e instanceof FulfillmentBlockedError) {
      console.error(e.message)
      return { status: 'error' }
    }
    throw e
  }

  // ── Idempotency: an invoice for this payment means it's already fulfilled.
  const done = await findExistingInvoice(input.paymentId)
  if (done) {
    return {
      status: 'confirmed',
      slot: slotForAmountInInr(Math.round(Number(done.total_amount))),
      email: null,
      invoiceNumber: done.invoice_number,
      firstTime: false,
    }
  }

  // Exact paise match — Payment Link amounts are fixed integers (accept_partial:false).
  const slot = CONSULTING_SLOTS.find((s) => s.amountInInr * 100 === input.amountPaise) ?? null
  if (!slot) {
    console.error(
      'consulting: amount',
      input.amountPaise,
      'paise matches no slot —',
      input.paymentLinkId,
      input.paymentId
    )
    return { status: 'unrecognised' }
  }

  const email = input.customerEmail?.trim() || null
  const name = (
    input.customerName?.trim() ||
    (email ? email.split('@')[0] : '') ||
    'Customer'
  ).slice(0, 120)

  const { base, gst, total } = gstFromInclusive(slot.amountInInr)
  const durationText = formatDuration(slot.minutes)

  // Place of supply: consulting has no buyer-state step and GST is charged
  // regardless, so bill from the supplier's own state (intra-state CGST+SGST) —
  // the same default the ₹0 free-review invoice uses.
  let placeOfSupply = ''
  try {
    const settings = await getSiteSettings()
    placeOfSupply = stateCodeFromGstin(settings.supplierGstin || '') || ''
  } catch (e) {
    console.error('consulting: getSiteSettings failed', e)
  }

  let invoiceNumber: string | null = null
  if (email) {
    // Existing pipeline — idempotent on razorpay_payment_id (advisory lock +
    // unique index), so a redirect/webhook race creates exactly one invoice.
    const inv = await createAndSendInvoice({
      userId: null,
      razorpayPaymentId: input.paymentId,
      listPrice: base,
      baseAmount: base,
      gstAmount: gst,
      totalAmount: total,
      discountPercent: null,
      couponCode: null,
      buyerGstin: null,
      placeOfSupply,
      buyerName: name,
      buyerEmail: email,
      serviceLabel: `Consulting — A Conversation with PGS (${durationText})`,
      emailDescriptor: `for your ${durationText} conversation with PGS`,
      emailSubjectTag: '',
    })

    // The other handler (redirect vs webhook) got there first and owns the
    // confirmation email — stop here so we don't send a duplicate.
    if (inv.ok && !inv.created) {
      return {
        status: 'confirmed',
        slot,
        email: null,
        invoiceNumber: inv.invoice.invoice_number,
        firstTime: false,
      }
    }
    if (inv.ok) invoiceNumber = inv.invoice.invoice_number
    else console.error('consulting: invoice not issued —', inv.reason, input.paymentId)
  } else {
    console.error('consulting: no customer email on payment', input.paymentLinkId, input.paymentId)
  }

  // ── Confirmation email with the Cal.id link.
  if (email) {
    const paid = formatInr(slot.amountInInr)
    await sendBrevoEmail({
      to: email,
      toName: name,
      subject: `Your ${durationText} conversation with PGS — pick a time`,
      htmlContent: `
        <div style="font-family:Inter,Arial,sans-serif;color:#2C2C2A;line-height:1.6;">
          <p>Your payment of <strong>${paid}</strong> (incl. GST) for a ${durationText} conversation with PGS is confirmed.</p>
          <p><strong>Pick a time here:</strong> <a href="${slot.calUrl}">${slot.calUrl}</a></p>
          <p>You'll get a calendar invite with the video link once you choose a slot.
          Your GST invoice${invoiceNumber ? ` (${invoiceNumber})` : ''} is in a separate email.</p>
          <p style="font-size:13px;color:#6b6b66;">This time is reserved specifically for you and is
          non-refundable. To reschedule, reply to this email or contact ${SUPPORT_EMAIL}.</p>
          <p style="font-size:13px;color:#6b6b66;">Subramaniam P G</p>
        </div>`,
      textContent:
        `Your payment of ${paid} (incl. GST) for a ${durationText} conversation with PGS is confirmed.\n\n` +
        `Pick a time: ${slot.calUrl}\n\n` +
        `A calendar invite follows once you choose a slot. Your GST invoice` +
        `${invoiceNumber ? ` (${invoiceNumber})` : ''} is in a separate email.\n\n` +
        `This time is reserved specifically for you and is non-refundable. ` +
        `To reschedule, contact ${SUPPORT_EMAIL}.`,
    })
  }

  return { status: 'confirmed', slot, email, invoiceNumber, firstTime: true }
}

// ── Redirect path (signed GET callback) ─────────────────────────────────────

export interface PaymentLinkCallbackParams {
  paymentId: string
  paymentLinkId: string
  paymentLinkReferenceId: string
  paymentLinkStatus: string
  signature: string
}

type RawParams = Record<string, string | string[] | undefined>

export function parseCallbackParams(sp: RawParams): PaymentLinkCallbackParams | null {
  const g = (k: string): string | undefined => {
    const v = sp[k]
    return typeof v === 'string' ? v : Array.isArray(v) ? v[0] : undefined
  }
  const paymentId = g('razorpay_payment_id')
  const paymentLinkId = g('razorpay_payment_link_id')
  const paymentLinkStatus = g('razorpay_payment_link_status')
  const signature = g('razorpay_signature')
  // reference_id is empty on our links but Razorpay still sends the (empty) param
  const paymentLinkReferenceId = g('razorpay_payment_link_reference_id') ?? ''
  if (!paymentId || !paymentLinkId || !paymentLinkStatus || !signature) return null
  return { paymentId, paymentLinkId, paymentLinkReferenceId, paymentLinkStatus, signature }
}

/**
 * Razorpay Payment Links redirect signature:
 *   HMAC_SHA256("{payment_link_id}|{reference_id}|{status}|{payment_id}", key_secret)
 */
export function verifyPaymentLinkSignature(p: PaymentLinkCallbackParams, keySecret: string): boolean {
  const body = `${p.paymentLinkId}|${p.paymentLinkReferenceId}|${p.paymentLinkStatus}|${p.paymentId}`
  const expected = crypto.createHmac('sha256', keySecret).update(body).digest('hex')
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(p.signature, 'utf8')
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export type ConfirmOutcome =
  | FulfilOutcome
  | { status: 'pending' } // signature ok but the link is not 'paid' yet
  | { status: 'invalid' } // params missing or signature mismatch
  | { status: 'error' } // Razorpay / config problem — payment likely real, tell them to expect an email

interface RzpPaymentLink {
  status?: string
  amount?: number
  customer?: { name?: string; email?: string; contact?: string }
}

interface RzpPayment {
  status?: string
  amount?: number
  email?: string
  contact?: string
  notes?: Record<string, string> | unknown[]
}

async function fetchPaymentLink(id: string, keyId: string, keySecret: string): Promise<RzpPaymentLink> {
  const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const res = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(id)}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) throw new Error(`payment_links/${id} → ${res.status}`)
  return (await res.json()) as RzpPaymentLink
}

/**
 * The payer's email/contact for a Payment Link payment lives on the PAYMENT, not
 * the Payment Link — our links are created without a pre-set `customer`, so
 * `link.customer` is empty even after payment. The redirect callback only carries
 * `razorpay_payment_id`, so fetch the payment to recover the email the invoice
 * pipeline needs. (The webhook body already includes the payment entity.)
 */
export async function fetchPayment(id: string, keyId: string, keySecret: string): Promise<RzpPayment> {
  const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const res = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) throw new Error(`payments/${id} → ${res.status}`)
  return (await res.json()) as RzpPayment
}

/** Razorpay `notes` is usually an object, but an empty one serialises as `[]`. */
function nameFromNotes(notes: RzpPayment['notes']): string | null {
  if (!notes || Array.isArray(notes)) return null
  const n = notes as Record<string, string>
  return n.name || n.customer_name || n.full_name || null
}

export async function confirmConsultingPayment(raw: RawParams): Promise<ConfirmOutcome> {
  const params = parseCallbackParams(raw)
  if (!params) return { status: 'invalid' }

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keyId || !keySecret) {
    console.error('consulting confirm: RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set')
    return { status: 'error' }
  }

  if (!verifyPaymentLinkSignature(params, keySecret)) return { status: 'invalid' }
  if (params.paymentLinkStatus !== 'paid') return { status: 'pending' }

  // Guard before spending a Razorpay API call or touching the DB.
  try {
    assertFulfillmentAllowed('consulting confirm', params.paymentId, params.paymentLinkId)
  } catch (e) {
    if (e instanceof FulfillmentBlockedError) {
      console.error(e.message)
      return { status: 'error' }
    }
    throw e
  }

  // Fast path: already fulfilled (e.g. the webhook beat the redirect).
  const done = await findExistingInvoice(params.paymentId)
  if (done) {
    return {
      status: 'confirmed',
      slot: slotForAmountInInr(Math.round(Number(done.total_amount))),
      email: null,
      invoiceNumber: done.invoice_number,
      firstTime: false,
    }
  }

  let link: RzpPaymentLink
  try {
    link = await fetchPaymentLink(params.paymentLinkId, keyId, keySecret)
  } catch (e) {
    console.error('consulting confirm: fetchPaymentLink failed', e)
    return { status: 'error' }
  }
  if (link.status !== 'paid') return { status: 'pending' }

  // The payer's email is on the payment, not the (customer-less) link. Fetch it
  // whenever the link doesn't already carry one — without it the invoice can't
  // be issued and no confirmation email goes out.
  let customerEmail = link.customer?.email ?? null
  let customerName = link.customer?.name ?? null
  if (!customerEmail) {
    try {
      const payment = await fetchPayment(params.paymentId, keyId, keySecret)
      customerEmail = payment.email ?? null
      customerName = customerName ?? nameFromNotes(payment.notes)
    } catch (e) {
      console.error('consulting confirm: fetchPayment failed', e)
      // Fall through with a null email — fulfilConsultingPayment logs the gap and
      // the confirmed page tells the payer the email is coming to their pay address.
    }
  }

  return fulfilConsultingPayment({
    paymentId: params.paymentId,
    paymentLinkId: params.paymentLinkId,
    amountPaise: Number(link.amount ?? 0),
    customerEmail,
    customerName,
  })
}
