import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { saveOutcomeFeedback } from '@/lib/okrAllyHistory'

export const dynamic = 'force-dynamic'

/**
 * Report-screen feedback (design §3/§4). Body: { reviewId, rating (1–5, required),
 * feedbackText? }. Upserts — a user can change their rating.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const reviewId = typeof body.reviewId === 'string' ? body.reviewId : ''
  const rating = Number(body.rating)
  const feedbackText =
    typeof body.feedbackText === 'string' && body.feedbackText.trim()
      ? body.feedbackText.trim().slice(0, 2000)
      : null

  if (!reviewId) return NextResponse.json({ error: 'reviewId is required' }, { status: 400 })

  const result = await saveOutcomeFeedback({ reviewId, userId: user.id, rating, feedbackText })
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.error === 'Review not found' ? 404 : 400 })
  }
  return NextResponse.json({ ok: true })
}
