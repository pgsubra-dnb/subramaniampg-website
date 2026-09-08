import { NextRequest, NextResponse } from 'next/server'
import { getSessionLearner } from '@/lib/academy'
import { assignSeat, AcademyOrgError } from '@/lib/academyCorporate'

export const dynamic = 'force-dynamic'

/** Assign one seat from a course pool to an employee email.
 *  Body: { courseSeatsId, email } */
export async function POST(req: NextRequest) {
  const learner = await getSessionLearner(req)
  if (!learner) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const courseSeatsId = typeof body.courseSeatsId === 'string' ? body.courseSeatsId : ''
  const email = typeof body.email === 'string' ? body.email : ''
  if (!courseSeatsId) return NextResponse.json({ ok: false, error: 'Missing course pool' }, { status: 400 })

  try {
    const r = await assignSeat(learner.email, { courseSeatsId, email })
    return NextResponse.json(r, r.ok ? undefined : { status: 400 })
  } catch (e) {
    if (e instanceof AcademyOrgError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 403 })
    }
    console.error('Academy corporate assign error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
