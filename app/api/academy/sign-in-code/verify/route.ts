import { NextRequest, NextResponse } from 'next/server'
import { verifySignInCode, getLearnerByEmail, ACADEMY_SESSION_COOKIE } from '@/lib/academy'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CODE_RE = /^\d{6}$/
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

const WRONG = 'That code isn’t right. Check it and try again, or request a new one.'
const STALE = 'That code has expired. Request a new one below.'

// Only ever redirect to a path inside the Academy — never an absolute URL, so a
// crafted `redirect` value can't turn this into an open redirect.
function safeRedirect(value: unknown): string {
  if (typeof value !== 'string') return '/academy/dashboard'
  if (!value.startsWith('/academy/') || value.startsWith('//')) return '/academy/dashboard'
  return value
}

/**
 * Academy sign-in — step 2: verify a typed 6-digit code.
 *
 * Takes email + code in the POST body — there is no token-in-URL path. On
 * success this sets the `academy_session` cookie (the learnerRecord._id, same
 * as the old magic link did) and returns `{ ok: true, redirect }` for the
 * client to navigate the current tab to.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const code = typeof body.code === 'string' ? body.code.trim() : ''
    const redirect = safeRedirect(body.redirect)

    if (!EMAIL_RE.test(email) || !CODE_RE.test(code)) {
      return NextResponse.json({ error: WRONG }, { status: 400 })
    }

    const result = await verifySignInCode(email, code)
    if (!result.ok) {
      return NextResponse.json(
        { error: result.reason === 'invalid' ? WRONG : STALE },
        { status: 401 }
      )
    }

    const learner = await getLearnerByEmail(result.email)
    if (!learner?._id) {
      return NextResponse.json(
        { error: 'We couldn’t find an account for that email. Enrol first, then sign in.' },
        { status: 404 }
      )
    }

    const response = NextResponse.json({ ok: true, redirect })
    response.cookies.set(ACADEMY_SESSION_COOKIE, learner._id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('Academy sign-in-code verify error:', error)
    return NextResponse.json(
      { error: 'Something went wrong signing you in. Try again below.' },
      { status: 500 }
    )
  }
}
