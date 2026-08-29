import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getSessionUser, getCreditsRemaining } from '@/lib/okrAlly'
import { getPack, gstBreakdown, validateCoupon } from '@/lib/okrAllyBilling'
import { GST_STATES, stateCode, GSTIN_RE } from '@/lib/indiaGstStates'

export const dynamic = 'force-dynamic'

/**
 * Create a Razorpay order for an OKR Ally credit pack (build sequence step 4).
 * Body: {
 *   pack: 'single' | 'pack5' | 'pack10',
 *   couponCode?: string,  // percentage discount on the pack price
 *   buyerState: string,   // mandatory — place of supply (name or 2-digit code)
 *   buyerGstin?: string,  // optional — printed on the GST invoice for input tax credit
 * }
 *
 * The pack price and GST are computed server-side from lib/okrAllyBilling PACKS
 * — the client never sends an amount. base/gst/total and the buyer's
 * state/GSTIN are stamped onto the order notes so verify-payment and the
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

    const body = await req.json().catch(() => ({}))
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
          error:
            'This coupon covers a full review at no cost. You don’t need to buy credits — start your review and enter the code there.',
          applyAtSubmission: true,
        },
        { status: 400 }
      )
    }

    // Place of supply — mandatory (drives the invoice tax split).
    const rawState = typeof body.buyerState === 'string' ? body.buyerState.trim() : ''
    const code = rawState && stateCode(rawState)
    if (!code) {
      return NextResponse.json(
        { error: 'Select your state (place of supply) to continue' },
        { status: 400 }
      )
    }
    const placeOfSupply = GST_STATES.find((s) => s.code === code)!.name

    let buyerGstin: string | null = null
    if (typeof body.buyerGstin === 'string' && body.buyerGstin.trim()) {
      const g = body.buyerGstin.trim().toUpperCase()
      if (!GSTIN_RE.test(g)) {
        return NextResponse.json({ error: 'That GSTIN is not valid' }, { status: 400 })
      }
      buyerGstin = g
    }

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
        userId: user.id,
        pack: pack.id,
        credits: String(pack.credits),
        couponCode: couponCode ?? '',
        base: String(base),
        gst: String(gst),
        total: String(total),
        placeOfSupply,
        buyerGstin: buyerGstin ?? '',
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
