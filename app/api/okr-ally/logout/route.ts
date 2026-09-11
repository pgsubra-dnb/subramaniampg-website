import { NextRequest, NextResponse } from 'next/server'
import { OKR_ALLY_SESSION_COOKIE } from '@/lib/okrAlly'
import { sessionCookieDomain } from '@/lib/okrAllySession'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // ?signedout=1 → the client shows a thank-you + share screen before the intro.
  const base = vocab(toBrand(req.nextUrl.searchParams.get('brand'))).path
  const response = NextResponse.redirect(new URL(`${base}?signedout=1`, req.url))
  // A delete's Domain must match how the cookie was set, or the browser
  // leaves the real cookie in place (see sessionCookieDomain).
  response.cookies.delete({
    name: OKR_ALLY_SESSION_COOKIE,
    path: '/',
    domain: sessionCookieDomain(req.headers.get('host')),
  })
  return response
}
