import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getSessionUser } from '@/lib/okrAlly'
import { getBundle, bundlePricing } from '@/lib/okrAllyOrg'
import { GST_STATES, stateCode, GSTIN_RE } from '@/lib/indiaGstStates'

export const dynamic = 'force-dynamic'

/**
 * Create a Razorpay order for a corporate OKR Ally credit bundle.
 * Signed-in only. The signed-in user is the purchaser; a separate
 * `adminEmail` field is the designated org admin (buyer ≠ admin is allowed).
 *
 * Body: { bundle: 'b100'|'b200'|'b500', companyName, gstin, registeredAddress,
 *         buyerState, adminEmail }
 *
 * Price/GST are computed server-side from CORP_BUNDLES; the client never sends
 * an amount. Company + admin details are stamped onto the order notes so
 * verify-payment / the webhook fulfil from trusted data.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) return NextResponse.json({ error: 'Sign in to buy corporate credits' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const bundle = getBundle(body.bundle)
    if (!bundle) return NextResponse.json({ error: 'Choose one of the three bundles' }, { status: 400 })

    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    if (companyName.length < 2 || companyName.length > 200) {
      return NextResponse.json({ error: 'Enter the company name' }, { status: 400 })
    }

    const gstin = typeof body.gstin === 'string' ? body.gstin.trim().toUpperCase() : ''
    if (!GSTIN_RE.test(gstin)) {
      return NextResponse.json({ error: 'That GSTIN is not valid (15 characters, e.g. 29ABCDE1234F1Z5)' }, { status: 400 })
    }

    const registeredAddress = typeof body.registeredAddress === 'string' ? body.registeredAddress.trim() : ''
    if (registeredAddress.length < 10 || registeredAddress.length > 500) {
      return NextResponse.json({ error: 'Enter the company’s registered address' }, { status: 400 })
    }

    const rawState = typeof body.buyerState === 'string' ? body.buyerState.trim() : ''
    const code = rawState && stateCode(rawState)
    if (!code) {
      return NextResponse.json({ error: 'Select the state (place of supply)' }, { status: 400 })
    }
    const placeOfSupply = GST_STATES.find((s) => s.code === code)!.name

    const adminEmail = typeof body.adminEmail === 'string' ? body.adminEmail.trim().toLowerCase() : ''
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
      return NextResponse.json({ error: 'Enter a valid designated-admin email address' }, { status: 400 })
    }

    const { base, gst, total, amountInPaise } = bundlePricing(bundle)

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `okrcorp_${Date.now()}_${user.id.slice(0, 8)}`.slice(0, 40),
      notes: {
        app: 'okr-ally',
        kind: 'corporate',
        purchaserUserId: user.id,
        adminEmail,
        companyName,
        gstin,
        registeredAddress,
        credits: String(bundle.credits),
        listPrice: String(base),
        base: String(base),
        gst: String(gst),
        total: String(total),
        placeOfSupply,
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      credits: bundle.credits,
      base,
      gst,
      total,
      prefill: { email: user.email, name: user.name },
    })
  } catch (error) {
    console.error('OKR Ally corporate create-order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
