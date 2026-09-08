import { NextRequest, NextResponse } from 'next/server'
import { getSessionLearner } from '@/lib/academy'
import { resendSeatEnrolment, AcademyOrgError } from '@/lib/academyCorporate'

export const dynamic = 'force-dynamic'

/** Re-run the enrolment + login-link email for a seat (e.g. enrolment pending,
 *  or the employee lost the link). Body: { assignmentId } */
export async function POST(req: NextRequest) {
  const learner = await getSessionLearner(req)
  if (!learner) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const assignmentId = typeof body.assignmentId === 'string' ? body.assignmentId : ''
  if (!assignmentId) return NextResponse.json({ ok: false, error: 'Missing assignment' }, { status: 400 })

  try {
    const r = await resendSeatEnrolment(learner.email, { assignmentId })
    return NextResponse.json(r, r.ok ? undefined : { status: 400 })
  } catch (e) {
    if (e instanceof AcademyOrgError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 403 })
    }
    console.error('Academy corporate resend error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
