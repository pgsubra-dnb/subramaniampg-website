import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getFullReport } from '@/lib/okrAllyHistory'

export const dynamic = 'force-dynamic'

/** Full submission + review + this user's feedback, for the report screen
 *  (fresh or reopened from History). Ownership-scoped. */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const report = await getFullReport(user.id, params.id)
  if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(report)
}
