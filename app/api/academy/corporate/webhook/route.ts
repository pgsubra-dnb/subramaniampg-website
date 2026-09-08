import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { fulfilAcademyCorporatePurchase } from '@/lib/academyCorporate'

export const dynamic = 'force-dynamic'

/**
 * Razorpay webhook — silent fallback confirmation for an Academy corporate seat
 * purchase (closed-tab case). Idempotent with verify-payment via
 * academy_corp_purchases.razorpay_payment_id.
 *
 * Configure a SEPARATE endpoint in the Razorpay dashboard pointing at
 * `<apex host>/api/academy/corporate/webhook` with events `payment.captured`
 * and `order.paid`, secret = RAZORPAY_WEBHOOK_SECRET. Use the apex host
 * (subramaniampg.guru, not www.) — Razorpay's sender does not follow redirects.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('Academy corporate webhook: RAZORPAY_WEBHOOK_SECRET not set')
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
        payment?: { entity: { id: string; order_id: string } }
        order?: { entity: { id: string; notes?: Record<string, string> } }
      }
    }

    let notes: Record<string, string> | undefined
    let paymentId: string | null = null
    let orderId: string | null = null

    if (event.event === 'order.paid' && event.payload.order) {
      orderId = event.payload.order.entity.id
      notes = event.payload.order.entity.notes
      paymentId = event.payload.payment?.entity.id ?? null
    } else if (event.event === 'payment.captured' && event.payload.payment) {
      paymentId = event.payload.payment.entity.id
      orderId = event.payload.payment.entity.order_id
    } else {
      return NextResponse.json({ ok: true, ignored: event.event })
    }

    if (!notes && orderId) {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      })
      const order = await razorpay.orders.fetch(orderId)
      notes = (order.notes || {}) as Record<string, string>
    }

    if (!notes || notes.app !== 'academy' || notes.kind !== 'corporate') {
      return NextResponse.json({ ok: true, ignored: 'not an academy corporate order' })
    }
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: 'no payment id' })
    }

    const seats = Number(notes.seats)
    if (!seats || seats < 1) {
      return NextResponse.json({ ok: true, ignored: 'order has no seats' })
    }

    const r = await fulfilAcademyCorporatePurchase({
      purchaserEmail: notes.buyerEmail,
      companyName: notes.companyName,
      gstin: notes.gstin,
      registeredAddress: notes.registeredAddress,
      placeOfSupply: notes.placeOfSupply,
      adminEmail: notes.adminEmail,
      courseId: notes.courseId,
      courseSlug: notes.courseSlug,
      courseTitle: notes.courseTitle,
      seats,
      listPrice: Number(notes.listPrice) || Number(notes.base),
      baseAmount: Number(notes.base),
      gstAmount: Number(notes.gst),
      totalAmount: Number(notes.total),
      discountPercent: Number(notes.discountPercent) || null,
      couponCode: notes.couponCode || null,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
    })

    return NextResponse.json({ ok: true, fulfilled: r.ok && !r.alreadyProcessed })
  } catch (error) {
    console.error('Academy corporate webhook error:', error)
    // 200 so Razorpay does not hammer retries on a logic bug — the signature
    // check above already passed.
    return NextResponse.json({ ok: true, error: 'handled' })
  }
}
