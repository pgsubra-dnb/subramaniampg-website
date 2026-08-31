import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { fulfilConsultingPayment } from '@/lib/consultingCheckout'

export const dynamic = 'force-dynamic'

/**
 * Razorpay webhook for "A Conversation with PGS" — the silent fallback for a
 * payer whose browser never completes the redirect to
 * /work/book-consulting/confirmed (tab closed mid-checkout, flaky network).
 * Same reliability role, and the same signature-verification pattern, as
 * /api/okr-ally/webhook — just on the Payment Links surface instead of Orders.
 *
 * Idempotent with the redirect path via fulfilConsultingPayment (invoice row
 * keyed on razorpay_payment_id) — whichever fires first issues the one invoice
 * and sends the one confirmation email.
 *
 * Dashboard setup: a SEPARATE webhook endpoint (Razorpay routes events per URL,
 * and /api/okr-ally/webhook is subscribed to payment.captured + order.paid, not
 * payment_link.paid):
 *   URL    https://www.subramaniampg.guru/api/consulting/webhook
 *   Event  payment_link.paid
 *   Secret CONSULTING_RAZORPAY_WEBHOOK_SECRET, or reuse RAZORPAY_WEBHOOK_SECRET
 *          (this route accepts either).
 */

interface Entity {
  id?: string
  status?: string
  amount?: number
  amount_paid?: number
  email?: string
  contact?: string
  customer?: { name?: string; email?: string; contact?: string }
}

export async function POST(req: NextRequest) {
  const secret =
    process.env.CONSULTING_RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('consulting webhook: no webhook secret set')
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-razorpay-signature') || ''
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

  const sigBuf = Buffer.from(signature)
  const expBuf = Buffer.from(expected)
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return NextResponse.json({ ok: false, reason: 'Invalid signature' }, { status: 400 })
  }

  try {
    const event = JSON.parse(rawBody) as {
      event: string
      payload: {
        payment_link?: { entity: Entity }
        payment?: { entity: Entity }
      }
    }

    if (event.event !== 'payment_link.paid') {
      return NextResponse.json({ ok: true, ignored: event.event })
    }

    const link = event.payload.payment_link?.entity
    const payment = event.payload.payment?.entity
    const paymentId = payment?.id
    const paymentLinkId = link?.id

    if (!paymentId || !paymentLinkId) {
      return NextResponse.json({ ok: true, ignored: 'missing payment / link id' })
    }
    if (link?.status && link.status !== 'paid') {
      return NextResponse.json({ ok: true, ignored: `link status ${link.status}` })
    }

    // Amount + customer come straight off the webhook body (already signed).
    const amountPaise = Number(link?.amount ?? payment?.amount ?? 0)
    const customerEmail = link?.customer?.email || payment?.email || null
    const customerName = link?.customer?.name || null

    const outcome = await fulfilConsultingPayment({
      paymentId,
      paymentLinkId,
      amountPaise,
      customerEmail,
      customerName,
    })

    return NextResponse.json({ ok: true, outcome: outcome.status })
  } catch (error) {
    console.error('consulting webhook error:', error)
    // 200 after a passing signature check — a parse/logic bug should not make
    // Razorpay retry-storm this endpoint.
    return NextResponse.json({ ok: true, error: 'handled' })
  }
}
