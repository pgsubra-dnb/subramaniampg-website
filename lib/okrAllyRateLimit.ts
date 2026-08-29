import { query } from '@/lib/okrAlly'

/**
 * Rate limiting for OKR Ally's pre-payment Haiku endpoints (context
 * assess/paraphrase). Two layers:
 *   1. in-memory sliding window — per serverless instance, blunts a tight loop
 *   2. durable per-user daily cap in Postgres — survives instances/cold starts
 */
const buckets = new Map<string, number[]>()

export function allow(key: string, max: number, windowMs: number): boolean {
  const now = Date.now()
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs)
  if (hits.length >= max) {
    buckets.set(key, hits)
    return false
  }
  hits.push(now)
  buckets.set(key, hits)
  // opportunistic cleanup
  if (buckets.size > 5000) {
    buckets.forEach((v, k) => {
      if (v.every((t: number) => now - t >= windowMs)) buckets.delete(k)
    })
  }
  return true
}

/**
 * Durable per-user daily cap for the context Haiku endpoints. Atomically bumps
 * the day's counter and returns whether the call is still under `cap`. A heavy
 * submission with edits is ~15–25 calls, so the default 150/day is ~6–10 full
 * submissions before the user is throttled for the day.
 */
export const CONTEXT_DAILY_CAP =
  Number(process.env.OKR_ALLY_CONTEXT_DAILY_CAP) > 0
    ? Number(process.env.OKR_ALLY_CONTEXT_DAILY_CAP)
    : 150

let pruneCheckedAt = 0

export async function allowDailyContextCall(
  userId: string,
  cap = CONTEXT_DAILY_CAP
): Promise<{ ok: boolean; used: number; cap: number }> {
  const res = await query<{ calls: number }>(
    `INSERT INTO okr_ally_daily_usage (user_id, day, calls)
     VALUES ($1, (now() AT TIME ZONE 'utc')::date, 1)
     ON CONFLICT (user_id, day) DO UPDATE SET calls = okr_ally_daily_usage.calls + 1
     RETURNING calls`,
    [userId]
  )
  const used = res.rows[0]?.calls ?? 1

  // prune rows older than 3 days, at most once an hour per instance
  const now = Date.now()
  if (now - pruneCheckedAt > 3_600_000) {
    pruneCheckedAt = now
    query(
      `DELETE FROM okr_ally_daily_usage WHERE day < (now() AT TIME ZONE 'utc')::date - 3`
    ).catch(() => {})
  }

  return { ok: used <= cap, used, cap }
}
