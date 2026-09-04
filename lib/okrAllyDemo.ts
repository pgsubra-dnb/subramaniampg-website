import crypto from 'crypto'
import type { PoolClient } from 'pg'
import { query, withTransaction, getUserById, type OkrAllyUser } from '@/lib/okrAlly'
import { type Brand } from '@/lib/okrAllyBrand'
import { SEED_ACCOUNT_EMAIL, SEED_ACCOUNT_NAME, SEED_KEY_PREFIX } from '@/lib/okrAllyDemoSeeds'

/**
 * OKR Ally / Goal Ally — demo mode lifecycle (migrations 014 + 015).
 *
 * "Start demo" (PGS's is_admin session only) creates throwaway `is_demo`
 * records and hands the browser an `okr_ally_demo` cookie. Two modes:
 *
 *  - individual — one demo account, its History pre-seeded with clones from the
 *    seed library (lib/okrAllyDemoSeeds.ts).
 *  - corporate  — a demo organization (is_demo), a demo org-admin, and two demo
 *    employees carrying cloned submission history + a matching allocation ledger,
 *    so the Company Admin usage report has real content immediately. The org's
 *    shared context starts unconfirmed on purpose. A "View as employee" toggle
 *    re-signs the demo cookie to another user in the same demo org.
 *
 * "Reset demo" / "Exit demo" tear the whole tree down. Nothing here ever
 * produces a real invoice or email, and every submission is is_demo = true so it
 * never reaches the admin review list.
 *
 * The seed library account (SEED_ACCOUNT_EMAIL) is is_demo = true so its
 * submissions stay off the admin list, but it is NEVER swept or torn down —
 * every delete path guards on that exact email.
 */

export const DEMO_EMAIL_DOMAIN = 'demo.okrally.invalid'

function demoEmail(tag = ''): string {
  return `demo-${tag}${crypto.randomBytes(7).toString('hex')}@${DEMO_EMAIL_DOMAIN}`
}
const isSeedEmail = (email: string) => email.trim().toLowerCase() === SEED_ACCOUNT_EMAIL

// ─── Individual demo account ──────────────────────────────────────────────

/** Create a fresh ephemeral demo account. Optionally an org member. */
export async function createDemoUser(opts?: {
  name?: string
  organizationId?: string
  isOrgAdmin?: boolean
}): Promise<OkrAllyUser> {
  const res = await query<{ id: string }>(
    `INSERT INTO users (email, name, is_demo, organization_id, is_org_admin)
     VALUES ($1, $2, TRUE, $3, $4) RETURNING id`,
    [demoEmail(), opts?.name ?? 'Demo', opts?.organizationId ?? null, opts?.isOrgAdmin ?? false]
  )
  const user = await getUserById(res.rows[0].id)
  if (!user) throw new Error('createDemoUser: row vanished immediately after insert')
  return user
}

// ─── Seed library ────────────────────────────────────────────────────────

/** The persistent seed-library account id, created on first use. */
export async function seedAccountId(): Promise<string> {
  const existing = await query<{ id: string }>(`SELECT id FROM users WHERE email = $1`, [SEED_ACCOUNT_EMAIL])
  if (existing.rows[0]) return existing.rows[0].id
  const created = await query<{ id: string }>(
    `INSERT INTO users (email, name, is_demo) VALUES ($1, $2, TRUE)
     ON CONFLICT (email) DO UPDATE SET is_demo = TRUE RETURNING id`,
    [SEED_ACCOUNT_EMAIL, SEED_ACCOUNT_NAME]
  )
  return created.rows[0].id
}

export interface SeedLibraryStatus {
  accountId: string
  entries: { key: string; brand: Brand | null; score: number }[]
  realClonePresent: boolean
}

export async function seedLibraryStatus(): Promise<SeedLibraryStatus> {
  const accountId = await seedAccountId()
  const rows = await query<{ idempotency_key: string; brand: Brand | null; score: string }>(
    `SELECT s.idempotency_key, s.brand, r.overall_score AS score
       FROM submissions s JOIN reviews r ON r.submission_id = s.id
      WHERE s.user_id = $1 AND s.idempotency_key LIKE $2
      ORDER BY s.created_at`,
    [accountId, `${SEED_KEY_PREFIX}%`]
  )
  return {
    accountId,
    realClonePresent: rows.rows.some((r) => r.idempotency_key === `${SEED_KEY_PREFIX}real`),
    entries: rows.rows.map((r) => ({
      key: r.idempotency_key.slice(SEED_KEY_PREFIX.length),
      brand: r.brand,
      score: Number(r.score),
    })),
  }
}

// buildSeedEntry lives in lib/okrAllyDemoSeedBuild.ts — it pulls in the live
// review engine (runReview), which must stay out of this module's import graph
// (this module is imported by app/api/okr-ally/me).

// ─── Cloning library rows into a demo account ─────────────────────────────

/** Clone one library submission (+ its review) to `targetUserId` as an is_demo
 *  row. Copies content only — pdf_url/email_sent_at are left null so the report
 *  regenerates on demand. Returns the new submission id. */
async function cloneLibrarySubmission(
  client: PoolClient,
  sourceSubmissionId: string,
  targetUserId: string,
  tag: string
): Promise<string> {
  const src = await client.query<{
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
    `SELECT s.objective, s.krs, s.context_snapshot, s.brand,
            r.criteria_scores, r.overall_score, r.objective_feedback,
            r.key_result_feedback, r.suggested_okr_options, r.rubric_version, r.model_version
       FROM submissions s JOIN reviews r ON r.submission_id = s.id
      WHERE s.id = $1`,
    [sourceSubmissionId]
  )
  const row = src.rows[0]
  const ins = await client.query<{ id: string }>(
    `INSERT INTO submissions (user_id, objective, krs, context_snapshot, idempotency_key, status, brand, is_demo)
     VALUES ($1, $2, $3::jsonb, $4::jsonb, $5, 'complete', $6, TRUE) RETURNING id`,
    [targetUserId, row.objective, JSON.stringify(row.krs), JSON.stringify(row.context_snapshot), `demo-clone:${tag}:${crypto.randomBytes(6).toString('hex')}`, row.brand ?? 'okr_ally']
  )
  await client.query(
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
  return ins.rows[0].id
}

/** Library submission ids for a brand, oldest first (deterministic order). */
async function librarySubmissionsForBrand(client: PoolClient, brand: Brand): Promise<string[]> {
  const accountId = await seedAccountId()
  const r = await client.query<{ id: string }>(
    `SELECT id FROM submissions
      WHERE user_id = $1 AND idempotency_key LIKE $2 AND coalesce(brand, 'okr_ally') = $3
      ORDER BY created_at`,
    [accountId, `${SEED_KEY_PREFIX}%`, brand]
  )
  return r.rows.map((x) => x.id)
}

/** Pre-seed an individual demo account's History with clones for `brand`. */
export async function seedIndividualHistory(demoUserId: string, brand: Brand): Promise<number> {
  return withTransaction(async (c) => {
    const ids = await librarySubmissionsForBrand(c, brand)
    for (const id of ids) await cloneLibrarySubmission(c, id, demoUserId, 'hist')
    return ids.length
  })
}

// ─── Corporate demo ──────────────────────────────────────────────────────

export interface CorporateDemo {
  organizationId: string
  adminUserId: string
  employeeUserIds: string[]
}

const DEMO_ORG_NAME = 'Northwind Trading (demo)'
const DEMO_EMPLOYEES = [
  { name: 'Priya Nair', allocate: 25, remaining: 22 }, // used 3
  { name: 'Marcus Bell', allocate: 20, remaining: 19 }, // used 1
]
const DEMO_POOL_PURCHASED = 100

/** Create a full corporate demo: org (context unconfirmed), admin, employees
 *  with cloned history + a matching allocation ledger. */
export async function createCorporateDemo(brand: Brand): Promise<CorporateDemo> {
  return withTransaction(async (c) => {
    const gstin = '29' + crypto.randomBytes(5).toString('hex').toUpperCase().slice(0, 10) + '1ZD'
    const totalAllocated = DEMO_EMPLOYEES.reduce((s, e) => s + e.allocate, 0)
    const org = await c.query<{ id: string }>(
      `INSERT INTO organizations (name, gstin, registered_address, credits_purchased, credits_allocated, is_demo)
       VALUES ($1, $2, $3, $4, $5, TRUE) RETURNING id`,
      [DEMO_ORG_NAME, gstin, '1 Demo Street, Bengaluru, Karnataka 560001', DEMO_POOL_PURCHASED, totalAllocated]
    )
    const orgId = org.rows[0].id

    const admin = await c.query<{ id: string; email: string }>(
      `INSERT INTO users (email, name, is_demo, organization_id, is_org_admin)
       VALUES ($1, $2, TRUE, $3, TRUE) RETURNING id, email`,
      [demoEmail('orgadmin-'), 'Dana Ellison', orgId]
    )
    const adminUserId = admin.rows[0].id

    const brandLibrary = await librarySubmissionsForBrand(c, brand)
    const employeeUserIds: string[] = []

    for (let i = 0; i < DEMO_EMPLOYEES.length; i++) {
      const e = DEMO_EMPLOYEES[i]
      const emp = await c.query<{ id: string; email: string }>(
        `INSERT INTO users (email, name, is_demo, organization_id)
         VALUES ($1, $2, TRUE, $3) RETURNING id, email`,
        [demoEmail('emp-'), e.name, orgId]
      )
      const empId = emp.rows[0].id
      const empEmail = emp.rows[0].email
      employeeUserIds.push(empId)

      await c.query(
        `INSERT INTO organization_allocations (organization_id, user_id, email, credits_allocated)
         VALUES ($1, $2, $3, $4)`,
        [orgId, empId, empEmail, e.allocate]
      )
      await c.query(
        `INSERT INTO org_credit_balance (user_id, organization_id, credits_remaining)
         VALUES ($1, $2, $3)`,
        [empId, orgId, e.remaining]
      )

      // Cloned history: `used` = allocate - remaining reviews, from the brand's
      // library (round-robin so employee 2 differs from employee 1).
      const used = e.allocate - e.remaining
      for (let k = 0; k < used && brandLibrary.length > 0; k++) {
        const src = brandLibrary[(i + k) % brandLibrary.length]
        const sub = await cloneLibrarySubmission(c, src, empId, 'orguse')
        await c.query(
          `INSERT INTO credit_transactions (user_id, organization_id, submission_id, amount, type, note)
           VALUES ($1, $2, $3, -1, 'usage', 'demo mode — seeded org review')`,
          [empId, orgId, sub]
        )
      }
    }

    return { organizationId: orgId, adminUserId, employeeUserIds }
  })
}

/** Given any demo user in a corporate demo, resolve the org + its members. */
export async function corporateDemoFor(demoUserId: string): Promise<CorporateDemo | null> {
  const u = await query<{ organization_id: string | null }>(
    `SELECT organization_id FROM users WHERE id = $1 AND is_demo`,
    [demoUserId]
  )
  const orgId = u.rows[0]?.organization_id
  if (!orgId) return null
  const org = await query<{ id: string }>(`SELECT id FROM organizations WHERE id = $1 AND is_demo`, [orgId])
  if (!org.rows[0]) return null
  const members = await query<{ id: string; is_org_admin: boolean }>(
    `SELECT id, is_org_admin FROM users WHERE organization_id = $1 AND is_demo ORDER BY is_org_admin DESC, created_at`,
    [orgId]
  )
  const admin = members.rows.find((m) => m.is_org_admin)
  if (!admin) return null
  return {
    organizationId: orgId,
    adminUserId: admin.id,
    employeeUserIds: members.rows.filter((m) => !m.is_org_admin).map((m) => m.id),
  }
}

/** Resolve the demo user to switch the cookie to for "View as …". */
export async function viewAsTarget(
  currentDemoUserId: string,
  role: 'admin' | 'employee'
): Promise<string | null> {
  const c = await corporateDemoFor(currentDemoUserId)
  if (!c) return null
  return role === 'admin' ? c.adminUserId : (c.employeeUserIds[0] ?? null)
}

// ─── Teardown ────────────────────────────────────────────────────────────

/** Delete one demo user + everything it created. No-ops for a non-demo id and
 *  for the protected seed-library account. */
async function deleteDemoUserRows(client: PoolClient, userId: string): Promise<void> {
  const chk = await client.query<{ is_demo: boolean; email: string }>(
    `SELECT is_demo, email FROM users WHERE id = $1`,
    [userId]
  )
  const row = chk.rows[0]
  if (!row?.is_demo || isSeedEmail(row.email)) return

  await client.query(`DELETE FROM outcome_feedback WHERE user_id = $1`, [userId])
  await client.query(
    `DELETE FROM reviews WHERE submission_id IN (SELECT id FROM submissions WHERE user_id = $1)`,
    [userId]
  )
  await client.query(`DELETE FROM credit_transactions WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM coupon_redemptions WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM submissions WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM okr_ally_daily_usage WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM org_credit_balance WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM organization_allocations WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM user_credit_balance WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM user_profile WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM drafts WHERE user_id = $1`, [userId])
  await client.query(`DELETE FROM users WHERE id = $1`, [userId])
}

export async function deleteDemoUser(userId: string): Promise<void> {
  await withTransaction((c) => deleteDemoUserRows(c, userId))
}

/**
 * Tear down whatever a demo session touches — an individual account OR a whole
 * corporate demo org (every demo user in it, the allocations/balances, the
 * org-tagged transactions, and the org row). Idempotent and safe on unknown ids.
 */
export async function tearDownDemo(demoUserId: string): Promise<void> {
  await withTransaction(async (c) => {
    const u = await c.query<{ is_demo: boolean; email: string; organization_id: string | null }>(
      `SELECT is_demo, email, organization_id FROM users WHERE id = $1`,
      [demoUserId]
    )
    const row = u.rows[0]
    if (!row?.is_demo || isSeedEmail(row.email)) return

    let orgId: string | null = null
    if (row.organization_id) {
      const o = await c.query<{ id: string }>(
        `SELECT id FROM organizations WHERE id = $1 AND is_demo`,
        [row.organization_id]
      )
      orgId = o.rows[0]?.id ?? null
    }

    if (!orgId) {
      await deleteDemoUserRows(c, demoUserId)
      return
    }

    // Corporate: every demo user in the org, then the org's own rows.
    const members = await c.query<{ id: string }>(
      `SELECT id FROM users WHERE organization_id = $1 AND is_demo`,
      [orgId]
    )
    for (const m of members.rows) await deleteDemoUserRows(c, m.id)
    // Anything left keyed on the org (belt & suspenders — most cascaded above).
    await c.query(`DELETE FROM credit_transactions WHERE organization_id = $1`, [orgId])
    await c.query(`DELETE FROM organization_allocations WHERE organization_id = $1`, [orgId])
    await c.query(`DELETE FROM org_credit_balance WHERE organization_id = $1`, [orgId])
    await c.query(`UPDATE users SET organization_id = NULL, is_org_admin = FALSE WHERE organization_id = $1`, [orgId])
    await c.query(`DELETE FROM organizations WHERE id = $1`, [orgId])
  })
}

/**
 * Housekeeping: drop demo accounts + demo orgs older than `hours`. Best-effort.
 * Never touches the seed library account.
 */
export async function purgeExpiredDemoData(hours = 24): Promise<number> {
  const cutoff = `${hours} hours`
  const staleOrgs = await query<{ id: string }>(
    `SELECT id FROM organizations WHERE is_demo AND created_at < now() - $1::interval`,
    [cutoff]
  )
  for (const o of staleOrgs.rows) {
    const anyMember = await query<{ id: string }>(
      `SELECT id FROM users WHERE organization_id = $1 AND is_demo LIMIT 1`,
      [o.id]
    )
    try {
      if (anyMember.rows[0]) await tearDownDemo(anyMember.rows[0].id)
      else await query(`DELETE FROM organizations WHERE id = $1`, [o.id])
    } catch (err) {
      console.error('purgeExpiredDemoData: org', o.id, err)
    }
  }

  const stale = await query<{ id: string }>(
    `SELECT id FROM users
      WHERE is_demo AND email <> $1 AND organization_id IS NULL
        AND created_at < now() - $2::interval`,
    [SEED_ACCOUNT_EMAIL, cutoff]
  )
  for (const row of stale.rows) {
    try {
      await deleteDemoUser(row.id)
    } catch (err) {
      console.error('purgeExpiredDemoData: user', row.id, err)
    }
  }
  return (staleOrgs.rowCount ?? 0) + (stale.rowCount ?? 0)
}
