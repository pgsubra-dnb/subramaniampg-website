import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getOrgMembers, OrgError } from '@/lib/okrAllyOrg'

export const dynamic = 'force-dynamic'

/** Company Admin — every member of this admin's organization, admin first.
 *  Feeds the "transfer admin to an existing member" picker. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  try {
    const members = await getOrgMembers(user)
    return NextResponse.json({ members })
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('OKR Ally org members error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
