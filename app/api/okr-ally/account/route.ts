import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getAccountActivity } from '@/lib/okrAllyHistory'

export const dynamic = 'force-dynamic'

/** The signed-in user's money history for the History dashboard: pack purchases + GST invoices. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  return NextResponse.json(await getAccountActivity(user.id))
}
