import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * Legacy magic-link endpoint.
 *
 * Academy sign-in is now a typed 6-digit code (POST /api/academy/sign-in-code
 * then /verify). Magic links are no longer issued, but old ones may still be
 * sitting in inboxes — send anyone who clicks one to the login page, which will
 * email them a fresh code.
 */
export async function GET(req: NextRequest) {
  return NextResponse.redirect(new URL('/academy/login?error=link-retired', req.url))
}
