import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, OKR_ALLY_DEMO_COOKIE } from '@/lib/okrAlly'
import { signDemoSession, DEMO_SESSION_MAX_AGE_SECONDS } from '@/lib/okrAllySession'
import { createDemoUser, deleteDemoUser, purgeExpiredDemoData } from '@/lib/okrAllyDemo'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/**
 * Reset the demo — a clean slate for the next corporate audience without
 * leaving the page. Mints a brand-new demo account (full isolation between
 * runs) and best-effort deletes the one just used, then the client reloads to
 * the intro screen.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const brand = toBrand(body.brand)

  try {
    const user = await getSessionUser(req)
    if (!user || !user.is_demo) {
      return NextResponse.json({ error: 'No demo session to reset.' }, { status: 403 })
    }

    const previous = user.id
    const demoUser = await createDemoUser()

    deleteDemoUser(previous).catch((e) => console.error('demo reset: cleanup failed', e))
    purgeExpiredDemoData(24).catch(() => {})

    const res = NextResponse.json({ ok: true, redirect: `${vocab(brand).path}?demo=intro` })
    res.cookies.set(OKR_ALLY_DEMO_COOKIE, signDemoSession(demoUser.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: DEMO_SESSION_MAX_AGE_SECONDS,
      path: '/',
    })
    return res
  } catch (err) {
    console.error('OKR Ally demo reset error:', err)
    return NextResponse.json({ error: 'Could not reset the demo.' }, { status: 500 })
  }
}
