import crypto from 'node:crypto'
import { Pool } from 'pg'
import type { BrowserContext, APIRequestContext } from '@playwright/test'

/**
 * Shared E2E helpers: direct DB access for setup/teardown and sign-in-code
 * minting, so specs can drive the real code sign-in without an inbox.
 */

const {
  DATABASE_URL,
  NEXT_PUBLIC_SANITY_PROJECT_ID: SANITY_PROJECT,
  SANITY_API_TOKEN,
  BLOB_READ_WRITE_TOKEN,
  OKR_ALLY_SESSION_SECRET,
} = process.env

// OKR Ally's Sanity content (signInCode auth included) lives in its own
// isolated dataset, never `production`. Keep this in sync with
// lib/okrAllySanity.ts / NEXT_PUBLIC_OKR_ALLY_SANITY_DATASET.
const SANITY_DATASET = process.env.NEXT_PUBLIC_OKR_ALLY_SANITY_DATASET || 'okr-ally'

if (!DATABASE_URL) throw new Error('e2e: DATABASE_URL not set (need .env.local)')
if (!SANITY_API_TOKEN) throw new Error('e2e: SANITY_API_TOKEN not set (need .env.local)')
if (!OKR_ALLY_SESSION_SECRET) throw new Error('e2e: OKR_ALLY_SESSION_SECRET not set (need .env.local)')

export const pool = new Pool({ connectionString: DATABASE_URL })

export const TEST_EMAIL_PREFIX = 'okr-e2e-'

/** A unique test email for one spec run. */
export function testEmail(tag = ''): string {
  return `${TEST_EMAIL_PREFIX}${tag}${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`
}

async function sanityMutate(mutations: unknown[]): Promise<void> {
  const res = await fetch(
    `https://${SANITY_PROJECT}.api.sanity.io/v2021-06-07/data/mutate/${SANITY_DATASET}`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${SANITY_API_TOKEN}` },
      body: JSON.stringify({ mutations }),
    }
  )
  if (!res.ok) throw new Error('sanity mutate failed: ' + (await res.text()))
}

export interface SignedInUser {
  email: string
  userId: string
  /** Cookie header value, e.g. "okr_ally_session=<uuid>" — for APIRequestContext calls. */
  cookieHeader: string
  /** The raw `okr_ally_session` cookie value: a bare UUID for a regular user,
   *  the `<uuid>.<iat>.<sig>` signed token for an admin. */
  sessionValue: string
}

/** HMAC of a code, keyed by email + secret — mirrors codeHash() in
 *  lib/okrAllySanity.ts so a test can mint a `signInCode` doc the server accepts. */
function codeHash(email: string, code: string): string {
  return crypto
    .createHmac('sha256', OKR_ALLY_SESSION_SECRET!)
    .update(`${email}:${code}`)
    .digest('hex')
}

/**
 * Mint a `signInCode` doc directly and return the plaintext code, so a spec can
 * exercise the verify endpoint (wrong code, expiry, lockout) end to end.
 * `expiresInMs` defaults to 10 min; pass a negative value for an already-expired
 * code.
 */
export async function mintSignInCode(
  email: string,
  expiresInMs = 10 * 60 * 1000
): Promise<string> {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  await sanityMutate([
    { delete: { query: `*[_type=="signInCode" && email=="${email}"]` } },
    {
      create: {
        _type: 'signInCode',
        email,
        codeHash: codeHash(email, code),
        attempts: 0,
        expiresAt: new Date(Date.now() + expiresInMs).toISOString(),
      },
    },
  ])
  return code
}

/**
 * Full sign-in against `baseURL`: mint a `signInCode` in Sanity, POST the
 * email + code to /api/okr-ally/sign-in-code/verify (which creates/loads the
 * Neon user and sets the session cookie in `context`), and return the user id
 * + cookie header.
 *
 * `opts.admin` flags the account `is_admin` BEFORE verifying, so the route
 * issues the 24h signed session token instead of a bare-id cookie (getSessionUser
 * rejects a bare-id cookie for an admin account).
 */
export async function signIn(
  context: BrowserContext,
  baseURL: string,
  email = testEmail(),
  opts: { admin?: boolean } = {}
): Promise<SignedInUser> {
  if (opts.admin) {
    await pool.query(
      `INSERT INTO users (email, name, is_admin) VALUES ($1, $2, true)
       ON CONFLICT (email) DO UPDATE SET is_admin = true`,
      [email, (email.split('@')[0] || 'admin').slice(0, 120)]
    )
  }

  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
  await sanityMutate([
    { delete: { query: `*[_type=="signInCode" && email=="${email}"]` } },
    {
      create: {
        _type: 'signInCode',
        email,
        codeHash: codeHash(email, code),
        attempts: 0,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
      },
    },
  ])

  const res = await context.request.post(`${baseURL}/api/okr-ally/sign-in-code/verify`, {
    data: { email, code },
  })
  if (!res.ok()) throw new Error(`signIn: verify failed (${res.status()}) ${await res.text()}`)

  const cookies = await context.cookies()
  const session = cookies.find((c) => c.name === 'okr_ally_session')
  if (!session) throw new Error('signIn: no okr_ally_session cookie after verify')

  const row = await pool.query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [email])
  const userId = row.rows[0]?.id
  if (!userId) throw new Error('signIn: no users row after verify')

  return {
    email,
    userId,
    cookieHeader: `okr_ally_session=${session.value}`,
    sessionValue: session.value,
  }
}

export async function setAdmin(userId: string, isAdmin: boolean): Promise<void> {
  await pool.query(`UPDATE users SET is_admin = $2 WHERE id = $1`, [userId, isAdmin])
}

export interface DemoSession {
  /** The admin who started the demo (already signed in on `context`). */
  admin: SignedInUser
  /** The ephemeral demo account's user id. */
  demoUserId: string
  /** `okr_ally_demo=<token>` — for APIRequestContext calls. */
  cookieHeader: string
}

/**
 * Start a demo session: sign in as a fresh admin, POST /api/okr-ally/demo/start
 * (which sets the `okr_ally_demo` cookie in `context` alongside the admin's
 * `okr_ally_session`), and return both. Push `demoUserId` to your createdUsers
 * so cleanupUsers tears down the demo account + its rows.
 */
export async function startDemo(
  context: BrowserContext,
  baseURL: string,
  brand: 'okr_ally' | 'goal_ally' = 'okr_ally'
): Promise<DemoSession> {
  const admin = await signIn(context, baseURL, testEmail('demoadmin-'), { admin: true })
  const res = await context.request.post(`${baseURL}/api/okr-ally/demo/start`, { data: { brand } })
  if (!res.ok()) throw new Error(`startDemo: ${res.status()} ${await res.text()}`)

  const demoCookie = (await context.cookies()).find((c) => c.name === 'okr_ally_demo')
  if (!demoCookie) throw new Error('startDemo: no okr_ally_demo cookie after /demo/start')

  const row = await pool.query<{ id: string }>(
    `SELECT id FROM users WHERE is_demo ORDER BY created_at DESC LIMIT 1`
  )
  const demoUserId = row.rows[0]?.id
  if (!demoUserId) throw new Error('startDemo: no is_demo user row')

  return { admin, demoUserId, cookieHeader: `okr_ally_demo=${demoCookie.value}` }
}

/**
 * Promote an already-signed-in user to admin and refresh their session in
 * `context` to the 24h signed admin token — a bare-id cookie is rejected for an
 * admin account, so tests that check non-admin gating first must re-mint here.
 */
export async function promoteToAdmin(
  context: BrowserContext,
  baseURL: string,
  user: SignedInUser
): Promise<SignedInUser> {
  await setAdmin(user.userId, true)
  return signIn(context, baseURL, user.email)
}

/** Give a user a full saved profile (name/phone on users, context on user_profile)
 *  so they land on the returning-user summary screen. */
export async function seedProfile(
  userId: string,
  p: { name?: string; phone?: string | null; companyName: string; companyContext: string; businessContext: string; roleContext: string }
): Promise<void> {
  await pool.query(`UPDATE users SET name = COALESCE($2, name), phone = $3 WHERE id = $1`, [
    userId,
    p.name ?? null,
    p.phone ?? null,
  ])
  await pool.query(
    `INSERT INTO user_profile (user_id, company_name, company_context, business_context, role_context)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id) DO UPDATE SET
       company_name = EXCLUDED.company_name, company_context = EXCLUDED.company_context,
       business_context = EXCLUDED.business_context, role_context = EXCLUDED.role_context`,
    [userId, p.companyName, p.companyContext, p.businessContext, p.roleContext]
  )
}

export async function seedCredits(userId: string, n: number): Promise<void> {
  await pool.query(
    `INSERT INTO user_credit_balance (user_id, credits_remaining) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET credits_remaining = $2`,
    [userId, n]
  )
}

export async function getBalance(userId: string): Promise<number> {
  const r = await pool.query<{ credits_remaining: number }>(
    `SELECT credits_remaining FROM user_credit_balance WHERE user_id = $1`,
    [userId]
  )
  return r.rows[0]?.credits_remaining ?? 0
}

export async function getLatestSubmission(userId: string): Promise<{ id: string; status: string } | null> {
  const r = await pool.query<{ id: string; status: string }>(
    `SELECT id, status FROM submissions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
    [userId]
  )
  return r.rows[0] ?? null
}

export interface CtxSnapshotField {
  raw_input: string
  clarifying_question: string | null
  clarifying_answer: string | null
  paraphrase_suggested: string | null
  final_text: string
  paraphrase_action: string
}

export async function getContextSnapshot(
  submissionId: string
): Promise<Record<'company_context' | 'business_context' | 'role_context', CtxSnapshotField>> {
  const r = await pool.query<{ context_snapshot: Record<string, CtxSnapshotField> }>(
    `SELECT context_snapshot FROM submissions WHERE id = $1`,
    [submissionId]
  )
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return r.rows[0].context_snapshot as any
}

export async function getCreditTransactions(userId: string): Promise<{ type: string; amount: number }[]> {
  const r = await pool.query<{ type: string; amount: number }>(
    `SELECT type, amount FROM credit_transactions WHERE user_id = $1 ORDER BY created_at`,
    [userId]
  )
  return r.rows
}

export async function getFeedback(userId: string): Promise<{ rating: number; feedback_text: string | null } | null> {
  const r = await pool.query<{ rating: number; feedback_text: string | null }>(
    `SELECT rating, feedback_text FROM outcome_feedback WHERE user_id = $1`,
    [userId]
  )
  return r.rows[0] ?? null
}

/** Insert a completed submission + review directly (for tests that don't need a live Claude call). */
export async function seedCompletedReview(userId: string, objective = 'Seeded E2E objective'): Promise<{ submissionId: string; reviewId: string }> {
  const sub = await pool.query<{ id: string }>(
    `INSERT INTO submissions (user_id, objective, krs, context_snapshot, idempotency_key, status)
     VALUES ($1, $2, $3::jsonb, '{}'::jsonb, $4, 'complete') RETURNING id`,
    [userId, objective, JSON.stringify([{ text: 'Seed KR from 10 to 20' }]), 'e2e-seed-' + crypto.randomUUID()]
  )
  const submissionId = sub.rows[0].id
  const rev = await pool.query<{ id: string }>(
    `INSERT INTO reviews (submission_id, criteria_scores, overall_score, objective_feedback, key_result_feedback, suggested_okr_options, rubric_version, model_version)
     VALUES ($1, $2::jsonb, $3, $4::jsonb, $5::jsonb, $6::jsonb, 'okr-ally-rubric-v1', 'claude-sonnet-5') RETURNING id`,
    [
      submissionId,
      JSON.stringify([
        { criterion: 'Outcome vs Output', score: 7, weight: 0.25, rationale: 'seed' },
        { criterion: 'Alignment', score: 7, weight: 0.25, rationale: 'seed' },
        { criterion: 'Measurability', score: 7, weight: 0.2, rationale: 'seed' },
        { criterion: 'Specificity', score: 6, weight: 0.15, rationale: 'seed' },
        { criterion: 'Ambition vs Realism', score: 6, weight: 0.15, rationale: 'seed' },
      ]),
      6.6,
      JSON.stringify({ what_works: 'seed works', what_to_improve: 'seed improve' }),
      JSON.stringify([{ kr_reference: 'KR1', what_works: 'a', what_to_improve: 'b' }]),
      JSON.stringify([
        { label: 'Refined Original', objective: 'Refined seed', key_results: [{ text: 'k', status: 'modified', initiatives: [] }], rationale: 'r' },
        { label: 'Fresh Rewrite', objective: 'Fresh seed', key_results: [{ text: 'k', status: 'new', initiatives: [{ action: 'do', owning_team: 'Team' }] }], rationale: 'r' },
      ]),
    ]
  )
  return { submissionId, reviewId: rev.rows[0].id }
}

/** Insert a minimal valid invoice row for ownership tests. */
export async function seedInvoice(userId: string): Promise<{ invoiceId: string }> {
  const r = await pool.query<{ id: string }>(
    `INSERT INTO invoices (
       user_id, razorpay_payment_id, invoice_number, list_price, base_amount, gst_amount, total_amount,
       place_of_supply, igst_amount, supplier_name, supplier_gstin, supplier_pan, supplier_address
     ) VALUES ($1, $2, $3, 50, 50, 9, 59, 'Maharashtra', 9, 'Test LLP', '29ABCDE1234F1Z5', 'ABCDE1234F', 'Test address')
     RETURNING id`,
    [userId, 'e2e-pay-' + crypto.randomUUID(), 'OKR/E2E/' + Math.floor(Math.random() * 1e6)]
  )
  return { invoiceId: r.rows[0].id }
}

export interface InvoiceRowLite {
  invoice_number: string
  razorpay_payment_id: string | null
  submission_id: string | null
  list_price: string
  discount_percent: string | null
  coupon_code: string | null
  base_amount: string
  gst_amount: string
  total_amount: string
  place_of_supply: string
  cgst_amount: string | null
  sgst_amount: string | null
  igst_amount: string | null
}

export async function getInvoicesForUser(userId: string): Promise<InvoiceRowLite[]> {
  const r = await pool.query<InvoiceRowLite>(
    `SELECT invoice_number, razorpay_payment_id, submission_id, list_price, discount_percent,
            coupon_code, base_amount, gst_amount, total_amount, place_of_supply,
            cgst_amount, sgst_amount, igst_amount
       FROM invoices WHERE user_id = $1 ORDER BY created_at`,
    [userId]
  )
  return r.rows
}

/** Delete every row belonging to the given users + any blobs, and their Sanity magic tokens. */
export async function cleanupUsers(userIds: string[]): Promise<void> {
  for (const uid of userIds) {
    if (!uid) continue
    await pool.query(`DELETE FROM outcome_feedback WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM reviews WHERE submission_id IN (SELECT id FROM submissions WHERE user_id = $1)`, [uid])
    await pool.query(`DELETE FROM invoices WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM credit_transactions WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM coupon_redemptions WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM submissions WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM okr_ally_daily_usage WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM user_credit_balance WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM org_credit_balance WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM organization_allocations WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM user_profile WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM drafts WHERE user_id = $1`, [uid])
    await pool.query(`DELETE FROM users WHERE id = $1`, [uid])
  }
  try {
    await sanityMutate([
      { delete: { query: `*[_type=="signInCode" && email match "${TEST_EMAIL_PREFIX}*"]` } },
      { delete: { query: `*[_type=="magicToken" && email match "${TEST_EMAIL_PREFIX}*"]` } },
    ])
  } catch {
    /* best effort */
  }
  if (BLOB_READ_WRITE_TOKEN) {
    try {
      const { list, del } = await import('@vercel/blob')
      const b = await list({ token: BLOB_READ_WRITE_TOKEN })
      for (const x of b.blobs) await del(x.url, { token: BLOB_READ_WRITE_TOKEN })
    } catch {
      /* best effort */
    }
  }
}

/** Convenience: an APIRequestContext-style GET with a session cookie. */
export async function apiGet(request: APIRequestContext, url: string, cookieHeader: string) {
  return request.get(url, { headers: { cookie: cookieHeader } })
}

// ─── Corporate / organization helpers (migration 009) ──────────────────────

export const TEST_GSTIN_PREFIX = '29ZZTST'

/** A unique GSTIN-shaped string for one test run — matches GSTIN_RE and starts
 *  with TEST_GSTIN_PREFIX so cleanup can find it. */
export function testGstin(): string {
  const n = String(Math.floor(1000 + Math.random() * 9000))
  return `${TEST_GSTIN_PREFIX}${n}F1Z5` // 29 ZZTST NNNN F 1 Z 5  → 15 chars
}

export interface OrgRow {
  id: string
  name: string
  gstin: string
  registered_address: string
  credits_purchased: number
  credits_allocated: number
}

export async function getOrgByGstin(gstin: string): Promise<OrgRow | null> {
  const r = await pool.query<OrgRow>(`SELECT * FROM organizations WHERE gstin = $1`, [gstin.toUpperCase()])
  return r.rows[0] ?? null
}

/** Create a bare organization (no fake payment). Returns id + gstin (push the
 *  gstin to your createdGstins so cleanupOrgs tears it down). */
export async function seedOrg(name: string): Promise<{ id: string; gstin: string }> {
  const gstin = ('33ORG' + Date.now().toString(36) + Math.random().toString(36).slice(2))
    .slice(0, 15)
    .toUpperCase()
  const r = await pool.query<{ id: string }>(
    `INSERT INTO organizations (name, gstin, registered_address, credits_purchased, credits_allocated)
     VALUES ($1, $2, '1 Test Road, Chennai, Tamil Nadu 600001', 100, 0) RETURNING id`,
    [name, gstin]
  )
  return { id: r.rows[0].id, gstin }
}

export async function makeOrgAdmin(userId: string, orgId: string): Promise<void> {
  await pool.query(`UPDATE users SET is_org_admin = true, organization_id = $2 WHERE id = $1`, [userId, orgId])
}

/** Put a user in an org as a plain member (+ give them 5 org credits). */
export async function joinOrg(userId: string, orgId: string): Promise<void> {
  await pool.query(`UPDATE users SET organization_id = $2 WHERE id = $1`, [userId, orgId])
  await pool.query(
    `INSERT INTO org_credit_balance (user_id, organization_id, credits_remaining) VALUES ($1, $2, 5)
     ON CONFLICT (user_id, organization_id) DO UPDATE SET credits_remaining = 5`,
    [userId, orgId]
  )
}

export async function getSeenWalkthroughs(userId: string): Promise<string[]> {
  const r = await pool.query<{ seen_walkthroughs: string[] }>(
    `SELECT seen_walkthroughs FROM users WHERE id = $1`,
    [userId]
  )
  return r.rows[0]?.seen_walkthroughs ?? []
}

/** Simulate an org admin's "Confirm and publish" (migration 011): store the
 *  shared company/business context AND stamp context_confirmed_at. Call again to
 *  simulate a later edit + reconfirmation. */
export async function publishOrgContext(
  organizationId: string,
  companyContext: string,
  businessContext: string
): Promise<void> {
  await pool.query(
    `UPDATE organizations SET company_context = $2, business_context = $3, context_confirmed_at = now() WHERE id = $1`,
    [organizationId, companyContext, businessContext]
  )
}

export async function getSubmissionContextSnapshot(submissionId: string): Promise<Record<string, { final_text?: string }>> {
  const r = await pool.query<{ context_snapshot: Record<string, { final_text?: string }> }>(
    `SELECT context_snapshot FROM submissions WHERE id = $1`,
    [submissionId]
  )
  return r.rows[0].context_snapshot
}

export async function getOrgBalance(userId: string, organizationId: string): Promise<number> {
  const r = await pool.query<{ credits_remaining: number }>(
    `SELECT credits_remaining FROM org_credit_balance WHERE user_id = $1 AND organization_id = $2`,
    [userId, organizationId]
  )
  return r.rows[0]?.credits_remaining ?? 0
}

export async function getUserOrgFields(
  userId: string
): Promise<{ organization_id: string | null; is_org_admin: boolean }> {
  const r = await pool.query<{ organization_id: string | null; is_org_admin: boolean }>(
    `SELECT organization_id, is_org_admin FROM users WHERE id = $1`,
    [userId]
  )
  return r.rows[0]
}

/** Delete test organizations (and their cascaded ledger / balance rows). Run
 *  AFTER cleanupUsers so no users still reference the org. */
export async function cleanupOrgs(gstins: string[]): Promise<void> {
  for (const g of gstins) {
    if (!g) continue
    const org = await getOrgByGstin(g)
    if (!org) continue
    await pool.query(`UPDATE users SET organization_id = NULL, is_org_admin = FALSE WHERE organization_id = $1`, [org.id])
    await pool.query(`DELETE FROM credit_transactions WHERE organization_id = $1`, [org.id])
    await pool.query(`DELETE FROM invoices WHERE buyer_address IS NOT NULL AND gstin = $1`, [org.gstin])
    await pool.query(`DELETE FROM organizations WHERE id = $1`, [org.id]) // CASCADEs allocations + balances
  }
}
