import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { paraphraseField, contextFieldMax, CONTEXT_FIELD_MAX, type ContextFieldKind } from '@/lib/okrAllyContext'
import { allow, allowDailyContextCall } from '@/lib/okrAllyRateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const KINDS: ContextFieldKind[] = ['company', 'business', 'role']

/**
 * Context paraphrase step (design §4). Body: { field, text } where `text` is the
 * finalized field (original + any clarifying answer). Returns { paraphrase }.
 * The form shows it next to the original with Confirm / Modify / Ignore.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  if (!allow(`ctx:${user.id}`, 30, 60_000)) {
    return NextResponse.json({ error: 'Too many requests, slow down a moment.' }, { status: 429 })
  }
  const daily = await allowDailyContextCall(user.id)
  if (!daily.ok) {
    return NextResponse.json(
      { error: 'You have hit the daily limit for context help. It resets tomorrow.' },
      { status: 429 }
    )
  }

  const body = await req.json().catch(() => ({}))
  const field = body.field as ContextFieldKind
  if (!KINDS.includes(field)) {
    return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text : ''
  if (!text.trim()) return NextResponse.json({ error: 'Nothing to paraphrase' }, { status: 400 })
  // `text` is the finalized field (original + any clarifying answer), so allow
  // the field's own limit plus one more field's worth of headroom for the answer.
  if (text.length > contextFieldMax(field) + CONTEXT_FIELD_MAX) {
    return NextResponse.json({ error: 'That text is too long to paraphrase' }, { status: 400 })
  }

  const result = await paraphraseField(field, text)
  if (!result.ok) {
    console.error('OKR Ally context paraphrase failed:', field, result.reason)
    // Non-blocking: the form falls back to the original text (Ignore behaviour).
    return NextResponse.json({ paraphrase: null, degraded: true })
  }
  return NextResponse.json({ paraphrase: result.paraphrase })
}
