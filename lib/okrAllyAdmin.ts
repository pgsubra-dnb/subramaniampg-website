import type { OkrAllyUser } from '@/lib/okrAlly'
import { query } from '@/lib/okrAlly'
import { RUBRIC, REVIEW_MODEL, ANTHROPIC_VERSION } from '@/lib/okrAllyReview'
import type {
  ReviewOutput,
  ReviewContextSnapshot,
  SubmittedKR,
  SuggestedOkrOption,
} from '@/lib/okrAllyReview'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

/**
 * OKR Ally — admin (expert) review screen (design doc §4 / §9 / §12).
 *
 * PGS, on his own `is_admin` Neon row, opens a completed review, records
 * structured expert feedback on BOTH suggested OKR options (one note per rubric
 * criterion + a general note + a 1-5 rating, stored in `expert_reviews`), then
 * has Claude turn those notes into a polished client-facing note in his voice
 * (`improvement_emails`) which he edits and sends deliberately.
 *
 * Every function here takes the already-resolved session user and refuses if
 * `is_admin` is not set — the API routes are the first gate, this is the second.
 */

export const OKR_OPTION_LABELS = ['Refined Original', 'Fresh Rewrite'] as const
export type OkrOptionLabel = (typeof OKR_OPTION_LABELS)[number]

const RUBRIC_CRITERIA = RUBRIC.map((r) => r.criterion)
const NOTE_MAX = 1500

class NotAdminError extends Error {
  constructor() {
    super('Not an admin')
  }
}
function requireAdmin(user: OkrAllyUser): void {
  if (!user.is_admin) throw new NotAdminError()
}
export function isNotAdminError(e: unknown): e is NotAdminError {
  return e instanceof NotAdminError
}

// ─── List (Admin tab) ───────────────────────────────────────────────────

export interface AdminReviewListItem {
  submissionId: string
  reviewId: string
  objective: string
  userName: string
  userEmail: string
  overallScore: number
  createdAt: string
  /** How many of the two option feedback panels PGS has saved (0, 1 or 2). */
  expertReviewCount: number
  emailStatus: 'none' | 'draft' | 'sent'
}

export async function listAdminReviews(user: OkrAllyUser): Promise<AdminReviewListItem[]> {
  requireAdmin(user)
  const res = await query<{
    submission_id: string
    review_id: string
    objective: string
    user_name: string
    user_email: string
    overall_score: string
    created_at: string
    expert_count: string
    email_status: 'none' | 'draft' | 'sent'
  }>(
    `SELECT s.id                         AS submission_id,
            r.id                         AS review_id,
            s.objective,
            u.name                       AS user_name,
            u.email                      AS user_email,
            r.overall_score,
            r.created_at,
            (SELECT count(*) FROM expert_reviews er WHERE er.review_id = r.id) AS expert_count,
            CASE
              WHEN ie.sent_at IS NOT NULL THEN 'sent'
              WHEN ie.id IS NOT NULL       THEN 'draft'
              ELSE 'none'
            END                          AS email_status
       FROM reviews r
       JOIN submissions s ON s.id = r.submission_id
       JOIN users u       ON u.id = s.user_id
       LEFT JOIN improvement_emails ie ON ie.review_id = r.id
      WHERE s.status = 'complete'
      ORDER BY r.created_at DESC`
  )
  return res.rows.map((row) => ({
    submissionId: row.submission_id,
    reviewId: row.review_id,
    objective: row.objective,
    userName: row.user_name,
    userEmail: row.user_email,
    overallScore: Number(row.overall_score),
    createdAt: row.created_at,
    expertReviewCount: Number(row.expert_count),
    emailStatus: row.email_status,
  }))
}

// ─── Full review (Admin review screen) ──────────────────────────────────

export interface ExpertReviewRow {
  okrOptionLabel: OkrOptionLabel
  rubricFeedback: Record<string, string>
  generalFeedback: string | null
  expertRating: number
}

export interface ImprovementEmailRow {
  draftText: string
  finalText: string | null
  sentAt: string | null
}

export interface AdminReviewData {
  submissionId: string
  reviewId: string
  userName: string
  userEmail: string
  createdAt: string
  objective: string
  krs: SubmittedKR[]
  contextSnapshot: ReviewContextSnapshot
  review: {
    criteriaScores: ReviewOutput['criteria_scores']
    overallScore: number
    objectiveFeedback: ReviewOutput['objective_feedback']
    keyResultFeedback: ReviewOutput['key_result_feedback']
    suggestedOkrOptions: SuggestedOkrOption[]
  }
  expertReviews: ExpertReviewRow[]
  email: ImprovementEmailRow | null
  rubricCriteria: string[]
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function getAdminReview(
  user: OkrAllyUser,
  submissionId: string
): Promise<AdminReviewData | null> {
  requireAdmin(user)
  if (!UUID_RE.test(submissionId)) return null

  const s = await query<{
    id: string
    objective: string
    krs: SubmittedKR[]
    context_snapshot: ReviewContextSnapshot
    status: string
    user_name: string
    user_email: string
  }>(
    `SELECT s.id, s.objective, s.krs, s.context_snapshot, s.status,
            u.name AS user_name, u.email AS user_email
       FROM submissions s JOIN users u ON u.id = s.user_id
      WHERE s.id = $1`,
    [submissionId]
  )
  const sub = s.rows[0]
  if (!sub || sub.status !== 'complete') return null

  const r = await query<{
    id: string
    criteria_scores: ReviewOutput['criteria_scores']
    overall_score: string
    objective_feedback: ReviewOutput['objective_feedback']
    key_result_feedback: ReviewOutput['key_result_feedback']
    suggested_okr_options: SuggestedOkrOption[]
    created_at: string
  }>(
    `SELECT id, criteria_scores, overall_score, objective_feedback,
            key_result_feedback, suggested_okr_options, created_at
       FROM reviews WHERE submission_id = $1`,
    [submissionId]
  )
  const rev = r.rows[0]
  if (!rev) return null

  const er = await query<{
    okr_option_label: OkrOptionLabel
    rubric_feedback: Record<string, string>
    general_feedback: string | null
    expert_rating: number
  }>(
    `SELECT okr_option_label, rubric_feedback, general_feedback, expert_rating
       FROM expert_reviews WHERE review_id = $1`,
    [rev.id]
  )

  const ie = await query<{ draft_text: string; final_text: string | null; sent_at: string | null }>(
    `SELECT draft_text, final_text, sent_at FROM improvement_emails WHERE review_id = $1`,
    [rev.id]
  )

  return {
    submissionId: sub.id,
    reviewId: rev.id,
    userName: sub.user_name,
    userEmail: sub.user_email,
    createdAt: rev.created_at,
    objective: sub.objective,
    krs: sub.krs,
    contextSnapshot: sub.context_snapshot,
    review: {
      criteriaScores: rev.criteria_scores,
      overallScore: Number(rev.overall_score),
      objectiveFeedback: rev.objective_feedback,
      keyResultFeedback: rev.key_result_feedback,
      suggestedOkrOptions: rev.suggested_okr_options,
    },
    expertReviews: er.rows.map((row) => ({
      okrOptionLabel: row.okr_option_label,
      rubricFeedback: row.rubric_feedback ?? {},
      generalFeedback: row.general_feedback,
      expertRating: row.expert_rating,
    })),
    email: ie.rows[0]
      ? { draftText: ie.rows[0].draft_text, finalText: ie.rows[0].final_text, sentAt: ie.rows[0].sent_at }
      : null,
    rubricCriteria: RUBRIC_CRITERIA,
  }
}

// ─── Save one option's expert feedback ─────────────────────────────────

export interface SaveExpertReviewInput {
  reviewId: string
  okrOptionLabel: string
  rubricFeedback: Record<string, string>
  generalFeedback: string | null
  expertRating: number
}

export async function saveExpertReview(
  user: OkrAllyUser,
  input: SaveExpertReviewInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  requireAdmin(user)

  if (!UUID_RE.test(input.reviewId)) return { ok: false, error: 'Bad reviewId' }
  if (!OKR_OPTION_LABELS.includes(input.okrOptionLabel as OkrOptionLabel)) {
    return { ok: false, error: 'Unknown option label' }
  }
  if (!Number.isInteger(input.expertRating) || input.expertRating < 1 || input.expertRating > 5) {
    return { ok: false, error: 'Rating must be 1-5' }
  }
  const rubric: Record<string, string> = {}
  for (const [k, v] of Object.entries(input.rubricFeedback ?? {})) {
    if (!RUBRIC_CRITERIA.includes(k)) return { ok: false, error: `Unknown criterion: ${k}` }
    const note = typeof v === 'string' ? v.trim() : ''
    if (note.length > NOTE_MAX) return { ok: false, error: `Note for ${k} is too long` }
    if (note) rubric[k] = note
  }
  const general =
    typeof input.generalFeedback === 'string' && input.generalFeedback.trim()
      ? input.generalFeedback.trim().slice(0, NOTE_MAX * 3)
      : null

  const owns = await query(`SELECT 1 FROM reviews WHERE id = $1`, [input.reviewId])
  if (owns.rowCount === 0) return { ok: false, error: 'Review not found' }

  await query(
    `INSERT INTO expert_reviews (review_id, okr_option_label, rubric_feedback, general_feedback, expert_rating)
     VALUES ($1, $2, $3::jsonb, $4, $5)
     ON CONFLICT (review_id, okr_option_label)
     DO UPDATE SET rubric_feedback = EXCLUDED.rubric_feedback,
                   general_feedback = EXCLUDED.general_feedback,
                   expert_rating = EXCLUDED.expert_rating`,
    [input.reviewId, input.okrOptionLabel, JSON.stringify(rubric), general, input.expertRating]
  )
  return { ok: true }
}

// ─── Draft the improvement email (Claude) ──────────────────────────────

function ctxText(f: ReviewContextSnapshot[keyof ReviewContextSnapshot] | undefined): string {
  return (f?.final_text || f?.raw_input || '').trim() || '(not provided)'
}

function buildEmailUserContent(data: AdminReviewData): string {
  const ctx = data.contextSnapshot || {}
  const krLines = data.krs
    .map((kr, i) => {
      const head = `KR${i + 1}: ${kr.text}`
      return kr.initiatives?.length
        ? head + '\n' + kr.initiatives.map((x) => `  - ${x}`).join('\n')
        : head
    })
    .join('\n')

  const optionBlock = (label: OkrOptionLabel) => {
    const opt = data.review.suggestedOkrOptions.find((o) => o.label === label)
    const notes = data.expertReviews.find((e) => e.okrOptionLabel === label)
    const optText = opt
      ? [
          `Objective: ${opt.objective}`,
          ...opt.key_results.map(
            (kr, i) =>
              `  KR${i + 1}: ${kr.text}` +
              (kr.initiatives?.length ? ` [initiatives: ${kr.initiatives.map((x) => x.action).join('; ')}]` : '')
          ),
        ].join('\n')
      : '(option missing)'
    const noteText = notes
      ? [
          ...Object.entries(notes.rubricFeedback).map(([c, n]) => `  ${c}: ${n}`),
          notes.generalFeedback ? `  General: ${notes.generalFeedback}` : '',
        ]
          .filter(Boolean)
          .join('\n') || '  (no notes)'
      : '  (no notes)'
    return `--- ${label} ---\n${optText}\n\nPGS's notes on this option:\n${noteText}`
  }

  return `THE USER'S ORIGINAL OKR (verbatim)
Objective: ${data.objective}
${krLines}

CONTEXT THE USER PROVIDED (verbatim)
Company: ${ctxText(ctx.company_context)}
Business: ${ctxText(ctx.business_context)}
Role: ${ctxText(ctx.role_context)}

${optionBlock('Refined Original')}

${optionBlock('Fresh Rewrite')}

Write the note now. Call submit_improvement_note.`
}

const EMAIL_SYSTEM = `You are Subramaniam P G (PGS), an OKR coach and executive coach with 40+ years working with leadership teams. A user of your tool "OKR Ally" has received an automated review of an OKR they drafted. You have read their submission and added your own notes on each of the two suggested rewrites. Your job now: turn your notes into a short personal note to that user, in your own voice, that they receive as an email.

Hard rules:
- Write as "I", to "you". This is your personal follow-up, layered ON TOP of the automated review — never a correction of it. Do not say the automated review was wrong, weak, thin, generic, or incomplete. Do not reference it negatively at all.
- Never mention a score, a number out of 10, a rating, stars, or any grading.
- Ground everything in the user's actual OKR, their stated context, and your notes. Introduce no new facts, benchmarks, company knowledge, or assumptions. If your notes don't support a point, don't make it.
- Warm, plain, direct — an ally sitting beside them, not an auditor. No corporate filler, no flattery padding, no "I hope this finds you well".
- 150-250 words. Body only: no subject line, no "Dear ...", no sign-off or signature (those are added separately).
- Pull out the 2-3 most useful things from your notes. It's fine to point them toward one of the two rewrites if your notes clearly favour it, but frame it as your read, not a verdict.

Call submit_improvement_note exactly once with the note text.`

const EMAIL_TOOL = {
  name: 'submit_improvement_note',
  description: 'Submit the personal improvement note to the user.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['note'],
    properties: {
      note: { type: 'string', description: 'The note body, 150-250 words, first person, no subject/greeting/signature.' },
    },
  },
} as const

const EMAIL_TIMEOUT_MS = 45_000

export async function generateImprovementEmail(
  user: OkrAllyUser,
  reviewId: string
): Promise<{ ok: true; draft: string } | { ok: false; error: string }> {
  requireAdmin(user)
  if (!UUID_RE.test(reviewId)) return { ok: false, error: 'Bad reviewId' }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, error: 'ANTHROPIC_API_KEY not configured' }

  const subRow = await query<{ submission_id: string }>(
    `SELECT submission_id FROM reviews WHERE id = $1`,
    [reviewId]
  )
  if (subRow.rowCount === 0) return { ok: false, error: 'Review not found' }
  const data = await getAdminReview(user, subRow.rows[0].submission_id)
  if (!data) return { ok: false, error: 'Review not found' }
  if (data.expertReviews.length < 2) {
    return { ok: false, error: 'Add your feedback on both options first.' }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), EMAIL_TIMEOUT_MS)
  let res: Response
  try {
    res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: REVIEW_MODEL,
        max_tokens: 1200,
        output_config: { effort: 'low' },
        system: EMAIL_SYSTEM,
        tools: [EMAIL_TOOL],
        tool_choice: { type: 'tool', name: EMAIL_TOOL.name },
        messages: [{ role: 'user', content: buildEmailUserContent(data) }],
      }),
    })
  } catch (err) {
    clearTimeout(timer)
    const name = (err as { name?: string } | null)?.name
    return { ok: false, error: name === 'AbortError' ? 'Timed out generating the note.' : 'Network error.' }
  }
  clearTimeout(timer)

  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.error('OKR Ally improvement email: anthropic', res.status, body.slice(0, 300))
    return { ok: false, error: `Anthropic ${res.status}` }
  }
  const payload = (await res.json()) as {
    content?: { type: string; name?: string; input?: unknown }[]
  }
  const block = payload.content?.find((b) => b.type === 'tool_use' && b.name === EMAIL_TOOL.name)
  const note =
    block && typeof (block.input as { note?: unknown })?.note === 'string'
      ? ((block.input as { note: string }).note).trim()
      : ''
  if (!note) return { ok: false, error: 'No note in the response.' }

  await query(
    `INSERT INTO improvement_emails (review_id, draft_text)
     VALUES ($1, $2)
     ON CONFLICT (review_id)
     DO UPDATE SET draft_text = EXCLUDED.draft_text, final_text = NULL, sent_at = NULL`,
    [reviewId, note]
  )
  return { ok: true, draft: note }
}

export async function saveImprovementEmailEdit(
  user: OkrAllyUser,
  reviewId: string,
  finalText: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  requireAdmin(user)
  if (!UUID_RE.test(reviewId)) return { ok: false, error: 'Bad reviewId' }
  const text = (finalText || '').trim()
  if (!text) return { ok: false, error: 'Nothing to save' }
  if (text.length > 6000) return { ok: false, error: 'Too long' }
  const r = await query(
    `UPDATE improvement_emails SET final_text = $2 WHERE review_id = $1 AND sent_at IS NULL`,
    [reviewId, text]
  )
  if (r.rowCount === 0) return { ok: false, error: 'No unsent draft to update' }
  return { ok: true }
}

export async function sendImprovementEmail(
  user: OkrAllyUser,
  reviewId: string
): Promise<{ sent: boolean; error?: string; sentAt?: string }> {
  requireAdmin(user)
  if (!UUID_RE.test(reviewId)) return { sent: false, error: 'Bad reviewId' }

  const row = await query<{
    draft_text: string
    final_text: string | null
    sent_at: string | null
    user_email: string
    user_name: string
  }>(
    `SELECT ie.draft_text, ie.final_text, ie.sent_at, u.email AS user_email, u.name AS user_name
       FROM improvement_emails ie
       JOIN reviews r     ON r.id = ie.review_id
       JOIN submissions s ON s.id = r.submission_id
       JOIN users u       ON u.id = s.user_id
      WHERE ie.review_id = $1`,
    [reviewId]
  )
  const rec = row.rows[0]
  if (!rec) return { sent: false, error: 'No draft to send' }
  if (rec.sent_at) return { sent: true, sentAt: rec.sent_at }

  const bodyText = (rec.final_text ?? rec.draft_text).trim()
  if (!bodyText) return { sent: false, error: 'The note is empty' }

  const html = `<div style="font-family:Georgia,'Times New Roman',serif;color:#2C2C2A;line-height:1.7;font-size:15px;">
${bodyText
  .split(/\n{2,}/)
  .map((p) => `<p>${p.replace(/\n/g, '<br/>').replace(/</g, '&lt;')}</p>`)
  .join('\n')}
<p style="margin-top:24px;">— Subramaniam P G</p>
</div>`

  const ok = await sendBrevoEmail({
    to: rec.user_email,
    toName: rec.user_name,
    subject: 'A note on your OKR — Subramaniam P G',
    htmlContent: html,
    textContent: `${bodyText}\n\n— Subramaniam P G`,
  })

  if (!ok) {
    return { sent: false, error: 'Email delivery failed — nothing was sent. Try again.' }
  }

  const upd = await query<{ sent_at: string }>(
    `UPDATE improvement_emails SET sent_at = now() WHERE review_id = $1 RETURNING sent_at`,
    [reviewId]
  )
  return { sent: true, sentAt: upd.rows[0]?.sent_at }
}
