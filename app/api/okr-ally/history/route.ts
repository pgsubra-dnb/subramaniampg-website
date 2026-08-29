import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getHistory } from '@/lib/okrAllyHistory'

export const dynamic = 'force-dynamic'

/** The signed-in user's past submissions (objective, score, date), newest first. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  return NextResponse.json({ items: await getHistory(user.id) })
}
