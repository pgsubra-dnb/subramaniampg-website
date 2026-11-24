import { NextResponse } from 'next/server'
import { getPackRateCard } from '@/lib/okrAllyPricing'

export const dynamic = 'force-dynamic'

/**
 * PUBLIC, read-only individual rate card for signed-out visitors on the
 * Pricing tab. Returns only the static pack prices — no session, no balances,
 * no coupon or free-review state. Anything that buys, reviews or reads user
 * data (create-order, verify-payment, review, history, status, …) still
 * requires a signed-in session on the server.
 */
export async function GET() {
  return NextResponse.json({ packs: getPackRateCard() })
}
