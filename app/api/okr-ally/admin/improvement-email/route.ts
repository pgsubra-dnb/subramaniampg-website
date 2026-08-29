import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import {
  generateImprovementEmail,
  saveImprovementEmailEdit,
  sendImprovementEmail,
} from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'
// The 'generate' action makes one Claude call.
export const maxDuration = 60

/**
 * Improvement-email actions (admin only). Body:
 *   { action: 'generate' | 'save' | 'send', reviewId, finalText? }
 *
 * 'generate' — Claude drafts the note from PGS's expert feedback (both options required).
 * 'save'     — persist PGS's edited text as final_text.
 * 'send'     — email final_text (falls back to draft_text) to the review owner via
 *              Brevo; only stamps sent_at on a confirmed delivery.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const action = body.action
  const reviewId = typeof body.reviewId === 'string' ? body.reviewId : ''

  if (action === 'generate') {
    const r = await generateImprovementEmail(user, reviewId)
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ draft: r.draft })
  }

  if (action === 'save') {
    const r = await saveImprovementEmailEdit(user, reviewId, typeof body.finalText === 'string' ? body.finalText : '')
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ ok: true })
  }

  if (action === 'send') {
    // Persist the latest edit first so what PGS sees is what goes out.
    if (typeof body.finalText === 'string' && body.finalText.trim()) {
      await saveImprovementEmailEdit(user, reviewId, body.finalText)
    }
    const r = await sendImprovementEmail(user, reviewId)
    if (!r.sent) return NextResponse.json({ sent: false, error: r.error || 'Send failed' }, { status: 502 })
    return NextResponse.json({ sent: true, sentAt: r.sentAt })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
