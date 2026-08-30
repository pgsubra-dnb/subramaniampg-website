import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { grantCreditsAsAdmin } from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'

/**
 * Manual credit grant (admin only). Body: { email, credits, note? }.
 * The recipient is always emailed; a grant to an account with no completed
 * review succeeds but comes back with a `warning`.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const result = await grantCreditsAsAdmin(user, {
    email: typeof body.email === 'string' ? body.email : '',
    credits: Number(body.credits),
    note: typeof body.note === 'string' ? body.note : null,
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })

  return NextResponse.json({
    ok: true,
    creditsRemaining: result.creditsRemaining,
    recipientEmail: result.recipientEmail,
    recipientName: result.recipientName,
    emailed: result.emailed,
    ...(result.firstReviewPending
      ? { warning: 'This account has not completed a review yet — the credits are still added.' }
      : {}),
  })
}
