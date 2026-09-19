import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { acceptAdminInvite } from '@/lib/okrAllyOrg'
import { toBrand } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/** The INVITED user's own explicit accept — no admin gate, any signed-in
 *  user whose email matches a pending invite. Signing in alone never grants
 *  admin; this call is the deliberate second step. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  try {
    const result = await acceptAdminInvite(user, toBrand(body.brand))
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
    return NextResponse.json(result)
  } catch (e) {
    console.error('OKR Ally org accept-admin-invite error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
