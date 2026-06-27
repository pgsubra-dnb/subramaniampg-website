import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const response = NextResponse.redirect(new URL('/academy', req.url))
  response.cookies.delete('academy_session')
  return response
}
