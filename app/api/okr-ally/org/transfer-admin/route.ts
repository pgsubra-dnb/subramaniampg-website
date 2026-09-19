import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { transferAdminToExistingMember, OrgError } from '@/lib/okrAllyOrg'
import { toBrand } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/** Company Admin — immediate handover to an EXISTING member of this org.
 *  Body: { targetUserId }. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  try {
    const result = await transferAdminToExistingMember(
      user,
      typeof body.targetUserId === 'string' ? body.targetUserId : '',
      toBrand(body.brand)
    )
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('OKR Ally org transfer-admin error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
