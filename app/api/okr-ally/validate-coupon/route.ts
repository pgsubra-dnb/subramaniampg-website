import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { validateCoupon, PACKS, getPack, gstBreakdown } from '@/lib/okrAllyBilling'

export const dynamic = 'force-dynamic'

/**
 * Validate a coupon for the OKR Ally Pricing tab. Layers the one-per-user
 * Neon check on top of the Sanity coupon rules (active, unexpired, anchored to
 * the OKR Ally course). Optionally returns the discounted GST breakdown for a
 * given pack so the UI can show the new total.
 *
 * Body: { code: string, pack?: 'single' | 'pack5' | 'pack10' }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ valid: false, reason: 'Not signed in' }, { status: 401 })
    }
    if (user.is_demo) {
      return NextResponse.json({ valid: false, reason: 'Coupons are disabled in demo mode.' }, { status: 403 })
    }

    const body = await req.json().catch(() => ({}))
    if (typeof body.code !== 'string' || !body.code.trim()) {
      return NextResponse.json({ valid: false, reason: 'Enter a coupon code' }, { status: 400 })
    }

    const result = await validateCoupon(body.code, user.id)
    if (!result.valid) {
      return NextResponse.json({ valid: false, reason: result.reason })
    }

    const pack = getPack(body.pack)
    const pricing = (pack ? [pack] : Object.values(PACKS)).map((p) => {
      const discountedBase = Math.round(p.basePrice * (1 - result.discountPercent / 100))
      return { pack: p.id, credits: p.credits, ...gstBreakdown(discountedBase) }
    })

    return NextResponse.json({
      valid: true,
      code: result.code,
      discountPercent: result.discountPercent,
      pricing,
    })
  } catch (error) {
    console.error('OKR Ally validate-coupon error:', error)
    return NextResponse.json({ valid: false, reason: 'Internal error' }, { status: 500 })
  }
}
