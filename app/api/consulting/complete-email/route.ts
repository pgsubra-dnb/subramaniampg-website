import { NextRequest, NextResponse } from 'next/server'
import { confirmConsultingPayment } from '@/lib/consultingCheckout'

export const dynamic = 'force-dynamic'

/**
 * "A Conversation with PGS" — email top-up for a paid transaction where Razorpay
 * collected no email (UPI payments frequently carry only a phone number).
 *
 * The confirmation page (/work/book-consulting/confirmed) shows an inline form
 * when fulfilment succeeds on everything EXCEPT the email; this route takes that
 * email plus the SAME signed callback params the redirect carried, re-verifies
 * the Payment Links signature inside confirmConsultingPayment, and completes the
 * GST invoice + Cal.id-link email.
 *
 * Security: the signature (HMAC over {link}|{ref}|{status}|{payment}) can't be
 * forged without RAZORPAY_KEY_SECRET, so a caller can only set the email for
 * their own already-paid transaction. Idempotent via the invoice row — a second
 * submit is a no-op.
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, reason: 'Bad request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim() : ''
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ ok: false, reason: 'Enter a valid email address.' }, { status: 400 })
  }

  const str = (k: string): string =>
    typeof body[k] === 'string' ? (body[k] as string) : ''
  const params = {
    razorpay_payment_id: str('razorpay_payment_id'),
    razorpay_payment_link_id: str('razorpay_payment_link_id'),
    razorpay_payment_link_reference_id: str('razorpay_payment_link_reference_id'),
    razorpay_payment_link_status: str('razorpay_payment_link_status'),
    razorpay_signature: str('razorpay_signature'),
  }
  if (!params.razorpay_payment_id || !params.razorpay_payment_link_id || !params.razorpay_signature) {
    return NextResponse.json({ ok: false, reason: 'This confirmation link is incomplete.' }, { status: 400 })
  }

  let outcome
  try {
    outcome = await confirmConsultingPayment(params, { emailOverride: email })
  } catch (e) {
    console.error('consulting complete-email error:', e)
    return NextResponse.json({ ok: false, reason: 'Something went wrong. Email pgs@embiggen.co.in.' }, { status: 500 })
  }

  switch (outcome.status) {
    case 'confirmed':
      return NextResponse.json({ ok: true, invoiceNumber: outcome.invoiceNumber })
    case 'pending':
      return NextResponse.json(
        { ok: false, reason: 'Razorpay has not marked the payment complete yet. Try again in a minute.' },
        { status: 409 }
      )
    case 'unrecognised':
      return NextResponse.json(
        { ok: false, reason: 'We could not match this payment to a session. Email pgs@embiggen.co.in with your payment reference.' },
        { status: 422 }
      )
    case 'invalid':
      return NextResponse.json({ ok: false, reason: 'This confirmation link is invalid.' }, { status: 400 })
    default:
      return NextResponse.json(
        { ok: false, reason: 'Something went wrong finishing your booking. Email pgs@embiggen.co.in.' },
        { status: 502 }
      )
  }
}
