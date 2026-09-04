import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, OKR_ALLY_DEMO_COOKIE } from '@/lib/okrAlly'
import { signDemoSession, DEMO_SESSION_MAX_AGE_SECONDS } from '@/lib/okrAllySession'
import { viewAsTarget } from '@/lib/okrAllyDemo'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/**
 * Corporate demo only — re-sign the `okr_ally_demo` cookie to another user in
 * the SAME demo org, so PGS can show the admin view and a locked-context
 * employee view in one session with no second sign-in.
 * Body: { role: 'admin' | 'employee', brand }.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const brand = toBrand(body.brand)
  const role: 'admin' | 'employee' = body.role === 'employee' ? 'employee' : 'admin'

  const user = await getSessionUser(req)
  if (!user || !user.is_demo) {
    return NextResponse.json({ error: 'No demo session.' }, { status: 403 })
  }

  const targetId = await viewAsTarget(user.id, role)
  if (!targetId) {
    return NextResponse.json({ error: 'Not a corporate demo.' }, { status: 400 })
  }

  const res = NextResponse.json({ ok: true, role, redirect: vocab(brand).path })
  res.cookies.set(OKR_ALLY_DEMO_COOKIE, signDemoSession(targetId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
    path: '/',
  })
  return res
}
