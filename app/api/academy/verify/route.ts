import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, getLearnerByEmail } from '@/lib/academy'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/academy/login?error=invalid-link', req.url))
    }

    const result = await verifyMagicToken(token)
    if (!result) {
      return NextResponse.redirect(new URL('/academy/login?error=link-expired', req.url))
    }

    let learnerId = result.learnerId
    if (!learnerId) {
      // Legacy fallback for tokens issued before learnerId was stored on magicToken.
      const learner = await getLearnerByEmail(result.email)
      if (!learner) {
        return NextResponse.redirect(new URL('/academy/login?error=not-found', req.url))
      }
      learnerId = learner._id
    }

    if (!learnerId) {
      return NextResponse.redirect(new URL('/academy/login?error=server-error', req.url))
    }

    const response = NextResponse.redirect(new URL('/academy/dashboard', req.url))
    response.cookies.set('academy_session', learnerId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/academy/login?error=server-error', req.url))
  }
}
