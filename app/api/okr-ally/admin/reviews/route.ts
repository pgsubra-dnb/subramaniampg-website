import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { listAdminReviews } from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'

/** Every completed review across all users, for the admin (expert-review) tab. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  return NextResponse.json({ items: await listAdminReviews(user) })
}
