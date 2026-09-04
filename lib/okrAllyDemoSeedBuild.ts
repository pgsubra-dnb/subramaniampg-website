import { query, withTransaction } from '@/lib/okrAlly'
import { type Brand } from '@/lib/okrAllyBrand'
import { runReview } from '@/lib/okrAllyReview'
import { seedAccountId } from '@/lib/okrAllyDemo'
import { SEED_KEY_PREFIX, SEED_REAL_SOURCE_EMAIL, SEED_DRAFTS } from '@/lib/okrAllyDemoSeeds'

/**
 * Seed-library build step. Kept in its own module because it pulls in the live
 * review engine (runReview) — that must stay out of lib/okrAllyDemo.ts, which is
 * imported by app/api/okr-ally/me. Only the admin-only _seedlib route calls this.
 *
 * `only` = 'real' clones PGS's single real submission+review verbatim (his row is
 * only read, never written); 'S1'..'S4' run the synthetic draft through the REAL
 * review engine and store the genuine result.
 */
export async function buildSeedEntry(
  only: string,
  force = false
): Promise<
  | { ok: true; key: string; score: number; source: 'real-clone' | 'live-review' }
  | { ok: false; error: string }
> {
  const accountId = await seedAccountId()
  const key = `${SEED_KEY_PREFIX}${only}`

  const dup = await query<{ id: string }>(
    `SELECT id FROM submissions WHERE user_id = $1 AND idempotency_key = $2`,
    [accountId, key]
  )
  if (dup.rows[0] && !force) return { ok: false, error: `${only} already built (pass force to rebuild)` }
  if (dup.rows[0]) {
    await withTransaction(async (c) => {
      await c.query(`DELETE FROM reviews WHERE submission_id = $1`, [dup.rows[0].id])
      await c.query(`DELETE FROM submissions WHERE id = $1`, [dup.rows[0].id])
    })
  }

  if (only === 'real') {
    const src = await query<{
      id: string
      objective: string
      krs: unknown
      context_snapshot: unknown
      brand: Brand | null
      criteria_scores: unknown
      overall_score: string
      objective_feedback: unknown
      key_result_feedback: unknown
      suggested_okr_options: unknown
      rubric_version: string
      model_version: string
    }>(
      `SELECT s.id, s.objective, s.krs, s.context_snapshot, s.brand,
              r.criteria_scores, r.overall_score, r.objective_feedback,
              r.key_result_feedback, r.suggested_okr_options, r.rubric_version, r.model_version
         FROM submissions s
         JOIN reviews r ON r.submission_id = s.id
         JOIN users u   ON u.id = s.user_id
        WHERE u.email = $1 AND s.status = 'complete'
        ORDER BY s.created_at
        LIMIT 1`,
      [SEED_REAL_SOURCE_EMAIL]
    )
    const row = src.rows[0]
    if (!row) return { ok: false, error: `no real completed submission on ${SEED_REAL_SOURCE_EMAIL}` }

    await withTransaction(async (c) => {
      const ins = await c.query<{ id: string }>(
        `INSERT INTO submissions (user_id, objective, krs, context_snapshot, idempotency_key, status, brand, is_demo)
         VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, 'complete', $6, TRUE) RETURNING id`,
        [accountId, row.objective, JSON.stringify(row.krs), JSON.stringify(row.context_snapshot), key, row.brand ?? 'okr_ally']
      )
      await c.query(
        `INSERT INTO reviews (submission_id, criteria_scores, overall_score, objective_feedback,
                              key_result_feedback, suggested_okr_options, rubric_version, model_version)
         VALUES ($1, $2::jsonb, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8)`,
        [
          ins.rows[0].id,
          JSON.stringify(row.criteria_scores),
          row.overall_score,
          JSON.stringify(row.objective_feedback),
          JSON.stringify(row.key_result_feedback),
          JSON.stringify(row.suggested_okr_options),
          row.rubric_version,
          row.model_version,
        ]
      )
    })
    return { ok: true, key: 'real', score: Number(row.overall_score), source: 'real-clone' }
  }

  const draft = SEED_DRAFTS.find((d) => d.key === only)
  if (!draft) return { ok: false, error: `unknown seed draft "${only}"` }

  const result = await runReview(
    { objective: draft.objective, krs: draft.krs, contextSnapshot: draft.contextSnapshot },
    draft.brand
  )
  if (!result.ok) return { ok: false, error: `live review failed: ${result.reason}` }

  await withTransaction(async (c) => {
    const ins = await c.query<{ id: string }>(
      `INSERT INTO submissions (user_id, objective, krs, context_snapshot, idempotency_key, status, brand, is_demo)
       VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, 'complete', $6, TRUE) RETURNING id`,
      [accountId, draft.objective, JSON.stringify(draft.krs), JSON.stringify(draft.contextSnapshot), key, draft.brand]
    )
    await c.query(
      `INSERT INTO reviews (submission_id, criteria_scores, overall_score, objective_feedback,
                            key_result_feedback, suggested_okr_options, rubric_version, model_version)
       VALUES ($1, $2::jsonb, $3, $4::jsonb, $5::jsonb, $6::jsonb, $7, $8)`,
      [
        ins.rows[0].id,
        JSON.stringify(result.review.criteria_scores),
        result.review.overall_score,
        JSON.stringify(result.review.objective_feedback),
        JSON.stringify(result.review.key_result_feedback),
        JSON.stringify(result.review.suggested_okr_options),
        result.rubricVersion,
        result.modelVersion,
      ]
    )
  })
  return { ok: true, key: only, score: result.review.overall_score, source: 'live-review' }
}
