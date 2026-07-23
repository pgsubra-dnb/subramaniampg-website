import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/worklifeDb'

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const id = Number(body.id)
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    await query('update worklife_survey_responses set calendar_clicked = true where id = $1', [id])
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[worklife-survey/calendar-click] update failed:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
