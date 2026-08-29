import { NextRequest, NextResponse } from 'next/server'
import { OKR_ALLY_SESSION_COOKIE } from '@/lib/okrAlly'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/okr-ally', req.url))
  response.cookies.delete(OKR_ALLY_SESSION_COOKIE)
  return response
}
