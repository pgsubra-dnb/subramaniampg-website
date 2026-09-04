import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, OKR_ALLY_DEMO_COOKIE } from '@/lib/okrAlly'
import { signDemoSession, DEMO_SESSION_MAX_AGE_SECONDS } from '@/lib/okrAllySession'
import {
  createDemoUser,
  seedIndividualHistory,
  createCorporateDemo,
  purgeExpiredDemoData,
} from '@/lib/okrAllyDemo'
import { toBrand, vocab, type Brand } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Start a demo session (PGS's `is_admin` account only). Body: { brand, mode }.
 *
 *  - mode 'individual' — one demo account; its History is pre-seeded with clones
 *    from the seed library (real review of PGS's own submission + real reviews of
 *    synthetic drafts — see lib/okrAllyDemoSeeds.ts).
 *  - mode 'corporate' — a demo org (context unconfirmed), a demo admin, and two
 *    demo employees with cloned history + a matching allocation ledger. The
 *    cookie is bound to the admin; "View as employee" re-signs it.
 *
 * The `okr_ally_demo` cookie is SEPARATE from `okr_ally_session`, so PGS's real
 * admin session is untouched and "Exit demo" just deletes this one.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const brand: Brand = toBrand(body.brand)
  const mode: 'individual' | 'corporate' = body.mode === 'corporate' ? 'corporate' : 'individual'

  try {
    const user = await getSessionUser(req)
    if (!user || !user.is_admin) {
      return NextResponse.json(
        { error: user?.is_demo ? 'A demo is already running — use “Reset demo”.' : 'Admin only.' },
        { status: 403 }
      )
    }

    purgeExpiredDemoData(24).catch(() => {})

    let cookieUserId: string
    if (mode === 'corporate') {
      const demo = await createCorporateDemo(brand)
      cookieUserId = demo.adminUserId
    } else {
      const demoUser = await createDemoUser()
      await seedIndividualHistory(demoUser.id, brand)
      cookieUserId = demoUser.id
    }

    const res = NextResponse.json({
      ok: true,
      mode,
      redirect: `${vocab(brand).path}?demo=intro`,
    })
    res.cookies.set(OKR_ALLY_DEMO_COOKIE, signDemoSession(cookieUserId), {
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
