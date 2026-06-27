import { NextRequest, NextResponse } from 'next/server'
import { verifyMagicToken, getLearnerByEmail } from '@/lib/academy'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/academy?error=invalid-link', req.url))
    }

    const email = await verifyMagicToken(token)
    if (!email) {
      return NextResponse.redirect(new URL('/academy?error=link-expired', req.url))
    }

    const learner = await getLearnerByEmail(email)
    if (!learner) {
      return NextResponse.redirect(new URL('/academy?error=not-found', req.url))
    }

    const response = NextResponse.redirect(new URL('/academy/dashboard', req.url))
    response.cookies.set('academy_session', learner._id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.redirect(new URL('/academy?error=server-error', req.url))
  }
}
