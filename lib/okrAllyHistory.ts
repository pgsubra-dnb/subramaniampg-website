import { query } from '@/lib/okrAlly'
import type { ReviewOutput } from '@/lib/okrAllyReview'
import { type Brand, toBrand } from '@/lib/okrAllyBrand'

/**
 * OKR Ally — History tab + per-submission report load + outcome feedback
 * (build sequence step 9).
 */

export interface HistoryItem {
  submissionId: string
  objective: string
  status: 'pending' | 'complete' | 'failed_refunded'
  overallScore: number | null
  createdAt: string
  rated: boolean
}

/** A user's past submissions, newest first. Objective only — the History
 *  search box filters against this text and nothing else. */
export async function getHistory(userId: string): Promise<HistoryItem[]> {
  const res = await query<{
    id: string
    objective: string
    status: HistoryItem['status']
    created_at: string
    overall_score: string | null
    rated: boolean
  }>(
    `SELECT s.id, s.objective, s.status, s.created_at,
            r.overall_score,
            (f.id IS NOT NULL) AS rated
       FROM submissions s
       LEFT JOIN reviews r ON r.submission_id = s.id
       LEFT JOIN outcome_feedback f ON f.review_id = r.id AND f.user_id = s.user_id
      WHERE s.user_id = $1
      ORDER BY s.created_at DESC`,
    [userId]
  )
  return res.rows.map((r) => ({
    submissionId: r.id,
    objective: r.objective,
    status: r.status,
    overallScore: r.overall_score === null ? null : Number(r.overall_score),
    createdAt: r.created_at,
    rated: r.rated,
  }))
}

export interface FullReport {
  submissionId: string
  status: string
  objective: string
  krs: { text: string; initiatives?: string[] }[]
  contextSnapshot: unknown
  createdAt: string
  brand: Brand
  review: (ReviewOutput & { reviewId: string }) | null
  emailed: boolean
  rating: number | null
  feedbackText: string | null
}

/** Full submission + review for the report screen (fresh view or reopened from History). */
export async function getFullReport(userId: string, submissionId: string): Promise<FullReport | null> {
  const s = await query<{
    id: string
    status: string
    objective: string
    krs: { text: string; initiatives?: string[] }[]
    context_snapshot: unknown
    created_at: string
    brand: string | null
  }>(`SELECT id, status, objective, krs, context_snapshot, created_at, brand FROM submissions WHERE id = $1 AND user_id = $2`, [
    submissionId,
    userId,
  ])
  if (!s.rows[0]) return null
  const sub = s.rows[0]

  const r = await query<{
    id: string
    criteria_scores: unknown
    overall_score: string
    objective_feedback: unknown
    key_result_feedback: unknown
    suggested_okr_options: unknown
    email_sent_at: string | null
  }>(`SELECT id, criteria_scores, overall_score, objective_feedback, key_result_feedback, suggested_okr_options, email_sent_at FROM reviews WHERE submission_id = $1`, [
    submissionId,
  ])

  let review: FullReport['review'] = null
  let emailed = false
  if (r.rows[0]) {
    const rr = r.rows[0]
    emailed = rr.email_sent_at !== null
    review = {
      reviewId: rr.id,
      criteria_scores: rr.criteria_scores as ReviewOutput['criteria_scores'],
      overall_score: Number(rr.overall_score),
      objective_feedback: rr.objective_feedback as ReviewOutput['objective_feedback'],
      key_result_feedback: rr.key_result_feedback as ReviewOutput['key_result_feedback'],
      suggested_okr_options: rr.suggested_okr_options as ReviewOutput['suggested_okr_options'],
    }
  }

  let rating: number | null = null
  let feedbackText: string | null = null
  if (review) {
    const f = await query<{ rating: number; feedback_text: string | null }>(
      `SELECT rating, feedback_text FROM outcome_feedback WHERE review_id = $1 AND user_id = $2`,
      [review.reviewId, userId]
    )
    if (f.rows[0]) {
      rating = f.rows[0].rating
      feedbackText = f.rows[0].feedback_text
    }
  }

  return {
    submissionId: sub.id,
    status: sub.status,
    objective: sub.objective,
    krs: sub.krs,
    contextSnapshot: sub.context_snapshot,
    createdAt: sub.created_at,
    brand: toBrand(sub.brand),
    review,
    emailed,
    rating,
    feedbackText,
  }
}

// ─── Account activity (History tab → Purchases + Invoices sections) ──────

export interface PurchaseItem {
  /** Credits bought — `credit_transactions.amount` is the credit count for purchase rows. */
  credits: number
  date: string
  razorpayPaymentId: string | null
}

export interface InvoiceItem {
  id: string
  invoiceNumber: string
  total: number
  placeOfSupply: string
  date: string
}

/**
 * A user's money history for the dashboard: pack purchases and their GST
 * invoices. Per-review credit usage / refunds are deliberately not surfaced
 * here — the credit counter and the Reviews list already cover that.
 */
export async function getAccountActivity(
  userId: string
): Promise<{ purchases: PurchaseItem[]; invoices: InvoiceItem[] }> {
  const p = await query<{ amount: string; created_at: string; razorpay_payment_id: string | null }>(
    `SELECT amount, created_at, razorpay_payment_id
       FROM credit_transactions
      WHERE user_id = $1 AND type = 'purchase'
      ORDER BY created_at DESC`,
    [userId]
  )
  const inv = await query<{
    id: string
    invoice_number: string
    total_amount: string
    place_of_supply: string
    created_at: string
  }>(
    `SELECT id, invoice_number, total_amount, place_of_supply, created_at
       FROM invoices
      WHERE user_id = $1
      ORDER BY created_at DESC`,
    [userId]
  )
  return {
    purchases: p.rows.map((r) => ({
      credits: Number(r.amount),
      date: r.created_at,
      razorpayPaymentId: r.razorpay_payment_id,
    })),
    invoices: inv.rows.map((r) => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      total: Number(r.total_amount),
      placeOfSupply: r.place_of_supply,
      date: r.created_at,
    })),
  }
}

/** Upsert the user's rating (required) + optional feedback text for a review. */
export async function saveOutcomeFeedback(args: {
  reviewId: string
  userId: string
  rating: number
  feedbackText: string | null
}): Promise<{ ok: boolean; error?: string }> {
  if (!Number.isInteger(args.rating) || args.rating < 1 || args.rating > 5) {
    return { ok: false, error: 'Rating must be 1–5' }
  }
  // ownership: the review must belong to a submission of this user
  const owns = await query(
    `SELECT 1 FROM reviews r JOIN submissions s ON s.id = r.submission_id
      WHERE r.id = $1 AND s.user_id = $2`,
    [args.reviewId, args.userId]
  )
  if (owns.rowCount === 0) return { ok: false, error: 'Review not found' }

  await query(
    `INSERT INTO outcome_feedback (review_id, user_id, rating, feedback_text)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (review_id, user_id)
     DO UPDATE SET rating = EXCLUDED.rating, feedback_text = EXCLUDED.feedback_text`,
    [args.reviewId, args.userId, args.rating, args.feedbackText]
  )
  return { ok: true }
}
