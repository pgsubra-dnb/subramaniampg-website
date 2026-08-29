import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getAdminReview } from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'

/** Full completed review + verbatim submission + any existing expert feedback,
 *  for the admin review screen. Admin only. */
export async function GET(req: NextRequest, { params }: { params: { submissionId: string } }) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const data = await getAdminReview(user, params.submissionId)
  if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}
