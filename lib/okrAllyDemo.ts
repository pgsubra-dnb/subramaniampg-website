import crypto from 'crypto'
import { query, withTransaction, getUserById, type OkrAllyUser } from '@/lib/okrAlly'

/**
 * OKR Ally / Goal Ally — demo mode lifecycle (migration 014).
 *
 * "Start demo" (PGS's is_admin session only) creates a fresh ephemeral account
 * flagged `is_demo` and hands the browser an `okr_ally_demo` cookie bound to it.
 * From then on every OKR Ally route runs as that account: sign-in is already
 * done, reviews are unlimited (the admin-unlimited charge path), and every
 * record is flagged `is_demo`.
 *
 * "Reset demo" mints a brand-new demo account (total isolation between runs) and
 * best-effort deletes the previous one. Old demo accounts + their data are also
 * swept by `purgeExpiredDemoData`, called opportunistically from the start/reset
 * endpoints.
 *
 * The demo account's email is on an intentionally unroutable domain — a second
 * backstop on top of runInDemoContext() so a stray send can only ever bounce.
 */

export const DEMO_EMAIL_DOMAIN = 'demo.okrally.invalid'
const DEMO_NAME = 'Demo'

/** Create a fresh ephemeral demo account and return it. */
export async function createDemoUser(): Promise<OkrAllyUser> {
  const email = `demo-${crypto.randomBytes(9).toString('hex')}@${DEMO_EMAIL_DOMAIN}`
  const res = await query<{ id: string }>(
    `INSERT INTO users (email, name, is_demo) VALUES ($1, $2, TRUE) RETURNING id`,
    [email, DEMO_NAME]
  )
  const user = await getUserById(res.rows[0].id)
  if (!user) throw new Error('createDemoUser: row vanished immediately after insert')
  return user
}

/**
 * Delete a demo account and everything it created. Mirrors the e2e cleanup
 * order (child rows first — submissions has no ON DELETE CASCADE). Safe to call
 * with a non-demo or unknown id: it no-ops unless the row is actually is_demo.
 */
export async function deleteDemoUser(userId: string): Promise<void> {
  await withTransaction(async (client) => {
    const check = await client.query<{ is_demo: boolean }>(
      `SELECT is_demo FROM users WHERE id = $1`,
      [userId]
    )
    if (!check.rows[0]?.is_demo) return

    await client.query(`DELETE FROM outcome_feedback WHERE user_id = $1`, [userId])
    await client.query(
      `DELETE FROM reviews WHERE submission_id IN (SELECT id FROM submissions WHERE user_id = $1)`,
      [userId]
    )
    await client.query(`DELETE FROM credit_transactions WHERE user_id = $1`, [userId])
    await client.query(`DELETE FROM coupon_redemptions WHERE user_id = $1`, [userId])
    await client.query(`DELETE FROM submissions WHERE user_id = $1`, [userId])
    await client.query(`DELETE FROM okr_ally_daily_usage WHERE user_id = $1`, [userId])
    await client.query(`DELETE FROM user_credit_balance WHERE user_id = $1`, [userId])
    await client.query(`DELETE FROM user_profile WHERE user_id = $1`, [userId])
    await client.query(`DELETE FROM drafts WHERE user_id = $1`, [userId])
    await client.query(`DELETE FROM users WHERE id = $1`, [userId])
  })
}

/**
 * Housekeeping: drop demo accounts (and their data) older than `hours`.
 * Best-effort — call it fire-and-forget; a failure here must never block a
 * start/reset.
 */
export async function purgeExpiredDemoData(hours = 24): Promise<number> {
  const stale = await query<{ id: string }>(
    `SELECT id FROM users WHERE is_demo AND created_at < now() - ($1 || ' hours')::interval`,
    [String(hours)]
  )
  for (const row of stale.rows) {
    try {
      await deleteDemoUser(row.id)
    } catch (err) {
      console.error('purgeExpiredDemoData: could not delete', row.id, err)
    }
  }
  return stale.rowCount ?? 0
}
