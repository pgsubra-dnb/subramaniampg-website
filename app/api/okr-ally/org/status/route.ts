import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getOrgAdminContext, OrgError } from '@/lib/okrAllyOrg'

export const dynamic = 'force-dynamic'

/** Company Admin — org pool status (purchased / allocated / available).
 *  403 for any signed-in user who is not this org's admin. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  try {
    return NextResponse.json(await getOrgAdminContext(user))
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('OKR Ally org status error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
