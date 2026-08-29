import { NextRequest, NextResponse } from 'next/server'
import { OKR_ALLY_SESSION_COOKIE } from '@/lib/okrAlly'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // ?signedout=1 → the client shows a thank-you + share screen before the intro.
  const response = NextResponse.redirect(new URL('/okr-ally?signedout=1', req.url))
  response.cookies.delete(OKR_ALLY_SESSION_COOKIE)
  return response
}
