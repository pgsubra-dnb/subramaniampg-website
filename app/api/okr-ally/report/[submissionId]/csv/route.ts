import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getSubmissionById, getReviewForSubmission } from '@/lib/okrAllySubmission'
import { buildKrCsv, csvFilename } from '@/lib/okrAllyCsv'
import { toBrand } from '@/lib/okrAllyBrand'
import type { SuggestedOkrOption } from '@/lib/okrAllyReview'

export const dynamic = 'force-dynamic'

/**
 * Download the metric/from/to/period CSV for one suggested option
 * (?option=refined|fresh) of a review. Same auth/ownership shape as the PDF
 * route at ../route.ts — the rows are the source of truth, read verbatim
 * from the stored review, never regenerated.
 */
export async function GET(req: NextRequest, { params }: { params: { submissionId: string } }) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const submission = await getSubmissionById(params.submissionId)
  if (!submission || submission.user_id !== user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const stored = await getReviewForSubmission(submission.id)
  if (!stored) {
    return NextResponse.json({ error: 'Review not ready' }, { status: 404 })
  }

  const optionParam = req.nextUrl.searchParams.get('option')
  const label: SuggestedOkrOption['label'] | null =
    optionParam === 'refined' ? 'Refined Original' : optionParam === 'fresh' ? 'Fresh Rewrite' : null
  if (!label) {
    return NextResponse.json({ error: 'option must be "refined" or "fresh"' }, { status: 400 })
  }
  const option = stored.review.suggested_okr_options.find((o) => o.label === label)
  if (!option) {
    return NextResponse.json({ error: 'Option not found on this review' }, { status: 404 })
  }

  const brand = toBrand(submission.brand)
  const csv = buildKrCsv(option, brand)

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${csvFilename(submission.id, brand, label)}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
