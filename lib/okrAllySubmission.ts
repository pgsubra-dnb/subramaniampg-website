import type { PoolClient } from 'pg'
import { query, withTransaction } from '@/lib/okrAlly'
import type { SubmittedKR, ReviewContextSnapshot } from '@/lib/okrAllyReview'

/**
 * OKR Ally — submission lifecycle + credit ledger for the review route
 * (build sequence step 6). One credit per submission, atomic deduction,
 * auto-refund on a failed generation (design doc section 3).
 */

// Input limits (design doc section 6).
export const LIMITS = {
  objective: 500,
  kr: 250,
  initiative: 250,
  krsMin: 1,
  krsMax: 6,
  initiativesPerKr: 3,
  contextField: 1000,
}

// Rate limit — submissions per user per rolling minute, independent of balance.
export const SUBMISSIONS_PER_MINUTE = 5

export type SubmissionStatus = 'pending' | 'complete' | 'failed_refunded'

export interface SubmissionRow {
  id: string
  user_id: string
  objective: string
  krs: SubmittedKR[]
  context_snapshot: ReviewContextSnapshot
  parent_submission_id: string | null
  idempotency_key: string
  status: SubmissionStatus
  created_at: string
}

export interface ValidatedInput {
  objective: string
  krs: SubmittedKR[]
  contextSnapshot: ReviewContextSnapshot
  parentSubmissionId: string | null
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Shape + length validation of the raw review request body (section 6). */
export function validateInput(body: unknown): { ok: true; value: ValidatedInput } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>

  const objective = typeof b.objective === 'string' ? b.objective.trim() : ''
  if (!objective) return { ok: false, error: 'Objective is required' }
  if (objective.length > LIMITS.objective) {
    return { ok: false, error: `Objective exceeds ${LIMITS.objective} characters` }
  }

  if (!Array.isArray(b.krs) || b.krs.length < LIMITS.krsMin || b.krs.length > LIMITS.krsMax) {
    return { ok: false, error: `Provide between ${LIMITS.krsMin} and ${LIMITS.krsMax} Key Results` }
  }
  const krs: SubmittedKR[] = []
  const krList = b.krs as unknown[]
  for (let i = 0; i < krList.length; i++) {
    const kr = (krList[i] ?? {}) as Record<string, unknown>
    const text = typeof kr.text === 'string' ? kr.text.trim() : ''
    if (!text) return { ok: false, error: `Key Result ${i + 1} is empty` }
    if (text.length > LIMITS.kr) return { ok: false, error: `Key Result ${i + 1} exceeds ${LIMITS.kr} characters` }

    let initiatives: string[] | undefined
    if (kr.initiatives != null) {
      if (!Array.isArray(kr.initiatives) || kr.initiatives.length > LIMITS.initiativesPerKr) {
        return { ok: false, error: `Key Result ${i + 1} has too many initiatives (max ${LIMITS.initiativesPerKr})` }
      }
      initiatives = []
      for (const it of kr.initiatives as unknown[]) {
        const t = typeof it === 'string' ? it.trim() : ''
        if (!t) continue
        if (t.length > LIMITS.initiative) {
          return { ok: false, error: `An initiative on Key Result ${i + 1} exceeds ${LIMITS.initiative} characters` }
        }
        initiatives.push(t)
      }
      if (initiatives.length === 0) initiatives = undefined
    }
    krs.push(initiatives ? { text, initiatives } : { text })
  }

  const ctxRaw = (b.context_snapshot ?? {}) as Record<string, unknown>
  if (typeof ctxRaw !== 'object') return { ok: false, error: 'context_snapshot must be an object' }
  for (const key of ['company_context', 'business_context', 'role_context'] as const) {
    const f = ctxRaw[key] as Record<string, unknown> | undefined
    if (f && typeof f.final_text === 'string' && f.final_text.length > LIMITS.contextField) {
      return { ok: false, error: `${key.replace('_', ' ')} exceeds ${LIMITS.contextField} characters` }
    }
  }

  let parentSubmissionId: string | null = null
  if (b.parentSubmissionId != null) {
    if (typeof b.parentSubmissionId !== 'string' || !UUID_RE.test(b.parentSubmissionId)) {
      return { ok: false, error: 'parentSubmissionId is not a valid id' }
    }
    parentSubmissionId = b.parentSubmissionId
  }

  return {
    ok: true,
    value: { objective, krs, contextSnapshot: ctxRaw as ReviewContextSnapshot, parentSubmissionId },
  }
}

/** True if the user has hit the per-minute submission cap. */
export async function isRateLimited(userId: string): Promise<boolean> {
  const res = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM submissions
     WHERE user_id = $1 AND created_at > now() - interval '1 minute'`,
    [userId]
  )
  return (res.rows[0]?.n ?? 0) >= SUBMISSIONS_PER_MINUTE
}

export async function getSubmissionByKey(userId: string, key: string): Promise<SubmissionRow | null> {
  const res = await query<SubmissionRow>(
    `SELECT * FROM submissions WHERE user_id = $1 AND idempotency_key = $2`,
    [userId, key]
  )
  return res.rows[0] ?? null
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getSubmissionById(id: string): Promise<SubmissionRow | null> {
  if (!UUID.test(id)) return null
  const res = await query<SubmissionRow>(`SELECT * FROM submissions WHERE id = $1`, [id])
  return res.rows[0] ?? null
}

/** Record the report PDF location + delivery time on the review row (step 7). */
export async function markReviewDelivered(args: {
  reviewId: string
  pdfUrl: string | null
  emailSent: boolean
}): Promise<void> {
  await query(
    `UPDATE reviews
       SET pdf_url = COALESCE($2, pdf_url),
           email_sent_at = CASE WHEN $3 THEN now() ELSE email_sent_at END
     WHERE id = $1`,
    [args.reviewId, args.pdfUrl, args.emailSent]
  )
}

export type StartResult =
  | { ok: true; submission: SubmissionRow; charge: 'credit' | 'coupon' }
  | { ok: false; status: number; error: string }

interface StartArgs {
  userId: string
  idempotencyKey: string
  input: ValidatedInput
  /** A validated 100%-off coupon code for the free first review, or null. */
  freeCouponCode: string | null
}

/** Thrown inside the startSubmission transaction to force a rollback while carrying the response. */
class RollbackWith extends Error {
  constructor(public result: Extract<StartResult, { ok: false }>) {
    super(result.error)
  }
}

/**
 * Atomically: create the submission (pending) and pay for it — either deduct
 * one credit or record the one-per-user free-review coupon redemption. Rolls
 * back entirely if payment fails, so no submission is created without a charge.
 */
export async function startSubmission(args: StartArgs): Promise<StartResult> {
  const { userId, idempotencyKey, input, freeCouponCode } = args

  try {
    return await withTransaction<StartResult>(async (client: PoolClient) => {
      if (input.parentSubmissionId) {
        const parent = await client.query(
          `SELECT 1 FROM submissions WHERE id = $1 AND user_id = $2`,
          [input.parentSubmissionId, userId]
        )
        if (parent.rowCount === 0) {
          return { ok: false, status: 400, error: 'parentSubmissionId not found' }
        }
      }

      const insert = await client.query<SubmissionRow>(
        `INSERT INTO submissions
           (user_id, objective, krs, context_snapshot, parent_submission_id, idempotency_key, status)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, $6, 'pending')
         ON CONFLICT (idempotency_key) DO NOTHING
         RETURNING *`,
        [
          userId,
          input.objective,
          JSON.stringify(input.krs),
          JSON.stringify(input.contextSnapshot ?? {}),
          input.parentSubmissionId,
          idempotencyKey,
        ]
      )

      if (insert.rowCount === 0) {
        // Duplicate key — the caller handles the existing submission.
        return { ok: false, status: 409, error: 'duplicate idempotency key' }
      }
      const submission = insert.rows[0]

      if (freeCouponCode) {
        const redeem = await client.query(
          `INSERT INTO coupon_redemptions (user_id, coupon_code, applied_to_submission)
           VALUES ($1, $2, $3)
           ON CONFLICT (user_id, coupon_code) DO NOTHING`,
          [userId, freeCouponCode, submission.id]
        )
        if (redeem.rowCount === 0) {
          throw new RollbackWith({ ok: false, status: 400, error: 'You have already used your free review' })
        }
        await client.query(
          `INSERT INTO credit_transactions (user_id, submission_id, amount, type)
           VALUES ($1, $2, 0, 'usage')`,
          [userId, submission.id]
        )
        return { ok: true, submission, charge: 'coupon' }
      }

      const deduct = await client.query<{ credits_remaining: number }>(
        `UPDATE user_credit_balance
           SET credits_remaining = credits_remaining - 1, updated_at = now()
         WHERE user_id = $1 AND credits_remaining > 0
         RETURNING credits_remaining`,
        [userId]
      )
      if (deduct.rowCount === 0) {
        throw new RollbackWith({ ok: false, status: 402, error: 'No credits remaining' })
      }
      await client.query(
        `INSERT INTO credit_transactions (user_id, submission_id, amount, type)
         VALUES ($1, $2, -1, 'usage')`,
        [userId, submission.id]
      )
      return { ok: true, submission, charge: 'credit' }
    })
  } catch (err) {
    if (err instanceof RollbackWith) return err.result
    throw err
  }
}

/** Persist the successful review and mark the submission complete. */
export async function completeSubmission(args: {
  submissionId: string
  review: import('@/lib/okrAllyReview').ReviewOutput
  overallScore: number
  rubricVersion: string
  modelVersion: string
}): Promise<{ reviewId: string }> {
  return withTransaction(async (client) => {
    const r = await client.query<{ id: string }>(
      `INSERT INTO reviews
         (submission_id, criteria_scores, overall_score, objective_feedback,
          key_result_feedback, suggested_okr_options, rubric_version, model_version)
       VALUES ($1, $2::jsonb, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8)
       RETURNING id`,
      [
        args.submissionId,
        JSON.stringify(args.review.criteria_scores),
        args.overallScore,
        JSON.stringify(args.review.objective_feedback),
        JSON.stringify(args.review.key_result_feedback),
        JSON.stringify(args.review.suggested_okr_options),
        args.rubricVersion,
        args.modelVersion,
      ]
    )
    await client.query(`UPDATE submissions SET status = 'complete' WHERE id = $1`, [args.submissionId])
    return { reviewId: r.rows[0].id }
  })
}

/**
 * A generation failed (Claude error or schema invalid). Refund the charge and
 * mark the submission failed_refunded. No silent retry (design doc section 3).
 */
export async function refundFailedSubmission(args: {
  submissionId: string
  userId: string
  charge: 'credit' | 'coupon'
}): Promise<void> {
  await withTransaction(async (client) => {
    if (args.charge === 'credit') {
      await client.query(
        `INSERT INTO user_credit_balance (user_id, credits_remaining, updated_at)
         VALUES ($1, 1, now())
         ON CONFLICT (user_id)
         DO UPDATE SET credits_remaining = user_credit_balance.credits_remaining + 1, updated_at = now()`,
        [args.userId]
      )
      await client.query(
        `INSERT INTO credit_transactions (user_id, submission_id, amount, type)
         VALUES ($1, $2, 1, 'refund_failed_generation')`,
        [args.userId, args.submissionId]
      )
    } else {
      // Free review — release the coupon so the user can try again.
      await client.query(
        `DELETE FROM coupon_redemptions WHERE user_id = $1 AND applied_to_submission = $2`,
        [args.userId, args.submissionId]
      )
      await client.query(
        `INSERT INTO credit_transactions (user_id, submission_id, amount, type)
         VALUES ($1, $2, 0, 'refund_failed_generation')`,
        [args.userId, args.submissionId]
      )
    }
    await client.query(`UPDATE submissions SET status = 'failed_refunded' WHERE id = $1`, [args.submissionId])
  })
}

interface ReviewRow {
  id: string
  criteria_scores: unknown
  overall_score: string
  objective_feedback: unknown
  key_result_feedback: unknown
  suggested_okr_options: unknown
  rubric_version: string
  model_version: string
  pdf_url: string | null
  email_sent_at: string | null
  created_at: string
}

/**
 * The stored review for a completed submission, shaped like the fresh POST
 * response so idempotent re-requests and the report screen get an identical
 * payload. Deliberately does NOT include the Blob location — that is a private
 * object reference and must never reach the client. Use getReviewDelivery()
 * for the server-internal pdf_url lookup.
 */
export async function getReviewForSubmission(submissionId: string): Promise<{
  reviewId: string
  overallScore: number
  review: import('@/lib/okrAllyReview').ReviewOutput
  rubricVersion: string
  modelVersion: string
} | null> {
  const res = await query<ReviewRow>(`SELECT * FROM reviews WHERE submission_id = $1`, [submissionId])
  const r = res.rows[0]
  if (!r) return null
  return {
    reviewId: r.id,
    overallScore: Number(r.overall_score),
    review: {
      criteria_scores: r.criteria_scores as import('@/lib/okrAllyReview').ReviewOutput['criteria_scores'],
      overall_score: Number(r.overall_score),
      objective_feedback: r.objective_feedback as import('@/lib/okrAllyReview').ReviewOutput['objective_feedback'],
      key_result_feedback: r.key_result_feedback as import('@/lib/okrAllyReview').ReviewOutput['key_result_feedback'],
      suggested_okr_options: r.suggested_okr_options as import('@/lib/okrAllyReview').ReviewOutput['suggested_okr_options'],
    },
    rubricVersion: r.rubric_version,
    modelVersion: r.model_version,
  }
}

/**
 * Server-internal: the review's stored PDF location + delivery timestamp.
 * Used only by the report download route to fetch bytes from private Blob —
 * never serialize this into a response.
 */
export async function getReviewDelivery(
  submissionId: string
): Promise<{ pdfUrl: string | null; emailSentAt: string | null } | null> {
  const res = await query<{ pdf_url: string | null; email_sent_at: string | null }>(
    `SELECT pdf_url, email_sent_at FROM reviews WHERE submission_id = $1`,
    [submissionId]
  )
  const r = res.rows[0]
  return r ? { pdfUrl: r.pdf_url, emailSentAt: r.email_sent_at } : null
}
