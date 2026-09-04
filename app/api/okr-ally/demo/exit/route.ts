import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, OKR_ALLY_DEMO_COOKIE } from '@/lib/okrAlly'
import { tearDownDemo } from '@/lib/okrAllyDemo'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Leave demo mode. Deletes the `okr_ally_demo` cookie only — PGS's real admin
 * session on `okr_ally_session` is untouched, so he lands straight back in the
 * admin view. Best-effort tears down the demo (individual account OR the whole
 * corporate org) it was in.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const brand = toBrand(body.brand)

  const user = await getSessionUser(req)
  if (user?.is_demo) {
    await tearDownDemo(user.id).catch((e) => console.error('demo exit: cleanup failed', e))
  }

  const res = NextResponse.json({ ok: true, redirect: vocab(brand).path })
  res.cookies.delete(OKR_ALLY_DEMO_COOKIE)
  return res
}
