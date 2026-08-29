import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getDraft, saveDraft, clearDraft, MAX_DRAFT_BYTES } from '@/lib/okrAllyForm'

export const dynamic = 'force-dynamic'

/** GET: the user's saved form draft (for the resume-on-return prompt), or null. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const draft = await getDraft(user.id)
  return NextResponse.json(draft ?? { formState: null })
}

/** PUT: autosave the current form state. Body: { formState: <opaque json> } */
export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const raw = await req.text()
  if (raw.length > MAX_DRAFT_BYTES) {
    return NextResponse.json({ error: 'Draft too large' }, { status: 413 })
  }
  let body: { formState?: unknown }
  try {
    body = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  if (body.formState === undefined) {
    return NextResponse.json({ error: 'formState is required' }, { status: 400 })
  }

  await saveDraft(user.id, body.formState)
  return NextResponse.json({ ok: true })
}

/** DELETE: clear the draft (after a successful submission). */
export async function DELETE(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  await clearDraft(user.id)
  return NextResponse.json({ ok: true })
}
