import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken } from '@/lib/okrAllySanity'
import { resolveOrCreateUser, OKR_ALLY_SESSION_COOKIE } from '@/lib/okrAlly'
import { signAdminSession, ADMIN_SESSION_MAX_AGE_SECONDS } from '@/lib/okrAllySession'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

const REGULAR_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const dynamic = 'force-dynamic'

/**
 * OKR Ally magic-link verification (build sequence, section 10, step 2).
 *
 * A successful verification resolves to (or creates) a Neon `users` row and
 * sets the session cookie. Regular users get a 7-day cookie holding their Neon
 * UUID. An admin (is_admin = true) instead gets a 24h signed token
 * (lib/okrAllySession.ts) — the shorter, non-forgeable session required for the
 * admin account, re-minted only by verifying a fresh magic link.
 *
 * This is the OKR Ally counterpart to /api/academy/verify, kept separate so the
 * live Academy session (which stores a learnerRecord _id) is untouched.
 */
export async function GET(req: NextRequest) {
  const brand = toBrand(req.nextUrl.searchParams.get('brand'))
  const base = vocab(brand).path // '/okr-ally' | '/goal-ally'
  const loginUrl = (error: string) =>
    NextResponse.redirect(new URL(`${base}?error=${error}`, req.url))

  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return loginUrl('invalid-link')

    const result = await verifyMagicToken(token)
    if (!result?.email) return loginUrl('link-expired')

    const user = await resolveOrCreateUser(result.email)

    const response = NextResponse.redirect(new URL(base, req.url))
    response.cookies.set(
      OKR_ALLY_SESSION_COOKIE,
      user.is_admin ? signAdminSession(user.id) : user.id,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // Admins: 24h, then a fresh magic link is required. Everyone else: 7d.
        maxAge: user.is_admin ? ADMIN_SESSION_MAX_AGE_SECONDS : REGULAR_SESSION_MAX_AGE_SECONDS,
        path: '/',
      }
    )
    return response
  } catch (error) {
    console.error('OKR Ally verify error:', error)
    return loginUrl('server-error')
  }
}
