import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, markWalkthroughSeen, WALKTHROUGH_KEYS, type WalkthroughKey } from '@/lib/okrAlly'

export const dynamic = 'force-dynamic'

/**
 * Record that a role-specific walkthrough has been auto-shown to this user, so
 * it doesn't auto-pop on their next visit. It stays reopenable from the "see
 * this again" link. Idempotent.
 *
 * Body: { key: 'org_admin' | 'employee' }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  if (typeof body.key !== 'string' || !WALKTHROUGH_KEYS.includes(body.key as WalkthroughKey)) {
    return NextResponse.json({ error: 'Unknown walkthrough key' }, { status: 400 })
  }

  await markWalkthroughSeen(user.id, body.key as WalkthroughKey)
  return NextResponse.json({ ok: true })
}
