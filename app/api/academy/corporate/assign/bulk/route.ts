import { NextRequest, NextResponse } from 'next/server'
import { getSessionLearner } from '@/lib/academy'
import { bulkAssignSeats, AcademyOrgError } from '@/lib/academyCorporate'

export const dynamic = 'force-dynamic'

/**
 * Bulk-assign one seat each to a list of employee emails.
 * Body: { courseSeatsId, text } — `text` is a pasted list or an uploaded CSV;
 * one email per line, the first column only. A leading `email` header line is
 * ignored. The real file line number is preserved for the error report.
 */
export async function POST(req: NextRequest) {
  const learner = await getSessionLearner(req)
  if (!learner) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const courseSeatsId = typeof body.courseSeatsId === 'string' ? body.courseSeatsId : ''
  const text = typeof body.text === 'string' ? body.text : ''
  if (!courseSeatsId) return NextResponse.json({ ok: false, error: 'Missing course pool' }, { status: 400 })

  const lines: string[] = String(text).split(/\r?\n/)
  const rows: { row: number; email: string }[] = []
  lines.forEach((line: string, i: number) => {
    const cell = line.split(',')[0].trim()
    if (!cell) return
    if (i === 0 && cell.toLowerCase() === 'email') return // header
    rows.push({ row: i + 1, email: cell })
  })

  try {
    const r = await bulkAssignSeats(learner.email, { courseSeatsId, rows })
    return NextResponse.json(r, r.ok ? undefined : { status: 400 })
  } catch (e) {
    if (e instanceof AcademyOrgError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 403 })
    }
    console.error('Academy corporate bulk assign error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
