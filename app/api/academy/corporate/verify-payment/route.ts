import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { fulfilAcademyCorporatePurchase } from '@/lib/academyCorporate'
import { assertFulfillmentAllowed, FulfillmentBlockedError } from '@/lib/fulfillmentGuard'

export const dynamic = 'force-dynamic'

/**
 * Primary (client-side) confirmation for an Academy corporate seat purchase.
 * The webhook is the silent fallback for the closed-tab case — both call the
 * same idempotent fulfilAcademyCorporatePurchase.
 *
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Everything granted is read back from the order `notes` set in create-order.
 */
export async function POST(req: NextRequest) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json()
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, reason: 'Missing required fields' }, { status: 400 })
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')
    if (expected !== razorpay_signature) {
      return NextResponse.json({ success: false, reason: 'Signature mismatch' }, { status: 400 })
    }

    try {
      assertFulfillmentAllowed('academy corporate verify-payment', razorpay_payment_id, razorpay_order_id)
    } catch (e) {
      if (e instanceof FulfillmentBlockedError) {
        console.error(e.message)
        return NextResponse.json({ success: false, reason: 'Fulfillment blocked' }, { status: 503 })
      }
      throw e
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })
    const order = await razorpay.orders.fetch(razorpay_order_id)
    const notes = (order.notes || {}) as Record<string, string>

    if (notes.app !== 'academy' || notes.kind !== 'corporate') {
      return NextResponse.json({ success: false, reason: 'Not an Academy corporate order' }, { status: 400 })
    }

    const seats = Number(notes.seats)
    if (!seats || seats < 1) {
      return NextResponse.json({ success: false, reason: 'Order has no seats' }, { status: 400 })
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
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
    })

    return NextResponse.json(
      {
        success: r.ok,
        alreadyProcessed: r.alreadyProcessed,
        invoiceNumber: r.invoiceNumber ?? null,
        invoiceUnissued: r.invoiceUnissued ?? false,
        adminEmail: notes.adminEmail,
        seats,
        courseTitle: notes.courseTitle,
      },
      r.ok ? undefined : { status: 503 }
    )
  } catch (error) {
    console.error('Academy corporate verify-payment error:', error)
    return NextResponse.json({ success: false, reason: 'Internal error' }, { status: 500 })
  }
}
