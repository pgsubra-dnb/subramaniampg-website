import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getStatus } from '@/lib/okrAllyPricing'

export const dynamic = 'force-dynamic'

/** Credit balance + free-review eligibility + pack pricing, for the form's
 *  confirm screen and the Pricing tab. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  return NextResponse.json(await getStatus(user.id))
}
