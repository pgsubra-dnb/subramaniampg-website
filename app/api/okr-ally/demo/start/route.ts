import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, OKR_ALLY_DEMO_COOKIE } from '@/lib/okrAlly'
import { signDemoSession, DEMO_SESSION_MAX_AGE_SECONDS } from '@/lib/okrAllySession'
import { createDemoUser, purgeExpiredDemoData } from '@/lib/okrAllyDemo'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/**
 * Start a demo session (PGS's `is_admin` account only).
 *
 * Mints a fresh ephemeral demo account and hands back the `okr_ally_demo`
 * cookie bound to it — a SEPARATE cookie, so PGS's real admin session on
 * `okr_ally_session` is left untouched and "Exit demo" just deletes this one.
 *
 * The client then loads `${brand path}?demo=intro`, which shows the first-time
 * intro screen; from there "Say hi to Ally" / "See how it works" drop straight
 * into the app (the demo account is already authenticated).
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const brand = toBrand(body.brand)

  try {
    const user = await getSessionUser(req)
    if (!user || !user.is_admin) {
      // A demo already being active makes getSessionUser return the (non-admin)
      // demo account — reset it instead of starting another.
      return NextResponse.json(
        { error: user?.is_demo ? 'A demo is already running — use “Reset demo”.' : 'Admin only.' },
        { status: 403 }
      )
    }

    // Opportunistic housekeeping — sweep demo accounts older than a day.
    purgeExpiredDemoData(24).catch(() => {})

    const demoUser = await createDemoUser()
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
    console.error('OKR Ally demo start error:', err)
    return NextResponse.json({ error: 'Could not start the demo.' }, { status: 500 })
  }
}
