import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getSiteSettings } from '@/lib/okrAlly'
import { getPdfBytes } from '@/lib/okrAllyBlob'
import { renderReportPdf, reportDateText } from '@/lib/okrAllyReport'
import { getSubmissionById, getReviewForSubmission, getReviewDelivery } from '@/lib/okrAllySubmission'
import type { SubmittedKR, ReviewContextSnapshot } from '@/lib/okrAllyReview'

export const dynamic = 'force-dynamic'

/**
 * Download the review report PDF (report screen / History tab). Serves the
 * stored Blob when present, otherwise regenerates from the submission + review
 * rows — the rows are the source of truth (design doc "Verbatim reproduction").
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

  // pdf_url is a private Blob reference — used here only to fetch bytes, never
  // returned to the client. Falls through to regeneration if the blob is
  // missing or Blob is unconfigured.
  const delivery = await getReviewDelivery(submission.id)
  let bytes: Buffer | null = delivery?.pdfUrl ? await getPdfBytes(delivery.pdfUrl) : null
  if (!bytes) {
    const settings = await getSiteSettings()
    bytes = await renderReportPdf({
      userName: user.name,
      dateText: reportDateText(new Date(submission.created_at)),
      objective: submission.objective,
      krs: submission.krs as SubmittedKR[],
      contextSnapshot: submission.context_snapshot as ReviewContextSnapshot,
      review: stored.review,
      settings,
    })
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="OKR-Review-${submission.id.slice(0, 8)}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
