import crypto from 'crypto'
import { query, getSiteSettings } from '@/lib/okrAlly'
import { createAndSendInvoice } from '@/lib/okrAllyInvoice'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { stateCodeFromGstin } from '@/lib/indiaGstStates'
import {
  CONSULTING_SLOTS,
  slotForAmountInInr,
  gstFromInclusive,
  formatDuration,
  formatInr,
  type ConsultingSlot,
} from '@/lib/consultingBooking'

/**
 * "A Conversation with PGS" — payment confirmation.
 *
 * The Razorpay Payment Link redirects the payer (GET) to
 * /work/book-consulting/confirmed with the standard Payment Links callback
 * params. This module verifies the signature, matches the paid amount to a
 * duration, issues the GST invoice (existing pipeline, GST-inclusive math), and
 * emails the Cal.id link. Idempotent on the Razorpay payment id via the invoice
 * row, so a page refresh does not re-charge, re-invoice, or re-email.
 *
 * Cal.id events themselves are free and un-gated — the payment gate lives here.
 */

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
 * Razorpay Payment Links signature:
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
  | {
      status: 'confirmed'
      slot: ConsultingSlot
      email: string | null
      invoiceNumber: string | null
      firstTime: boolean
    }
  | { status: 'pending' } // signature ok but the link is not 'paid' yet
  | { status: 'invalid' } // params missing or signature mismatch
  | { status: 'unrecognised' } // paid, but the amount matches no configured duration
  | { status: 'error' } // Razorpay / config problem — payment likely real, tell them to expect an email

interface RzpPaymentLink {
  status?: string
  amount?: number
  customer?: { name?: string; email?: string; contact?: string }
}

async function fetchPaymentLink(id: string, keyId: string, keySecret: string): Promise<RzpPaymentLink> {
  const auth = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64')
  const res = await fetch(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(id)}`, {
    headers: { Authorization: auth },
  })
  if (!res.ok) throw new Error(`payment_links/${id} → ${res.status}`)
  return (await res.json()) as RzpPaymentLink
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

  // ── Idempotency: an invoice for this payment means we've already fulfilled it.
  try {
    const done = await query<{ invoice_number: string; total_amount: string }>(
      'SELECT invoice_number, total_amount FROM invoices WHERE razorpay_payment_id = $1',
      [params.paymentId]
    )
    if (done.rows[0]) {
      const slot = slotForAmountInInr(Math.round(Number(done.rows[0].total_amount)))
      if (slot) {
        return {
          status: 'confirmed',
          slot,
          email: null,
          invoiceNumber: done.rows[0].invoice_number,
          firstTime: false,
        }
      }
    }
  } catch (e) {
    console.error('consulting confirm: idempotency check failed, continuing', e)
  }

  // ── Pull the link (amount + customer) from Razorpay.
  let link: RzpPaymentLink
  try {
    link = await fetchPaymentLink(params.paymentLinkId, keyId, keySecret)
  } catch (e) {
    console.error('consulting confirm: fetchPaymentLink failed', e)
    return { status: 'error' }
  }
  if (link.status !== 'paid') return { status: 'pending' }

  // Exact paise match — Payment Link amounts are fixed integers, accept_partial:false.
  const paise = Number(link.amount ?? 0)
  const slot = CONSULTING_SLOTS.find((s) => s.amountInInr * 100 === paise) ?? null
  if (!slot) {
    console.error('consulting confirm: amount', link.amount, 'matches no slot', params.paymentLinkId)
    return { status: 'unrecognised' }
  }

  const email = link.customer?.email?.trim() || null
  const name =
    (link.customer?.name?.trim() || (email ? email.split('@')[0] : '') || 'Customer').slice(0, 120)

  const { base, gst, total } = gstFromInclusive(slot.amountInInr)
  const durationText = formatDuration(slot.minutes)

  // Place of supply: consulting has no buyer-state step and GST is charged
  // regardless, so bill from the supplier's own state (intra-state CGST+SGST),
  // the same default the ₹0 free-review invoice uses.
  let placeOfSupply = ''
  try {
    const settings = await getSiteSettings()
    placeOfSupply = stateCodeFromGstin(settings.supplierGstin || '') || ''
  } catch (e) {
    console.error('consulting confirm: getSiteSettings failed', e)
  }

  // ── GST invoice (existing pipeline — idempotent on razorpay_payment_id).
  let invoiceNumber: string | null = null
  if (email) {
    const inv = await createAndSendInvoice({
      userId: null,
      razorpayPaymentId: params.paymentId,
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
    if (inv.ok) invoiceNumber = inv.invoice.invoice_number
    else console.error('consulting confirm: invoice not issued —', inv.reason, params.paymentId)
  } else {
    console.error('consulting confirm: no customer email on payment link', params.paymentLinkId)
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
          Your GST invoice${invoiceNumber ? ` (${invoiceNumber})` : ''} is attached in a separate email.</p>
          <p style="font-size:13px;color:#6b6b66;">This time is reserved specifically for you and is
          non-refundable. To reschedule, reply to this email or contact pgs@embiggen.co.in.</p>
          <p style="font-size:13px;color:#6b6b66;">Subramaniam P G</p>
        </div>`,
      textContent:
        `Your payment of ${paid} (incl. GST) for a ${durationText} conversation with PGS is confirmed.\n\n` +
        `Pick a time: ${slot.calUrl}\n\n` +
        `A calendar invite follows once you choose a slot. Your GST invoice` +
        `${invoiceNumber ? ` (${invoiceNumber})` : ''} is in a separate email.\n\n` +
        `This time is reserved specifically for you and is non-refundable. ` +
        `To reschedule, contact pgs@embiggen.co.in.`,
    })
  }

  return { status: 'confirmed', slot, email, invoiceNumber, firstTime: true }
}
