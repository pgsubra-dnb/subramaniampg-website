import { NextRequest, NextResponse } from 'next/server'
import { verifySignInCode } from '@/lib/okrAllySanity'
import { resolveOrCreateUser, OKR_ALLY_SESSION_COOKIE } from '@/lib/okrAlly'
import { signAdminSession, ADMIN_SESSION_MAX_AGE_SECONDS } from '@/lib/okrAllySession'
import { allow } from '@/lib/okrAllyRateLimit'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

const REGULAR_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_RE = /^\d{6}$/

// Wrong-guess messages are deliberately generic — they don't leak how many
// tries remain. 'locked' and 'expired' both say "request a new one".
const WRONG = 'That code isn’t right. Check it and try again, or request a new one.'
const STALE = 'That code has expired. Request a new one below.'

/**
 * OKR Ally / Goal Ally email gate — step 2: verify a typed 6-digit code.
 *
 * Takes the email + code directly in the POST body — there is no token-in-URL
 * path. On success this resolves to (or creates) a Neon `users` row and sets
 * the session cookie: a 7-day cookie holding the Neon UUID for regular users,
 * or a 24h signed token (lib/okrAllySession.ts) for an admin (is_admin = true).
 * The client then reloads so the app picks up the session.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const brand = toBrand(body.brand)

  try {
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''

    if (!EMAIL_RE.test(email) || !CODE_RE.test(code)) {
      return NextResponse.json({ error: WRONG }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    // Backstop the per-code attempt cap with an IP/email throttle so the endpoint
    // can't be hammered across many freshly-requested codes.
    if (
      !allow(`sign-in-verify:email:${email}`, 20, 15 * 60 * 1000) ||
      !allow(`sign-in-verify:ip:${ip}`, 300, 15 * 60 * 1000)
    ) {
      return NextResponse.json({ error: STALE }, { status: 429 })
    }

    const result = await verifySignInCode(email, code)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'invalid' ? WRONG : STALE },
        { status: 401 }
      )
    }

    const user = await resolveOrCreateUser(result.email)

    const response = NextResponse.json({ ok: true, redirect: vocab(brand).path })
    response.cookies.set(
      OKR_ALLY_SESSION_COOKIE,
      user.is_admin ? signAdminSession(user.id) : user.id,
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        // Admins: 24h, then a fresh code is required. Everyone else: 7d.
        maxAge: user.is_admin ? ADMIN_SESSION_MAX_AGE_SECONDS : REGULAR_SESSION_MAX_AGE_SECONDS,
        path: '/',
      }
    )
    return response
  } catch (error) {
    console.error('OKR Ally sign-in-code verify error:', error)
    return NextResponse.json({ error: 'Something went wrong signing you in. Try again below.' }, { status: 500 })
  }
}
