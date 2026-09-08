import { NextRequest, NextResponse } from 'next/server'
import { getSessionLearner } from '@/lib/academy'
import { getCompanyStatus, AcademyOrgError } from '@/lib/academyCorporate'

export const dynamic = 'force-dynamic'

/** Company seat status for the signed-in admin. `{ isAdmin: false }` for a
 *  signed-in learner who administers no company, 401 if not signed in. */
export async function GET(req: NextRequest) {
  const learner = await getSessionLearner(req)
  if (!learner) return NextResponse.json({ authenticated: false }, { status: 401 })

  try {
    const status = await getCompanyStatus(learner.email)
    return NextResponse.json({ authenticated: true, isAdmin: true, ...status })
  } catch (e) {
    if (e instanceof AcademyOrgError) {
      return NextResponse.json({ authenticated: true, isAdmin: false })
    }
    console.error('Academy corporate status error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
