import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { saveExpertReview } from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'

/** Upsert PGS's expert feedback for one suggested-OKR option. Admin only.
 *  Body: { reviewId, okrOptionLabel, rubricFeedback: {criterion: note},
 *          generalFeedback, expertRating: 1-5 } */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const result = await saveExpertReview(user, {
    reviewId: typeof body.reviewId === 'string' ? body.reviewId : '',
    okrOptionLabel: typeof body.okrOptionLabel === 'string' ? body.okrOptionLabel : '',
    rubricFeedback: body.rubricFeedback && typeof body.rubricFeedback === 'object' ? body.rubricFeedback : {},
    generalFeedback: typeof body.generalFeedback === 'string' ? body.generalFeedback : null,
    expertRating: Number(body.expertRating),
  })
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true })
}
