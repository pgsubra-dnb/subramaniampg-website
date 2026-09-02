import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { validateCoupon } from '@/lib/okrAllyBilling'
import { runReview } from '@/lib/okrAllyReview'
import { generateStoreAndEmailReport } from '@/lib/okrAllyReport'
import { createAndSendFreeReviewInvoice } from '@/lib/okrAllyInvoice'
import { assertFulfillmentAllowed, FulfillmentBlockedError } from '@/lib/fulfillmentGuard'
import { getOrgContextForMember } from '@/lib/okrAllyOrg'
import {
  validateInput,
  isRateLimited,
  getSubmissionByKey,
  getReviewForSubmission,
  startSubmission,
  completeSubmission,
  refundFailedSubmission,
} from '@/lib/okrAllySubmission'

export const dynamic = 'force-dynamic'
// 300s is the Vercel Pro ceiling for serverless function duration (this project
// is on Pro — confirmed via the VERCEL_OIDC_TOKEN `plan` claim). runReview caps
// each Claude attempt at 130s (2 attempts = 260s), leaving headroom for the
// surrounding DB work.
export const maxDuration = 300

/**
 * Core review API (build sequence step 6).
 *
 * Body: {
 *   idempotencyKey: string,          // client-generated, one per submission attempt
 *   objective: string,
 *   krs: [{ text, initiatives?: string[] }],
 *   context_snapshot: {...},
 *   parentSubmissionId?: string,
 *   couponCode?: string,             // the one-per-user 100%-off free-review coupon
 * }
 *
 * Atomic credit deduction → create submission → one Claude call with structured
 * tool output → schema validation. On any generation failure the credit is
 * auto-refunded and the submission marked failed_refunded (no silent retry).
 * A duplicate idempotencyKey returns the existing result instead of re-charging.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  // A review creates a submission + deducts a credit + (for the free review)
  // mints a ₹0 invoice + stores a PDF. `.env.local` points at prod, so block a
  // non-prod run unless ALLOW_NONPROD_FULFILLMENT=1 is set (Playwright sets it).
  try {
    assertFulfillmentAllowed('okr-ally review')
  } catch (e) {
    if (e instanceof FulfillmentBlockedError) {
      console.error(e.message)
      return NextResponse.json({ error: 'Reviews are disabled in this environment' }, { status: 503 })
    }
    throw e
  }

  const body = await req.json().catch(() => ({}))
  const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.trim() : ''
  if (!idempotencyKey || idempotencyKey.length > 200) {
    return NextResponse.json({ error: 'idempotencyKey is required' }, { status: 400 })
  }

  // Idempotency — return the existing submission's state, never re-charge.
  const existing = await getSubmissionByKey(user.id, idempotencyKey)
  if (existing) {
    return respondForExisting(existing.id, existing.status)
  }

  const parsed = validateInput(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 })
  }

  // Corporate members run on their org's shared company/business context.
  // Block until the admin has published it; then freeze the org's current text
  // into this submission's context_snapshot (a later admin edit never touches
  // it). Role context stays personal — passed through from the client.
  const orgCtx = await getOrgContextForMember(user)
  if (orgCtx) {
    if (orgCtx.contextConfirmedAt === null) {
      return NextResponse.json(
        {
          error:
            `${orgCtx.organizationName}'s shared context hasn't been published yet. ` +
            `Ask your company admin${orgCtx.adminEmail ? ` (${orgCtx.adminEmail})` : ''} to set it up on the Company tab, then you can run a review.`,
          code: 'org_context_unconfirmed',
        },
        { status: 403 }
      )
    }
    const frozen = (t: string) => ({
      raw_input: t,
      clarifying_question: null,
      clarifying_answer: null,
      paraphrase_suggested: null,
      final_text: t,
      paraphrase_action: 'not_offered' as const,
    })
    parsed.value.contextSnapshot = {
      ...parsed.value.contextSnapshot,
      company_context: frozen(orgCtx.companyContext ?? ''),
      business_context: frozen(orgCtx.businessContext ?? ''),
    }
  }

  if (await isRateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Too many submissions in the last minute. Please wait a moment.' },
      { status: 429 }
    )
  }

  // Free first review — only a 100%-off coupon qualifies here; percentage
  // coupons apply to credit-pack purchases, not individual reviews.
  let freeCouponCode: string | null = null
  if (typeof body.couponCode === 'string' && body.couponCode.trim()) {
    const coupon = await validateCoupon(body.couponCode, user.id)
    if (!coupon.valid) {
      return NextResponse.json({ error: coupon.reason || 'Invalid coupon' }, { status: 400 })
    }
    if (coupon.discountPercent !== 100) {
      return NextResponse.json(
        { error: 'That coupon applies to credit packs, not a single review' },
        { status: 400 }
      )
    }
    freeCouponCode = coupon.code ?? null
  }

  const start = await startSubmission({
    userId: user.id,
    idempotencyKey,
    input: parsed.value,
    freeCouponCode,
  })

  if (!start.ok) {
    if (start.status === 409) {
      // Concurrent create with the same key won the race.
      const now = await getSubmissionByKey(user.id, idempotencyKey)
      if (now) return respondForExisting(now.id, now.status)
    }
    return NextResponse.json({ error: start.error }, { status: start.status })
  }

  const { submission, charge } = start
  const organizationId = start.organizationId ?? null

  const result = await runReview(
    {
      objective: parsed.value.objective,
      krs: parsed.value.krs,
      contextSnapshot: parsed.value.contextSnapshot,
    },
    parsed.value.brand
  )

  if (!result.ok) {
    await refundFailedSubmission({ submissionId: submission.id, userId: user.id, charge, organizationId })
    console.error('OKR Ally review failed:', submission.id, result.reason)
    return NextResponse.json(
      {
        status: 'failed_refunded',
        error:
          charge === 'admin'
            ? 'The review could not be generated — please try again.'
            : 'The review could not be generated. Your credit has been refunded — please try again.',
        detail: result.reason,
        refunded: charge,
      },
      { status: 502 }
    )
  }

  let reviewId: string | null = null
  try {
    ;({ reviewId } = await completeSubmission({
      submissionId: submission.id,
      review: result.review,
      overallScore: result.review.overall_score,
      rubricVersion: result.rubricVersion,
      modelVersion: result.modelVersion,
    }))
  } catch (err) {
    // The review generated fine — don't waste the charge or lose the output.
    // Submission stays 'pending' for manual reconciliation.
    console.error('OKR Ally review: completeSubmission failed', submission.id, err)
  }

  // Step 7: render the report PDF, store it to Vercel Blob, email it, and
  // record pdf_url / email_sent_at. Best-effort — the review is already saved;
  // the report screen and GET /api/okr-ally/report/[id] regenerate on demand.
  let delivery: { pdfUrl: string | null; emailed: boolean } = { pdfUrl: null, emailed: false }
  if (reviewId) {
    delivery = await generateStoreAndEmailReport({
      reviewId,
      submissionId: submission.id,
      userName: user.name,
      userEmail: user.email,
      objective: parsed.value.objective,
      krs: parsed.value.krs,
      contextSnapshot: parsed.value.contextSnapshot,
      review: result.review,
      brand: parsed.value.brand,
    })
  }

  // ₹0 GST invoice for a coupon-covered first review. This path never touches
  // create-order / verify-payment / the webhook, so it is issued here — sent to
  // the user's email and (via sendBrevoEmail's default BCC) copied to PGS.
  // Idempotent on the submission id; non-blocking (the review is already saved).
  let invoiceNumber: string | null = null
  if (charge === 'coupon' && reviewId && freeCouponCode) {
    try {
      const inv = await createAndSendFreeReviewInvoice({
        userId: user.id,
        submissionId: submission.id,
        couponCode: freeCouponCode,
        buyerName: user.name,
        buyerEmail: user.email,
        brand: parsed.value.brand,
      })
      if (inv.ok) invoiceNumber = inv.invoice.invoice_number
      else console.error('OKR Ally free-review invoice soft-failed:', submission.id, inv.reason)
    } catch (err) {
      console.error('OKR Ally free-review invoice threw:', submission.id, err)
    }
  }

  return NextResponse.json({
    status: 'complete',
    submissionId: submission.id,
    reviewId,
    overallScore: result.review.overall_score,
    review: result.review,
    pdfStored: !!delivery.pdfUrl,
    emailed: delivery.emailed,
    invoiceNumber,
    ...(reviewId ? {} : { warning: 'result not persisted; support has been notified' }),
  })
}

async function respondForExisting(submissionId: string, status: string) {
  if (status === 'complete') {
    const stored = await getReviewForSubmission(submissionId)
    return NextResponse.json({
      status: 'complete',
      submissionId,
      reviewId: stored?.reviewId ?? null,
      overallScore: stored?.overallScore ?? null,
      review: stored?.review ?? null,
    })
  }
  if (status === 'pending') {
    return NextResponse.json(
      { status: 'pending', submissionId, message: 'This review is already being generated.' },
      { status: 202 }
    )
  }
  return NextResponse.json(
    {
      status: 'failed_refunded',
      submissionId,
      error: 'That attempt failed and was refunded. Start a new submission to try again.',
    },
    { status: 200 }
  )
}
