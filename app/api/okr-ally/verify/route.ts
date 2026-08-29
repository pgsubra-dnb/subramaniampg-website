import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken } from '@/lib/okrAllySanity'
import { resolveOrCreateUser, OKR_ALLY_SESSION_COOKIE } from '@/lib/okrAlly'

export const dynamic = 'force-dynamic'

/**
 * OKR Ally magic-link verification (build sequence, section 10, step 2).
 *
 * A successful verification resolves to (or creates) a Neon `users` row and
 * sets the session cookie to that Neon user's UUID — not a Sanity document id.
 * This is the OKR Ally counterpart to /api/academy/verify, kept separate so the
 * live Academy session (which stores a learnerRecord _id) is untouched.
 */
export async function GET(req: NextRequest) {
  const loginUrl = (error: string) =>
    NextResponse.redirect(new URL(`/okr-ally?error=${error}`, req.url))

  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) return loginUrl('invalid-link')

    const result = await verifyMagicToken(token)
    if (!result?.email) return loginUrl('link-expired')

    const user = await resolveOrCreateUser(result.email)

    const response = NextResponse.redirect(new URL('/okr-ally', req.url))
    response.cookies.set(OKR_ALLY_SESSION_COOKIE, user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch (error) {
    console.error('OKR Ally verify error:', error)
    return loginUrl('server-error')
  }
}
