import crypto from 'crypto'

/**
 * OKR Ally — signed session token for admin accounts.
 *
 * Regular users get a 7-day session whose cookie value is just their Neon user
 * id (see app/api/okr-ally/sign-in-code/verify). That is fine for them, but an
 * admin (pgs@embiggen.co.in, users.is_admin = true) must re-authenticate every
 * 24 hours and the expiry must not be forgeable by holding onto an old cookie.
 *
 * So an admin's cookie is instead a stateless signed token:
 *
 *   <userId>.<issuedAtMs>.<hmacSHA256(userId.issuedAtMs)>
 *
 * `getSessionUser` (lib/okrAlly.ts) verifies the HMAC and the 24h age on every
 * request. Any tampering — a different user id, a rolled-forward issuedAt —
 * breaks the signature, and a signature that predates the window is rejected
 * even if the browser still holds the cookie. `getSessionUser` also refuses a
 * bare-user-id cookie for an admin account, so the signed path can't be
 * side-stepped.
 *
 * HMAC key: the dedicated OKR_ALLY_SESSION_SECRET (`openssl rand -hex 32`, set
 * on Vercel + in .env.local — same pattern as CONSULTING_RAZORPAY_WEBHOOK_SECRET).
 * It is NOT derived from DATABASE_URL, so rotating the database URL has no effect
 * on session validity. Rotating OKR_ALLY_SESSION_SECRET forces admins to sign in
 * again; regular sessions are unaffected either way. Same crypto primitives as
 * the Razorpay signature checks elsewhere in the repo (crypto.createHmac +
 * timingSafeEqual).
 */

export const ADMIN_SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000
export const ADMIN_SESSION_MAX_AGE_SECONDS = ADMIN_SESSION_MAX_AGE_MS / 1000

/** A demo session (lib/okrAllyDemo.ts) lasts a working day — long enough to run
 *  it back-to-back for several corporate audiences in one sitting. It is a
 *  SEPARATE cookie (`okr_ally_demo`) so entering/leaving demo mode never
 *  disturbs PGS's real 24h admin session on `okr_ally_session`. */
export const DEMO_SESSION_MAX_AGE_MS = 12 * 60 * 60 * 1000
export const DEMO_SESSION_MAX_AGE_SECONDS = DEMO_SESSION_MAX_AGE_MS / 1000

function sessionKey(): string {
  const secret = process.env.OKR_ALLY_SESSION_SECRET
  if (!secret) {
    throw new Error('OKR_ALLY_SESSION_SECRET is not set — required to sign/verify admin sessions')
  }
  return secret
}

function sign(body: string): string {
  return crypto.createHmac('sha256', sessionKey()).update(body).digest('base64url')
}

/** A cookie value in `<a>.<b>.<c>` shape is an admin token; a bare user id
 *  (a UUID, no dots) is a regular session. */
export function isAdminSessionToken(value: string): boolean {
  return value.split('.').length === 3
}

/** Mint an admin session token. `issuedAt` is injectable for tests. */
export function signAdminSession(userId: string, issuedAt: number = Date.now()): string {
  const body = `${userId}.${issuedAt}`
  return `${body}.${sign(body)}`
}

/**
 * Verify an admin session token. Returns `{ userId }` only when the signature
 * is valid AND the token was issued within the last 24 hours. Returns null for
 * a bad shape, a bad/tampered signature, a future-dated issuedAt, or an expired
 * token.
 */
export function verifyAdminSession(
  token: string,
  now: number = Date.now()
): { userId: string } | null {
  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [userId, issuedAtStr, providedSig] = parts
  if (!userId || !issuedAtStr || !providedSig) return null

  const expectedSig = sign(`${userId}.${issuedAtStr}`)
  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  const issuedAt = Number(issuedAtStr)
  if (!Number.isFinite(issuedAt)) return null
  // Small tolerance for clock skew; a token claiming the future is otherwise
  // rejected (it can't be legitimately minted).
  if (issuedAt > now + 60_000) return null
  if (now - issuedAt > ADMIN_SESSION_MAX_AGE_MS) return null

  return { userId }
}

// ─── Demo session token (okr_ally_demo cookie) ─────────────────────────────
//
// Shape: `d.<demoUserId>.<issuedAtMs>.<hmacSHA256("d.<demoUserId>.<issuedAtMs>")>`
// Four dot-parts, always led by "d." — so it can't be confused with a bare user
// id (no dots) or an admin token (three parts). Same HMAC key + primitives as
// the admin token above.

/** A cookie value with four dot-parts led by "d." is a demo session token. */
export function isDemoSessionToken(value: string): boolean {
  const parts = value.split('.')
  return parts.length === 4 && parts[0] === 'd'
}

/** Mint a demo session token. `issuedAt` is injectable for tests. */
export function signDemoSession(demoUserId: string, issuedAt: number = Date.now()): string {
  const body = `d.${demoUserId}.${issuedAt}`
  return `${body}.${sign(body)}`
}

/** Verify a demo session token — valid signature AND issued within the last
 *  12 hours. Null for a bad shape, tampered signature, future issuedAt, or an
 *  expired token. */
export function verifyDemoSession(
  token: string,
  now: number = Date.now()
): { demoUserId: string } | null {
  const parts = token.split('.')
  if (parts.length !== 4 || parts[0] !== 'd') return null
  const [, demoUserId, issuedAtStr, providedSig] = parts
  if (!demoUserId || !issuedAtStr || !providedSig) return null

  const expectedSig = sign(`d.${demoUserId}.${issuedAtStr}`)
  const a = Buffer.from(providedSig)
  const b = Buffer.from(expectedSig)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  const issuedAt = Number(issuedAtStr)
  if (!Number.isFinite(issuedAt)) return null
  if (issuedAt > now + 60_000) return null
  if (now - issuedAt > DEMO_SESSION_MAX_AGE_MS) return null

  return { demoUserId }
}
