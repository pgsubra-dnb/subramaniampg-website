import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getSessionUser, getCreditsRemaining } from '@/lib/okrAlly'
import { getPack, gstBreakdown, validateCoupon } from '@/lib/okrAllyBilling'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/**
 * Create a Razorpay order for an OKR Ally credit pack (build sequence step 4).
 * Body: {
 *   pack: 'single' | 'pack5' | 'pack10',
 *   couponCode?: string,  // percentage discount on the pack price
 *   (buyerState and buyerGstin are no longer asked or used for an individual: an older page may still send them, and they are
 *   ignored. Every individual order is invoiced for Tamil Nadu with CGST 9 + SGST 9.)
 * }
 *
 * The pack price and GST are computed server-side from lib/okrAllyBilling PACKS
 * — the client never sends an amount. base/gst/total and the place of supply
 * (Tamil Nadu) are stamped onto the order notes so verify-payment and the
 * webhook can issue the invoice from trusted data.
 *
 * This route only handles *paid* pack purchases. The free first review is a
 * different flow: its one-per-user 100%-off coupon is consumed at review
 * submission time (POST /api/okr-ally/review with `couponCode`), recorded
 * against the submission — not as a zero-value credit purchase here.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
    }
    if (user.is_demo) {
      return NextResponse.json({ error: 'Purchases are disabled in demo mode.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    const brand = toBrand(body.brand)
    const pack = getPack(body.pack)
    if (!pack) {
      return NextResponse.json({ error: 'Unknown pack' }, { status: 400 })
    }

    let discountPercent = 0
    let couponCode: string | null = null
    if (typeof body.couponCode === 'string' && body.couponCode.trim()) {
      const coupon = await validateCoupon(body.couponCode, user.id)
      if (!coupon.valid) {
        return NextResponse.json({ error: coupon.reason || 'Invalid coupon' }, { status: 400 })
      }
      discountPercent = coupon.discountPercent
      couponCode = coupon.code ?? null
    }

    const discountedBase = Math.round(pack.basePrice * (1 - discountPercent / 100))
    const { base, gst, total, amountInPaise } = gstBreakdown(discountedBase)

    // A coupon that zeroes the total is the free-review coupon — it belongs on
    // the review route, not here. Don't create a zero-value credit purchase.
    if (amountInPaise < 100) {
      return NextResponse.json(
        {
          error: `This coupon covers a full review at no cost. You don’t need to buy ${vocab(brand).reviews} — start your review and enter the code there.`,
          applyAtSubmission: true,
        },
        { status: 400 }
      )
    }

    // An individual gives neither a state nor a GSTIN: every individual order is Tamil Nadu, CGST 9 + SGST 9. Any buyerState or
    // buyerGstin from an older page is ignored (never validated, never stored), so an old page cannot fail here.
    const placeOfSupply = 'Tamil Nadu'

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `okr_${Date.now()}_${user.id.slice(0, 8)}`.slice(0, 40),
      notes: {
        app: 'okr-ally',
        brand,
        userId: user.id,
        pack: pack.id,
        credits: String(pack.credits),
        couponCode: couponCode ?? '',
        // listPrice = undiscounted pack price; base = net taxable value after the
        // coupon. Both stamped so the invoice can print the discount ladder.
        listPrice: String(pack.basePrice),
        discountPercent: String(discountPercent),
        base: String(base),
        gst: String(gst),
        total: String(total),
        placeOfSupply,
        buyerGstin: '',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      pack: pack.id,
      credits: pack.credits,
      base,
      gst,
      total,
      couponCode,
      prefill: { email: user.email, name: user.name },
      creditsRemaining: await getCreditsRemaining(user.id),
    })
  } catch (error) {
    console.error('OKR Ally create-order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
