import { NextRequest, NextResponse } from 'next/server'
import { OKR_ALLY_SESSION_COOKIE } from '@/lib/okrAlly'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // ?signedout=1 → the client shows a thank-you + share screen before the intro.
  const base = vocab(toBrand(req.nextUrl.searchParams.get('brand'))).path
  const response = NextResponse.redirect(new URL(`${base}?signedout=1`, req.url))
  response.cookies.delete(OKR_ALLY_SESSION_COOKIE)
  return response
}
