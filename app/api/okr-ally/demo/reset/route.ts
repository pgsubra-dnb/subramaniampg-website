import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, OKR_ALLY_DEMO_COOKIE } from '@/lib/okrAlly'
import { signDemoSession, DEMO_SESSION_MAX_AGE_SECONDS } from '@/lib/okrAllySession'
import {
  createDemoUser,
  seedIndividualHistory,
  createCorporateDemo,
  corporateDemoFor,
  tearDownDemo,
  purgeExpiredDemoData,
} from '@/lib/okrAllyDemo'
import { toBrand, vocab, type Brand } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Reset the demo — a clean slate for the next audience without leaving the page.
 * Tears down the current demo (individual account OR the whole corporate org),
 * then spins up a fresh one in the SAME mode.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const brand: Brand = toBrand(body.brand)

  try {
    const user = await getSessionUser(req)
    if (!user || !user.is_demo) {
      return NextResponse.json({ error: 'No demo session to reset.' }, { status: 403 })
    }

    const wasCorporate = (await corporateDemoFor(user.id)) !== null
    const previous = user.id

    let cookieUserId: string
    let mode: 'individual' | 'corporate'
    if (wasCorporate) {
      mode = 'corporate'
      const demo = await createCorporateDemo(brand)
      cookieUserId = demo.adminUserId
    } else {
      mode = 'individual'
      const demoUser = await createDemoUser()
      await seedIndividualHistory(demoUser.id, brand)
      cookieUserId = demoUser.id
    }

    await tearDownDemo(previous).catch((e) => console.error('demo reset: cleanup failed', e))
    purgeExpiredDemoData(24).catch(() => {})

    const res = NextResponse.json({ ok: true, mode, redirect: `${vocab(brand).path}?demo=intro` })
    res.cookies.set(OKR_ALLY_DEMO_COOKIE, signDemoSession(cookieUserId), {
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
