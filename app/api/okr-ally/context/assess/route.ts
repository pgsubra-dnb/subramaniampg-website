import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { assessField, normalizeForCompare, CONTEXT_FIELD_MAX, type ContextFieldKind } from '@/lib/okrAllyContext'
import { allow, allowDailyContextCall } from '@/lib/okrAllyRateLimit'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const KINDS: ContextFieldKind[] = ['company', 'business', 'role']

/**
 * Context assess step (design §4). Body:
 *   { field: 'company'|'business'|'role', text, lastCheckedText? }
 *
 * If `lastCheckedText` is supplied and matches `text` (whitespace-normalized),
 * the call short-circuits with `{ skipped: true }` and NO Haiku call — this is
 * how a returning user reusing unchanged saved-profile context is not re-asked.
 *
 * Otherwise returns { thin, needsParaphrase, question }.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const field = body.field as ContextFieldKind
  if (!KINDS.includes(field)) {
    return NextResponse.json({ error: 'Unknown field' }, { status: 400 })
  }
  const text = typeof body.text === 'string' ? body.text : ''
  if (text.length > CONTEXT_FIELD_MAX) {
    return NextResponse.json({ error: `That field exceeds ${CONTEXT_FIELD_MAX} characters` }, { status: 400 })
  }

  // Unchanged-since-last-check short-circuit — before any rate-limit spend,
  // since it does no Haiku work.
  if (
    typeof body.lastCheckedText === 'string' &&
    normalizeForCompare(body.lastCheckedText) === normalizeForCompare(text)
  ) {
    return NextResponse.json({ skipped: true })
  }

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

  const result = await assessField(field, text)
  if (!result.ok) {
    console.error('OKR Ally context assess failed:', field, result.reason)
    // Non-blocking: let the form proceed without a clarifying question.
    return NextResponse.json({ thin: false, needsParaphrase: true, question: null, degraded: true })
  }
  return NextResponse.json({
    thin: result.thin,
    needsParaphrase: result.needsParaphrase,
    question: result.question,
  })
}
