import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { reclaimOrgCredits, OrgError } from '@/lib/okrAllyOrg'

export const dynamic = 'force-dynamic'

/** Company Admin — reclaim an employee's UNUSED org credits back to the pool.
 *  Body: { email }. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  try {
    const result = await reclaimOrgCredits(user, {
      email: typeof body.email === 'string' ? body.email : '',
    })
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('OKR Ally org reclaim error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
