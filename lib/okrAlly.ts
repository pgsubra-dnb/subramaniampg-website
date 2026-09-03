import { Pool, type QueryResultRow } from 'pg'
import type { NextRequest } from 'next/server'
import { okrAllySanityClient } from '@/lib/okrAllySanity'
import { isAdminSessionToken, verifyAdminSession } from '@/lib/okrAllySession'

/**
 * OKR Ally — Neon data access + session helpers.
 *
 * Same connection pattern as lib/worklifeDb.ts (pg Pool, DATABASE_URL /
 * POSTGRES_URL). The OKR Ally tables live in the same Neon database that is
 * already linked to the Vercel project — see okr-ally-schema-migration.sql.
 *
 * Auth is a 6-digit sign-in code (lib/okrAllySanity.ts — generateSignInCode /
 * storeSignInCode / verifySignInCode, hashed in the isolated `okr-ally` Sanity
 * dataset, 10-minute expiry, 5-attempt cap). There is no magic-link URL. A
 * successful verification resolves to (or creates) a row in the Neon `users`
 * table, and the session cookie holds that Neon user's UUID — not a Sanity
 * document id.
 */

export const OKR_ALLY_SESSION_COOKIE = 'okr_ally_session'

let pool: Pool | undefined

function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL (or POSTGRES_URL) is not set — the OKR Ally Neon database is not configured'
      )
    }
    pool = new Pool({ connectionString })
  }
  return pool
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
) {
  return getPool().query<T>(text, params)
}

/**
 * Run `fn` inside a single BEGIN/COMMIT transaction, rolling back on any throw.
 * Used for the atomic credit-grant + ledger + coupon-redemption write.
 */
export async function withTransaction<T>(
  fn: (client: import('pg').PoolClient) => Promise<T>
): Promise<T> {
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    return result
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export interface OkrAllyUser {
  id: string
  email: string
  phone: string | null
  name: string
  is_admin: boolean
  /** The user's "home" organization, or null. Set the first time an org
   *  allocates credits to them or designates them admin (migration 009). */
  organization_id: string | null
  /** Company Admin screen gate — strictly this flag (migration 009). */
  is_org_admin: boolean
  /** Walkthrough keys already auto-shown to this user (migration 012):
   *  'org_admin', 'employee'. The main "How it works" one is manual-only. */
  seen_walkthroughs: string[]
  created_at: string
}

const USER_COLS =
  'id, email, phone, name, is_admin, organization_id, is_org_admin, seen_walkthroughs, created_at'

export const WALKTHROUGH_KEYS = ['org_admin', 'employee'] as const
export type WalkthroughKey = (typeof WALKTHROUGH_KEYS)[number]

/** Record that a walkthrough has been auto-shown, so it won't auto-pop again.
 *  Idempotent; the user stays free to reopen it from the "see this again" link. */
export async function markWalkthroughSeen(userId: string, key: WalkthroughKey): Promise<void> {
  await query(
    `UPDATE users SET seen_walkthroughs = array_append(seen_walkthroughs, $2)
      WHERE id = $1 AND NOT ($2 = ANY(seen_walkthroughs))`,
    [userId, key]
  )
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function placeholderName(email: string): string {
  const local = email.split('@')[0] || 'there'
  return local.slice(0, 120)
}

/**
 * Resolve the Neon users row for this email, creating it on first sight.
 * Called from the sign-in-code verify route once the code is confirmed.
 *
 * `name` is NOT NULL in the schema; at the email-gate step we only have the
 * email, so a new row is seeded with the email's local part as a placeholder.
 * The step form ("Name (editable)") overwrites it later.
 */
export async function resolveOrCreateUser(email: string): Promise<OkrAllyUser> {
  const normalized = email.trim().toLowerCase()

  const existing = await query<OkrAllyUser>(
    `SELECT ${USER_COLS} FROM users WHERE email = $1`,
    [normalized]
  )
  if (existing.rows[0]) return existing.rows[0]

  const inserted = await query<OkrAllyUser>(
    `INSERT INTO users (email, name)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING ${USER_COLS}`,
    [normalized, placeholderName(normalized)]
  )
  return inserted.rows[0]
}

export async function getUserById(id: string): Promise<OkrAllyUser | null> {
  if (!UUID_RE.test(id)) return null
  const res = await query<OkrAllyUser>(
    `SELECT ${USER_COLS} FROM users WHERE id = $1`,
    [id]
  )
  return res.rows[0] ?? null
}

/**
 * Current OKR Ally user from the session cookie, or null if not signed in.
 *
 * Two cookie shapes:
 *  - a bare Neon user id (UUID) — the 7-day session issued to regular users.
 *  - `<userId>.<issuedAt>.<sig>` — the 24h signed session issued to admins
 *    (lib/okrAllySession.ts).
 *
 * An admin account is ONLY ever authenticated through a valid, unexpired signed
 * token. A bare-id cookie naming an admin account is rejected, so an old cookie
 * (or a hand-crafted one) can't be used to skip the 24h re-verification.
 */
export async function getSessionUser(req: NextRequest): Promise<OkrAllyUser | null> {
  const raw = req.cookies.get(OKR_ALLY_SESSION_COOKIE)?.value
  if (!raw) return null

  if (isAdminSessionToken(raw)) {
    const verified = verifyAdminSession(raw)
    if (!verified) return null // bad signature, tampered issuedAt, or > 24h old
    const user = await getUserById(verified.userId)
    // The signed token is an admin-only credential. If the account is no longer
    // an admin, force a fresh (regular) sign-in.
    if (!user || !user.is_admin) return null
    return user
  }

  const user = await getUserById(raw)
  if (!user) return null
  // Admins must use the signed, 24h-expiring token — never a bare id.
  if (user.is_admin) return null
  return user
}

/** Personal credits only; 0 when no balance row exists yet. Used by the paid
 *  purchase / invoice paths, which are personal-only. */
export async function getCreditsRemaining(userId: string): Promise<number> {
  const res = await query<{ credits_remaining: number }>(
    'SELECT credits_remaining FROM user_credit_balance WHERE user_id = $1',
    [userId]
  )
  return res.rows[0]?.credits_remaining ?? 0
}

export interface AvailableCredits {
  /** Personal `user_credit_balance`. */
  personal: number
  /** Per-organization allocated balances the user can spend (>0 only). */
  org: { organizationId: string; organizationName: string; credits: number }[]
  /** personal + Σ org — what "can I run a review?" should check. */
  total: number
}

/**
 * Everything a user can spend on a review: their personal balance plus every
 * organization-allocated balance. The two are always tracked separately in the
 * DB (org credits never merge into personal) — this only sums them for display
 * and for the "can submit?" check. Deduction order is enforced in
 * lib/okrAllySubmission.ts (coupon → org → personal).
 */
export async function getAvailableCredits(userId: string): Promise<AvailableCredits> {
  const [personalRes, orgRes] = await Promise.all([
    query<{ credits_remaining: number }>(
      'SELECT credits_remaining FROM user_credit_balance WHERE user_id = $1',
      [userId]
    ),
    query<{ organization_id: string; name: string; credits_remaining: number }>(
      `SELECT ocb.organization_id, o.name, ocb.credits_remaining
         FROM org_credit_balance ocb
         JOIN organizations o ON o.id = ocb.organization_id
        WHERE ocb.user_id = $1 AND ocb.credits_remaining > 0
        ORDER BY ocb.credits_remaining DESC, o.name`,
      [userId]
    ),
  ])
  const personal = personalRes.rows[0]?.credits_remaining ?? 0
  const org = orgRes.rows.map((r) => ({
    organizationId: r.organization_id,
    organizationName: r.name,
    credits: r.credits_remaining,
  }))
  return { personal, org, total: personal + org.reduce((s, x) => s + x.credits, 0) }
}

// ─── Sanity okrAllySettings (footer/branding + GST invoice compliance) ───

export interface OkrAllySiteSettings {
  email: string | null
  phone: string | null
  substackUrl: string | null
  linkedinUrl: string | null
  okrAllyBookingUrl: string | null
  legalBusinessName: string | null
  registeredAddress: string | null
  supplierGstin: string | null
  supplierPan: string | null
  supplierSacCode: string | null
}

/**
 * The `okrAllySettings` singleton in the isolated `okr-ally` dataset:
 * footer/exit-screen links and the supplier details snapshotted onto each
 * invoice at generation time.
 */
export async function getSiteSettings(): Promise<OkrAllySiteSettings> {
  const doc = await okrAllySanityClient.fetch(
    `*[_type == 'okrAllySettings'][0]{
      email, phone, substackUrl, linkedinUrl, okrAllyBookingUrl,
      legalBusinessName, registeredAddress, supplierGstin, supplierPan, supplierSacCode
    }`,
    {},
    { cache: 'no-store' }
  )
  return {
    email: doc?.email ?? null,
    phone: doc?.phone ?? null,
    substackUrl: doc?.substackUrl ?? null,
    linkedinUrl: doc?.linkedinUrl ?? null,
    okrAllyBookingUrl: doc?.okrAllyBookingUrl ?? null,
    legalBusinessName: doc?.legalBusinessName ?? null,
    registeredAddress: doc?.registeredAddress ?? null,
    supplierGstin: doc?.supplierGstin ?? null,
    supplierPan: doc?.supplierPan ?? null,
    supplierSacCode: doc?.supplierSacCode ?? null,
  }
}
