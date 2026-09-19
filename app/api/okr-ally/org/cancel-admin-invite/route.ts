import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { cancelAdminInvite, OrgError } from '@/lib/okrAllyOrg'

export const dynamic = 'force-dynamic'

/** Company Admin — withdraw an outstanding invite-by-email. No-op if none. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  try {
    return NextResponse.json(await cancelAdminInvite(user))
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('OKR Ally org cancel-admin-invite error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
