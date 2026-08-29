import { Pool, type QueryResultRow } from 'pg'
import type { NextRequest } from 'next/server'
import { okrAllySanityClient } from '@/lib/okrAllySanity'

/**
 * OKR Ally — Neon data access + session helpers.
 *
 * Same connection pattern as lib/worklifeDb.ts (pg Pool, DATABASE_URL /
 * POSTGRES_URL). The OKR Ally tables live in the same Neon database that is
 * already linked to the Vercel project — see okr-ally-schema-migration.sql.
 *
 * Auth reuses the magic-link token primitives in lib/academy.ts as-is
 * (generateToken / storeMagicToken / verifyMagicToken, tokens in Sanity,
 * 15-minute expiry). What is new here: a successful verification resolves to
 * (or creates) a row in the Neon `users` table, and the session cookie holds
 * that Neon user's UUID — not a Sanity document id.
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
  created_at: string
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function placeholderName(email: string): string {
  const local = email.split('@')[0] || 'there'
  return local.slice(0, 120)
}

/**
 * Resolve the Neon users row for this email, creating it on first sight.
 * Called from the magic-link verify route once the token is confirmed.
 *
 * `name` is NOT NULL in the schema; at the email-gate step we only have the
 * email, so a new row is seeded with the email's local part as a placeholder.
 * The step form ("Name (editable)") overwrites it later.
 */
export async function resolveOrCreateUser(email: string): Promise<OkrAllyUser> {
  const normalized = email.trim().toLowerCase()

  const existing = await query<OkrAllyUser>(
    'SELECT id, email, phone, name, is_admin, created_at FROM users WHERE email = $1',
    [normalized]
  )
  if (existing.rows[0]) return existing.rows[0]

  const inserted = await query<OkrAllyUser>(
    `INSERT INTO users (email, name)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email, phone, name, is_admin, created_at`,
    [normalized, placeholderName(normalized)]
  )
  return inserted.rows[0]
}

export async function getUserById(id: string): Promise<OkrAllyUser | null> {
  if (!UUID_RE.test(id)) return null
  const res = await query<OkrAllyUser>(
    'SELECT id, email, phone, name, is_admin, created_at FROM users WHERE id = $1',
    [id]
  )
  return res.rows[0] ?? null
}

/** Current OKR Ally user from the session cookie, or null if not signed in. */
export async function getSessionUser(req: NextRequest): Promise<OkrAllyUser | null> {
  const id = req.cookies.get(OKR_ALLY_SESSION_COOKIE)?.value
  if (!id) return null
  return getUserById(id)
}

/** Credits available to a user; 0 when no balance row exists yet. */
export async function getCreditsRemaining(userId: string): Promise<number> {
  const res = await query<{ credits_remaining: number }>(
    'SELECT credits_remaining FROM user_credit_balance WHERE user_id = $1',
    [userId]
  )
  return res.rows[0]?.credits_remaining ?? 0
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
