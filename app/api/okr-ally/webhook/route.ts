import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { getUserById } from '@/lib/okrAlly'
import { grantCredits, getPack } from '@/lib/okrAllyBilling'
import { createAndSendInvoice } from '@/lib/okrAllyInvoice'

export const dynamic = 'force-dynamic'

/**
 * Razorpay webhook — the silent fallback confirmation path (design doc section
 * 4, "Webhook decision: build it"). Runs server-side with no user step; only
 * matters if the client-side verify-payment never fires (browser closed
 * mid-checkout). Idempotent with verify-payment via grantCredits.
 *
 * Configure in the Razorpay dashboard with events `payment.captured` and
 * `order.paid`, secret = RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    console.error('OKR Ally webhook: RAZORPAY_WEBHOOK_SECRET not set')
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

    // payment.captured carries no order notes — fetch the order for them.
    if (!notes && orderId) {
      const razorpay = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
      })
      const order = await razorpay.orders.fetch(orderId)
      notes = (order.notes || {}) as Record<string, string>
    }

    if (!notes || notes.app !== 'okr-ally' || !notes.userId) {
      return NextResponse.json({ ok: true, ignored: 'not an okr-ally order' })
    }
    if (!paymentId) {
      return NextResponse.json({ ok: true, ignored: 'no payment id' })
    }

    const pack = getPack(notes.pack)
    const credits = pack ? pack.credits : Number(notes.credits)
    if (!credits || credits < 1) {
      return NextResponse.json({ ok: true, ignored: 'no credits on order' })
    }

    const result = await grantCredits({
      userId: notes.userId,
      credits,
      razorpayPaymentId: paymentId,
      razorpayOrderId: orderId,
      couponCode: notes.couponCode || null,
    })

    // GST invoice (build sequence step 5). Idempotent on razorpay_payment_id —
    // if verify-payment already issued it this is a no-op; if the tab closed
    // mid-checkout this is where the invoice actually gets created and emailed.
    const base = Number(notes.base)
    const gst = Number(notes.gst)
    const total = Number(notes.total)
    if (base && gst && total && notes.placeOfSupply) {
      const buyer = await getUserById(notes.userId)
      if (buyer) {
        await createAndSendInvoice({
          userId: buyer.id,
          razorpayPaymentId: paymentId,
          listPrice: Number(notes.listPrice) || base,
          discountPercent: Number(notes.discountPercent) || null,
          couponCode: notes.couponCode || null,
          baseAmount: base,
          gstAmount: gst,
          totalAmount: total,
          buyerGstin: notes.buyerGstin || null,
          placeOfSupply: notes.placeOfSupply,
          buyerName: buyer.name,
          buyerEmail: buyer.email,
        })
      }
    }

    return NextResponse.json({ ok: true, granted: result.granted })
  } catch (error) {
    console.error('OKR Ally webhook error:', error)
    // 200 so Razorpay does not hammer retries on a parse/logic bug; the
    // signature check above already passed.
    return NextResponse.json({ ok: true, error: 'handled' })
  }
}
