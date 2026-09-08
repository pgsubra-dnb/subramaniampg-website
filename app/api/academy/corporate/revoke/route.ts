import { NextRequest, NextResponse } from 'next/server'
import { getSessionLearner } from '@/lib/academy'
import { revokeSeat, AcademyOrgError } from '@/lib/academyCorporate'

export const dynamic = 'force-dynamic'

/** Reclaim an unused seat back into the pool. Body: { assignmentId } */
export async function POST(req: NextRequest) {
  const learner = await getSessionLearner(req)
  if (!learner) return NextResponse.json({ ok: false, error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const assignmentId = typeof body.assignmentId === 'string' ? body.assignmentId : ''
  if (!assignmentId) return NextResponse.json({ ok: false, error: 'Missing assignment' }, { status: 400 })

  try {
    const r = await revokeSeat(learner.email, { assignmentId })
    return NextResponse.json(r, r.ok ? undefined : { status: 400 })
  } catch (e) {
    if (e instanceof AcademyOrgError) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 403 })
    }
    console.error('Academy corporate revoke error:', e)
    return NextResponse.json({ ok: false, error: 'Internal error' }, { status: 500 })
  }
}
