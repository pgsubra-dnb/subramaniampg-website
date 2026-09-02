import crypto from 'node:crypto'
import { test, expect, Page } from '@playwright/test'
import { FAIL_BASE_URL } from '../playwright.config'
import { validateReviewOutput } from '../lib/okrAllyReview'
import { PACKS } from '../lib/okrAllyBilling'
import {
  signIn,
  promoteToAdmin,
  seedCredits,
  seedProfile,
  setAdmin,
  getBalance,
  getLatestSubmission,
  getContextSnapshot,
  getCreditTransactions,
  getFeedback,
  seedCompletedReview,
  seedInvoice,
  getInvoicesForUser,
  cleanupUsers,
  cleanupOrgs,
  testGstin,
  getOrgByGstin,
  getOrgBalance,
  getUserOrgFields,
  publishOrgContext,
  getSubmissionContextSnapshot,
  seedOrg,
  makeOrgAdmin,
  joinOrg,
  getSeenWalkthroughs,
  pool,
} from './helpers'
import { resolveOrCreateUser } from '../lib/okrAlly'
import {
  fulfilCorporatePurchase,
  allocateOrgCredits,
  reclaimOrgCredits,
  getEmployeeOrgReport,
} from '../lib/okrAllyOrg'
import { grantCreditsAsAdmin, sendImprovementEmail } from '../lib/okrAllyAdmin'
import { generateStoreAndEmailReport } from '../lib/okrAllyReport'
import { getReviewForSubmission } from '../lib/okrAllySubmission'
import {
  signAdminSession,
  verifyAdminSession,
  isAdminSessionToken,
  ADMIN_SESSION_MAX_AGE_MS,
} from '../lib/okrAllySession'

// Spec 16 (corporate) calls the fulfilment/allocation libs directly, so opt
// this test process past the non-prod fulfilment guard (the webServer has it).
process.env.ALLOW_NONPROD_FULFILLMENT = '1'

const createdUsers: string[] = []
const createdGstins: string[] = []

test.afterAll(async () => {
  await cleanupUsers(createdUsers)
  await cleanupOrgs(createdGstins)
  await pool.end()
})

// ── form helpers ──────────────────────────────────────────

async function fillSimple(page: Page, value: string, button: 'Next' | 'Continue') {
  await page.locator('input[type="text"], textarea').last().fill(value)
  await page.getByRole('button', { name: button, exact: true }).last().click()
}

/**
 * Fill one context field and advance past it. Uses text specific enough that
 * Haiku returns "specific + already clear" (straight through). Falls back to
 * clicking Skip / "Keep mine" if a clarifying question or paraphrase appears.
 */
async function fillContext(page: Page, text: string, nextPrompt: RegExp) {
  await page.locator('textarea').last().fill(text)
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click()

  await expect
    .poll(
      async () => {
        if (await page.getByText(nextPrompt).count()) return 'advanced'
        if (await page.getByRole('button', { name: 'Skip' }).count()) {
          await page.getByRole('button', { name: 'Skip' }).click()
          return 'skipped-clarify'
        }
        if (await page.getByRole('button', { name: 'Keep mine' }).count()) {
          await page.getByRole('button', { name: 'Keep mine' }).click()
          return 'kept-original'
        }
        return 'waiting'
      },
      { timeout: 45_000, intervals: [500] }
    )
    .not.toBe('waiting')

  await expect(page.getByText(nextPrompt)).toBeVisible({ timeout: 20_000 })
}

// ══════════════════════════════════════════════════════════
// 0. validateReviewOutput enforces 2-3 initiatives per KR (no browser)
// ══════════════════════════════════════════════════════════
test('validateReviewOutput: KR initiative count must be 2-3 in both options', () => {
  const kr = (n: number) => ({
    text: 'Move X from 10 to 20',
    status: 'new' as const,
    initiatives: Array.from({ length: n }, (_, i) => ({ action: `Do thing ${i}`, owning_team: 'Product' })),
  })
  const build = (freshInitiatives: number) => ({
    criteria_scores: [
      { criterion: 'Outcome vs Output', score: 7, weight: 0.25, rationale: 'x' },
      { criterion: 'Alignment', score: 7, weight: 0.25, rationale: 'x' },
      { criterion: 'Measurability', score: 7, weight: 0.2, rationale: 'x' },
      { criterion: 'Specificity', score: 7, weight: 0.15, rationale: 'x' },
      { criterion: 'Ambition vs Realism', score: 7, weight: 0.15, rationale: 'x' },
    ],
    overall_score: 7,
    objective_feedback: { what_works: 'x', what_to_improve: 'x' },
    key_result_feedback: [],
    suggested_okr_options: [
      { label: 'Refined Original', objective: 'o', key_results: [kr(2)], rationale: 'r' },
      { label: 'Fresh Rewrite', objective: 'o', key_results: [kr(freshInitiatives)], rationale: 'r' },
    ],
  })

  expect(validateReviewOutput(build(2)).ok).toBe(true)
  expect(validateReviewOutput(build(3)).ok).toBe(true)
  expect(validateReviewOutput(build(1)).ok).toBe(false)
  expect(validateReviewOutput(build(4)).ok).toBe(false)
})

// ══════════════════════════════════════════════════════════
// 1. Happy path: magic link → completed report (live Claude call)
// ══════════════════════════════════════════════════════════
test('happy path: sign in, submit an OKR, get a scored report', async ({ page, context }) => {
  test.setTimeout(240_000)

  const user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)
  await seedCredits(user.userId, 1)

  await page.goto('/okr-ally')

  // name → phone → company
  await expect(page.getByText('what should I call you?')).toBeVisible()
  await fillSimple(page, 'E2E Tester', 'Next')
  await expect(page.getByText(/phone number/i)).toBeVisible()
  await page.getByRole('button', { name: 'Continue', exact: true }).click() // skip phone
  await expect(page.getByText(/name of your company/i)).toBeVisible()
  await fillSimple(page, 'Meridian Foods', 'Next')

  // three context fields — concrete text, expect straight-through
  await fillContext(
    page,
    'Meridian Foods is a 45-store regional grocery chain in the US Southeast with roughly 2,400 employees and about $310M in annual revenue. It is privately held.',
    /company right now/i
  )
  await fillContext(
    page,
    'Two national chains opened stores in our region this year and our same-store sales growth fell from 3.8% to 0.6%. The board wants us to defend market share this quarter through a materially better loyalty programme.',
    /your own role/i
  )
  await fillContext(
    page,
    'I am the Director of Loyalty and CRM. I own the loyalty programme, app content, and email and SMS campaigns, and I can direct a team of six plus an agency. I do not control store operations, pricing, or the app engineering roadmap.',
    /your Objective for this cycle/i
  )

  // objective + KRs
  await fillSimple(
    page,
    'Our best customers consolidate more of their grocery spend with us instead of splitting it with the new competitors.',
    'Next'
  )
  await expect(page.getByText(/Now your Key Results/i)).toBeVisible()
  await page.getByPlaceholder(/Raise activation rate/i).fill('Increase average monthly visits per top-tier loyalty member from 6.1 to 7.4')
  await page.getByRole('button', { name: '+ Add another Key Result' }).click()
  await page.getByPlaceholder(/Raise activation rate/i).last().fill('Grow top-tier members’ share of wallet from 60% to 66%')
  await page.getByRole('button', { name: 'Review everything' }).click()

  // confirm → submit
  await expect(page.getByText(/One review, one credit. No undo/i)).toBeVisible()
  await page.getByRole('button', { name: 'Submit for review' }).click()
  // the generating indicator shows its first timed caption
  await expect(page.getByText(/Reading your objective and the context/i)).toBeVisible()

  // report screen — shared score infographic (ring + radar + legend)
  await expect(page.getByText(/Your OKR scored/i)).toBeVisible({ timeout: 200_000 })
  await expect(page.getByText('Weighted across the five criteria')).toBeVisible()
  // per-criterion rationale + weight % are NOT shown on the user-facing report
  await expect(page.getByText('Why each criterion scored the way it did')).toHaveCount(0)
  await expect(page.getByText('Refined Original')).toBeVisible()
  await expect(page.getByText('Fresh Rewrite')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible()

  // DB side effects
  const sub = await getLatestSubmission(user.userId)
  expect(sub?.status).toBe('complete')
  expect(await getBalance(user.userId)).toBe(0)
  const txns = await getCreditTransactions(user.userId)
  expect(txns).toEqual([{ type: 'usage', amount: -1 }])

  // every rewritten KR in both options carries 2-3 initiatives (validation gate)
  const r = await pool.query<{ suggested_okr_options: OkrOption[] }>(
    `SELECT suggested_okr_options FROM reviews WHERE submission_id = $1`,
    [sub!.id]
  )
  const options = r.rows[0].suggested_okr_options
  expect(options).toHaveLength(2)
  for (const opt of options) {
    for (const kr of opt.key_results) {
      expect(kr.initiatives.length).toBeGreaterThanOrEqual(2)
      expect(kr.initiatives.length).toBeLessThanOrEqual(3)
    }
  }
})

interface OkrOption {
  label: string
  key_results: { text: string; initiatives: { action: string; owning_team: string }[] }[]
}

// ══════════════════════════════════════════════════════════
// 2. Forced-failure refund path (server :3201 has no ANTHROPIC_API_KEY)
// ══════════════════════════════════════════════════════════
test('forced failure: credit is refunded and the submission is failed_refunded', async ({ browser }) => {
  const context = await browser.newContext({ baseURL: FAIL_BASE_URL })
  const user = await signIn(context, FAIL_BASE_URL)
  createdUsers.push(user.userId)
  await seedCredits(user.userId, 1)

  const res = await context.request.post(`${FAIL_BASE_URL}/api/okr-ally/review`, {
    headers: { cookie: user.cookieHeader },
    data: {
      idempotencyKey: 'e2e-fail-' + Date.now(),
      objective: 'A perfectly valid objective that the model will never get to see',
      krs: [{ text: 'Move the metric from 10 to 20', initiatives: [] }],
      context_snapshot: {
        company_context: { final_text: 'Small B2B SaaS, 20 staff' },
        business_context: { final_text: 'Need to lift activation this quarter' },
        role_context: { final_text: 'Head of Product' },
      },
    },
  })

  expect(res.status()).toBe(502)
  const body = await res.json()
  expect(body.status).toBe('failed_refunded')
  expect(body.refunded).toBe('credit')

  const sub = await getLatestSubmission(user.userId)
  expect(sub?.status).toBe('failed_refunded')
  expect(await getBalance(user.userId)).toBe(1) // restored

  const txns = await getCreditTransactions(user.userId)
  expect(txns).toContainEqual({ type: 'usage', amount: -1 })
  expect(txns).toContainEqual({ type: 'refund_failed_generation', amount: 1 })
  expect(txns.reduce((s, t) => s + t.amount, 0)).toBe(0) // net zero

  await context.close()
})

// ══════════════════════════════════════════════════════════
// 3. Ownership: user B cannot read user A's report or invoice
// ══════════════════════════════════════════════════════════
test('ownership: report and invoice downloads are scoped to the owner', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const a = await signIn(ctxA, 'http://localhost:3200')
  const b = await signIn(ctxB, 'http://localhost:3200')
  createdUsers.push(a.userId, b.userId)

  const { submissionId } = await seedCompletedReview(a.userId)
  const { invoiceId } = await seedInvoice(a.userId)

  // owner: OK
  expect((await ctxA.request.get(`/api/okr-ally/report/${submissionId}`, { headers: { cookie: a.cookieHeader } })).status()).toBe(200)
  expect((await ctxA.request.get(`/api/okr-ally/submission/${submissionId}`, { headers: { cookie: a.cookieHeader } })).status()).toBe(200)
  expect((await ctxA.request.get(`/api/okr-ally/invoice/${invoiceId}`, { headers: { cookie: a.cookieHeader } })).status()).toBe(200)

  // other user: 404
  expect((await ctxB.request.get(`/api/okr-ally/report/${submissionId}`, { headers: { cookie: b.cookieHeader } })).status()).toBe(404)
  expect((await ctxB.request.get(`/api/okr-ally/submission/${submissionId}`, { headers: { cookie: b.cookieHeader } })).status()).toBe(404)
  expect((await ctxB.request.get(`/api/okr-ally/invoice/${invoiceId}`, { headers: { cookie: b.cookieHeader } })).status()).toBe(404)

  // unauthenticated: 401
  expect((await ctxB.request.get(`/api/okr-ally/report/${submissionId}`, { headers: { cookie: '' } })).status()).toBe(401)
  expect((await ctxB.request.get(`/api/okr-ally/invoice/${invoiceId}`, { headers: { cookie: '' } })).status()).toBe(401)

  await ctxA.close()
  await ctxB.close()
})

// ══════════════════════════════════════════════════════════
// 4. Required rating blocks feedback submission until a star is chosen
// ══════════════════════════════════════════════════════════
test('report screen: a star rating is required before feedback saves', async ({ page, context }) => {
  const user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)
  const { submissionId } = await seedCompletedReview(user.userId, 'E2E rating objective')

  await page.goto('/okr-ally')
  await page.getByRole('button', { name: 'History' }).click()
  await page.getByText('E2E rating objective').click()

  await expect(page.getByText(/How useful was this review/i)).toBeVisible()

  // submit with no rating → blocked, no DB row
  await page.getByRole('button', { name: 'Submit rating' }).click()
  await expect(page.getByText(/pick a star rating/i)).toBeVisible()
  expect(await getFeedback(user.userId)).toBeNull()

  // choose 3 stars + submit → saved
  await page.getByRole('radio', { name: '3 stars' }).click()
  await page.getByRole('button', { name: 'Submit rating' }).click()
  await expect(page.getByText(/Thanks — you rated this/i)).toBeVisible()

  const fb = await getFeedback(user.userId)
  expect(fb?.rating).toBe(3)

  // the submission still exists and is complete
  expect((await pool.query('SELECT status FROM submissions WHERE id=$1', [submissionId])).rows[0].status).toBe('complete')
})

// ══════════════════════════════════════════════════════════
// 5. Thin context → a clarifying question appears, and the snapshot records it
// ══════════════════════════════════════════════════════════
test.describe(() => {
  test.describe.configure({ retries: 1 }) // Haiku phrasing varies; one retry for robustness

  test('thin context surfaces a clarifying question and the snapshot reflects it', async ({ page, context }) => {
    test.setTimeout(240_000)

    const user = await signIn(context, 'http://localhost:3200')
    createdUsers.push(user.userId)
    await seedCredits(user.userId, 1)

    await page.goto('/okr-ally')
    await fillSimple(page, 'Thin Context Tester', 'Next')
    await page.getByRole('button', { name: 'Continue', exact: true }).click() // skip phone
    await fillSimple(page, 'Vague Co', 'Next')

    // ── deliberately thin company context ──
    const thin = 'We make business software.'
    await page.locator('textarea').last().fill(thin)
    await page.getByRole('button', { name: 'Continue', exact: true }).click()

    // a clarifying question + Skip/Send must appear
    await expect(page.getByRole('button', { name: 'Send' })).toBeVisible({ timeout: 45_000 })
    await expect(page.getByRole('button', { name: 'Skip' })).toBeVisible()
    // the thin text is echoed back as the user's message
    await expect(page.getByText(thin, { exact: true })).toBeVisible()

    // answer it
    const answer =
      'We sell a point-of-sale and inventory system to independent restaurants — about 800 locations, mostly in the US, team of 40.'
    await page.getByPlaceholder('Type your answer, or skip').fill(answer)
    await page.getByRole('button', { name: 'Send' }).click()

    // paraphrase step (or straight through if degraded) — take Ally's version
    await expect
      .poll(
        async () => {
          if (await page.getByRole('button', { name: /Use Ally/ }).count()) {
            await page.getByRole('button', { name: /Use Ally/ }).click()
            return 'confirmed'
          }
          if (await page.getByText(/company right now/i).count()) return 'advanced'
          return 'waiting'
        },
        { timeout: 45_000, intervals: [500] }
      )
      .not.toBe('waiting')
    await expect(page.getByText(/company right now/i)).toBeVisible({ timeout: 20_000 })

    // ── remaining fields, straight through ──
    await fillContext(
      page,
      'Same-store growth fell from 3% to 0.4% this year after two national competitors entered our region; the board wants market-share defence this quarter.',
      /your own role/i
    )
    await fillContext(
      page,
      'I am the Director of Loyalty. I own the loyalty programme and CRM campaigns and direct a team of six; I do not control pricing or store operations.',
      /your Objective for this cycle/i
    )
    await fillSimple(page, 'Best customers consolidate more of their spend with us rather than the new competitors.', 'Next')
    await page.getByPlaceholder(/Raise activation rate/i).fill('Increase top-tier member monthly visits from 6 to 7.3')
    await page.getByRole('button', { name: 'Review everything' }).click()
    await page.getByRole('button', { name: 'Submit for review' }).click()
    await expect(page.getByText(/Reading your objective and the context/i)).toBeVisible()
    await expect(page.getByText(/Your OKR scored/i)).toBeVisible({ timeout: 200_000 })

    // ── the snapshot records the clarify + paraphrase ──
    const sub = await getLatestSubmission(user.userId)
    expect(sub?.status).toBe('complete')
    const snap = await getContextSnapshot(sub!.id)
    const c = snap.company_context

    expect(c.raw_input).toBe(thin)
    expect(typeof c.clarifying_question).toBe('string')
    expect((c.clarifying_question ?? '').length).toBeGreaterThan(5)
    expect(c.clarifying_answer).toBe(answer)
    expect(c.paraphrase_action).toBe('confirmed')
    expect(c.paraphrase_suggested).toBeTruthy()
    expect(c.final_text).toBe(c.paraphrase_suggested)
    expect(c.final_text).not.toBe(c.raw_input)
    // business/role went straight through
    expect(snap.business_context.paraphrase_action).toMatch(/not_offered|confirmed|ignored/)
  })
})

// ══════════════════════════════════════════════════════════
// 6. Admin (expert) review screen — gate, feedback, improvement email
// ══════════════════════════════════════════════════════════
test('admin: expert feedback on both options, then a grounded improvement-email draft', async ({ page, context }) => {
  test.setTimeout(120_000)

  let user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)
  let hdr = { cookie: user.cookieHeader }

  // ── not an admin: routes 403, no Admin tab ──
  expect((await context.request.get('/api/okr-ally/admin/reviews', { headers: hdr })).status()).toBe(403)
  await page.goto('/okr-ally')
  await expect(page.getByRole('button', { name: 'History' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Admin' })).toHaveCount(0)

  // ── promote (re-mints the session as the 24h signed admin token) + seed a review ──
  user = await promoteToAdmin(context, 'http://localhost:3200', user)
  hdr = { cookie: user.cookieHeader }
  const { submissionId, reviewId } = await seedCompletedReview(user.userId, 'E2E admin objective')

  await page.reload()
  await page.getByRole('button', { name: 'Admin' }).click()
  await expect(page.getByText('E2E admin objective')).toBeVisible()

  // ── full review payload ──
  const full = await (await context.request.get(`/api/okr-ally/admin/review/${submissionId}`, { headers: hdr })).json()
  expect(full.objective).toBe('E2E admin objective')
  expect(full.review.suggestedOkrOptions.map((o: { label: string }) => o.label).sort()).toEqual([
    'Fresh Rewrite',
    'Refined Original',
  ])
  expect(full.rubricCriteria).toContain('Outcome vs Output')

  const savePanel = (label: string) =>
    context.request.post('/api/okr-ally/admin/expert-review', {
      headers: hdr,
      data: {
        reviewId,
        okrOptionLabel: label,
        rubricFeedback: { 'Outcome vs Output': `note for ${label}` },
        generalFeedback: `general for ${label}`,
        expertRating: 4,
      },
    })

  // one panel saved → improvement email refused
  expect((await savePanel('Refined Original')).status()).toBe(200)
  expect((await savePanel('Refined Original')).status()).toBe(200) // upsert, still fine
  expect(
    (await pool.query(`SELECT count(*) FROM expert_reviews WHERE review_id = $1`, [reviewId])).rows[0].count
  ).toBe('1')

  let gen = await context.request.post('/api/okr-ally/admin/improvement-email', {
    headers: hdr,
    data: { action: 'generate', reviewId },
  })
  expect(gen.status()).toBe(400)

  // both panels saved → draft generates
  expect((await savePanel('Fresh Rewrite')).status()).toBe(200)
  gen = await context.request.post('/api/okr-ally/admin/improvement-email', {
    headers: hdr,
    data: { action: 'generate', reviewId },
  })
  expect(gen.status()).toBe(200)
  const draft: string = (await gen.json()).draft
  expect(draft.trim().length).toBeGreaterThan(60)
  // grounding rule: no score / rating language
  expect(draft).not.toMatch(/\b\d\s*\/\s*10\b/)
  // word-boundary: "rating"/"score" as its own word, not inside "separating" etc.
  expect(draft).not.toMatch(/\brating\b/i)
  expect(draft).not.toMatch(/\bscored?\b/i)

  // edit + save
  const edited = draft + '\n\nPS: added by PGS.'
  expect(
    (
      await context.request.post('/api/okr-ally/admin/improvement-email', {
        headers: hdr,
        data: { action: 'save', reviewId, finalText: edited },
      })
    ).status()
  ).toBe(200)
  expect(
    (await pool.query(`SELECT final_text FROM improvement_emails WHERE review_id = $1`, [reviewId])).rows[0].final_text
  ).toBe(edited)

  await setAdmin(user.userId, false)
})

// ══════════════════════════════════════════════════════════
// 7. ₹0 first review issues a complete Tax Invoice with the discount ladder
// ══════════════════════════════════════════════════════════
test('free first review issues a ₹0 tax invoice with the full discount breakdown', async ({ context }) => {
  test.setTimeout(240_000)

  const user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)

  const res = await context.request.post('http://localhost:3200/api/okr-ally/review', {
    headers: { cookie: user.cookieHeader },
    data: {
      idempotencyKey: 'e2e-free-inv-' + Date.now(),
      couponCode: 'OKRALLY-FIRST-FREE',
      objective: 'Our best customers consolidate more of their grocery spend with us this quarter.',
      krs: [
        { text: 'Raise top-tier loyalty members’ monthly visits from 6.1 to 7.4', initiatives: [] },
        { text: 'Grow top-tier members’ share of wallet from 60% to 66%', initiatives: [] },
      ],
      context_snapshot: {
        company_context: { final_text: 'A 45-store regional grocery chain, ~2,400 staff, ~$310M revenue, privately held.' },
        business_context: { final_text: 'Two national chains entered our region; same-store growth fell from 3.8% to 0.6%. The board wants market-share defence via a better loyalty programme.' },
        role_context: { final_text: 'Director of Loyalty and CRM. I own the loyalty programme and CRM campaigns and direct a team of six; I do not control pricing or store operations.' },
      },
    },
  })
  expect(res.status()).toBe(200)
  const body = await res.json()
  expect(body.status).toBe('complete')

  // no credit was charged
  expect(await getBalance(user.userId)).toBe(0)
  expect(await getCreditTransactions(user.userId)).toEqual([{ type: 'usage', amount: 0 }])

  const sub = await getLatestSubmission(user.userId)
  const invoices = await getInvoicesForUser(user.userId)
  expect(invoices).toHaveLength(1)
  const inv = invoices[0]
  expect(inv.invoice_number).toMatch(/^OKR\/\d{2}-\d{2}\/\d{4}$/)
  expect(inv.razorpay_payment_id).toBeNull()
  expect(inv.submission_id).toBe(sub!.id)
  expect(Number(inv.list_price)).toBe(PACKS.single.basePrice)
  expect(Number(inv.discount_percent)).toBe(100)
  expect(inv.coupon_code).toBe('OKRALLY-FIRST-FREE')
  expect(Number(inv.base_amount)).toBe(0)
  expect(Number(inv.gst_amount)).toBe(0)
  expect(Number(inv.total_amount)).toBe(0)
  expect(inv.place_of_supply).toBe('Tamil Nadu') // supplier's own state (nil intra-state)
  expect(Number(inv.cgst_amount)).toBe(0)
  expect(Number(inv.sgst_amount)).toBe(0)
  expect(inv.igst_amount).toBeNull()

  // the PDF download route serves a real PDF for it
  const invId = (await pool.query<{ id: string }>(`SELECT id FROM invoices WHERE submission_id = $1`, [sub!.id])).rows[0].id
  const dl = await context.request.get(`http://localhost:3200/api/okr-ally/invoice/${invId}`, {
    headers: { cookie: user.cookieHeader },
  })
  expect(dl.status()).toBe(200)
  expect(dl.headers()['content-type']).toContain('application/pdf')
})

// ══════════════════════════════════════════════════════════
// 8. Manual admin credit grant — atomic, emails, warns on no-first-review
// ══════════════════════════════════════════════════════════
test('admin credit grant: adds credits atomically, warns when no review yet, 403 for non-admins', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  let admin = await signIn(ctxA, 'http://localhost:3200')
  const recipient = await signIn(ctxB, 'http://localhost:3200')
  createdUsers.push(admin.userId, recipient.userId)
  let hdr = { cookie: admin.cookieHeader }

  // non-admin → 403
  expect(
    (await ctxA.request.post('/api/okr-ally/admin/grant-credits', { headers: hdr, data: { email: recipient.email, credits: 2 } })).status()
  ).toBe(403)

  admin = await promoteToAdmin(ctxA, 'http://localhost:3200', admin)
  hdr = { cookie: admin.cookieHeader }

  // unknown email → 400
  expect(
    (await ctxA.request.post('/api/okr-ally/admin/grant-credits', { headers: hdr, data: { email: 'nobody-' + Date.now() + '@example.com', credits: 2 } })).status()
  ).toBe(400)

  // real grant → 200, warning (recipient has no completed review), balance +3
  const res = await ctxA.request.post('/api/okr-ally/admin/grant-credits', {
    headers: hdr,
    data: { email: recipient.email, credits: 3, note: 'goodwill' },
  })
  expect(res.status()).toBe(200)
  const j = await res.json()
  expect(j.ok).toBe(true)
  expect(j.creditsRemaining).toBe(3)
  expect(j.warning).toBeTruthy()

  expect(await getBalance(recipient.userId)).toBe(3)
  const txns = await getCreditTransactions(recipient.userId)
  expect(txns).toContainEqual({ type: 'admin_grant', amount: 3 })

  await ctxA.close()
  await ctxB.close()
})

// ══════════════════════════════════════════════════════════
// 9. Admin list — company / email filters + pagination
// ══════════════════════════════════════════════════════════
test('admin list: company and email filters narrow results, pagination is honoured', async ({ context }) => {
  let admin = await signIn(context, 'http://localhost:3200')
  createdUsers.push(admin.userId)
  admin = await promoteToAdmin(context, 'http://localhost:3200', admin)
  const hdr = { cookie: admin.cookieHeader }

  // two more users, each with a completed review + a distinct company on their profile
  const tag = Date.now()
  const others: string[] = []
  for (const c of [`AcmeFoods${tag}`, `BorealisLabs${tag}`]) {
    const u = await signIn(context, 'http://localhost:3200')
    createdUsers.push(u.userId)
    others.push(u.userId)
    await seedCompletedReview(u.userId, `Objective for ${c}`)
    await pool.query(
      `INSERT INTO user_profile (user_id, company_name) VALUES ($1, $2)
       ON CONFLICT (user_id) DO UPDATE SET company_name = EXCLUDED.company_name`,
      [u.userId, c]
    )
  }
  const emailOfFirst = (await pool.query<{ email: string }>(`SELECT email FROM users WHERE id = $1`, [others[0]])).rows[0].email

  // company filter
  const byCompany = await (await context.request.get(`/api/okr-ally/admin/reviews?company=AcmeFoods${tag}`, { headers: hdr })).json()
  expect(byCompany.items).toHaveLength(1)
  expect(byCompany.items[0].companyName).toBe(`AcmeFoods${tag}`)

  // email filter
  const byEmail = await (await context.request.get(`/api/okr-ally/admin/reviews?email=${encodeURIComponent(emailOfFirst)}`, { headers: hdr })).json()
  expect(byEmail.items).toHaveLength(1)
  expect(byEmail.items[0].userEmail).toBe(emailOfFirst)

  // pagination across the two seeded objectives
  const p1 = await (await context.request.get(`/api/okr-ally/admin/reviews?q=Objective for &pageSize=1&page=1`, { headers: hdr })).json()
  const p2 = await (await context.request.get(`/api/okr-ally/admin/reviews?q=Objective for &pageSize=1&page=2`, { headers: hdr })).json()
  expect(p1.total).toBeGreaterThanOrEqual(2)
  expect(p1.items).toHaveLength(1)
  expect(p2.items).toHaveLength(1)
  expect(p1.items[0].submissionId).not.toBe(p2.items[0].submissionId)
})

// ══════════════════════════════════════════════════════════
// 10. Returning user with a full profile — summary screen, not step-by-step
// ══════════════════════════════════════════════════════════
const FULL_PROFILE = {
  name: 'Return Visitor',
  companyName: 'Meridian Foods',
  companyContext:
    'Meridian Foods is a 45-store regional grocery chain in the US Southeast, ~2,400 employees, ~$310M annual revenue, privately held.',
  businessContext:
    'Two national chains entered our region this year; same-store sales growth fell from 3.8% to 0.6%. The board wants market-share defence this quarter through a better loyalty programme.',
  roleContext:
    'I am the Director of Loyalty and CRM. I own the loyalty programme, app content, and email/SMS campaigns and direct a team of six plus an agency. I do not control store operations or pricing.',
}

/** Record every context-pipeline call the page makes, with its `field`. */
function trackContextCalls(page: Page) {
  const calls: { path: string; field: string }[] = []
  page.on('request', (req) => {
    const u = req.url()
    if (u.includes('/api/okr-ally/context/')) {
      let field = ''
      try {
        field = JSON.parse(req.postData() || '{}').field || ''
      } catch {
        /* ignore */
      }
      calls.push({ path: u.includes('/assess') ? 'assess' : u.includes('/paraphrase') ? 'paraphrase' : 'other', field })
    }
  })
  return calls
}

test('returning user: sees the profile summary, and unchanged fields skip the pipeline entirely', async ({ page, context }) => {
  test.setTimeout(120_000)
  const user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)
  await seedProfile(user.userId, FULL_PROFILE)
  await seedCredits(user.userId, 1)

  const calls = trackContextCalls(page)
  await page.goto('/okr-ally')

  // the summary screen, NOT the first step of the step-by-step flow
  await expect(page.getByText(/what I have on file/i)).toBeVisible()
  await expect(page.getByText('what should I call you?')).toHaveCount(0)
  await expect(page.getByText('Company context')).toBeVisible()
  await expect(page.getByText('Business context')).toBeVisible()
  await expect(page.getByText('Your role')).toBeVisible()
  await expect(page.getByText('Meridian Foods', { exact: true })).toBeVisible()

  // continue with nothing changed → straight to the objective step
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await expect(page.getByText(/your Objective for this cycle/i)).toBeVisible()

  // and NOT a single assess/paraphrase call was made
  expect(calls).toEqual([])
})

test('returning user: editing one context field re-runs the pipeline for that field only', async ({ page, context }) => {
  test.setTimeout(180_000)
  const user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)
  await seedProfile(user.userId, FULL_PROFILE)
  await seedCredits(user.userId, 1)

  const calls = trackContextCalls(page)
  await page.goto('/okr-ally')
  await expect(page.getByText(/what I have on file/i)).toBeVisible()

  // open "Business context" (4th field: name, phone, company, company-ctx, business-ctx, role)
  await page.getByRole('button', { name: 'Edit' }).nth(4).click()
  await page.locator('textarea').last().fill(
    'A national competitor just acquired our second-largest regional rival, so consolidation pressure jumped sharply this quarter; the board now wants a defensible loyalty moat, not just parity.'
  )
  await page.getByRole('button', { name: 'Continue', exact: true }).click()

  // now on the business context step — submit it and walk any clarify/paraphrase
  await page.getByRole('button', { name: 'Continue', exact: true }).last().click()
  await expect
    .poll(
      async () => {
        if (await page.getByText(/your Objective for this cycle/i).count()) return 'done'
        if (await page.getByRole('button', { name: 'Skip' }).count()) {
          await page.getByRole('button', { name: 'Skip' }).click()
          return 'step'
        }
        if (await page.getByRole('button', { name: /Use Ally/ }).count()) {
          await page.getByRole('button', { name: /Use Ally/ }).click()
          return 'step'
        }
        if (await page.getByRole('button', { name: 'Keep mine' }).count()) {
          await page.getByRole('button', { name: 'Keep mine' }).click()
          return 'step'
        }
        return 'wait'
      },
      { timeout: 60_000, intervals: [500] }
    )
    .not.toBe('wait')
  await expect(page.getByText(/your Objective for this cycle/i)).toBeVisible({ timeout: 20_000 })

  // the pipeline ran for `business` and for nothing else
  expect(calls.length).toBeGreaterThan(0)
  expect(calls.every((c) => c.field === 'business')).toBe(true)
  expect(calls.some((c) => c.path === 'assess')).toBe(true)
})

test('first-time user (no profile) still gets the step-by-step flow', async ({ page, context }) => {
  const user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)

  await page.goto('/okr-ally')
  await expect(page.getByText('what should I call you?')).toBeVisible()
  await expect(page.getByText(/what I have on file/i)).toHaveCount(0)
})

// ══════════════════════════════════════════════════════════
// 14. Custom PWA install banner is wired to beforeinstallprompt
// ══════════════════════════════════════════════════════════
test('install banner: appears on beforeinstallprompt and calls prompt() on click', async ({ page }) => {
  test.setTimeout(90_000)
  // Chromium under Playwright never fires beforeinstallprompt itself, so
  // dispatch a synthetic one carrying a spy prompt()/userChoice — this proves
  // the listener is genuinely wired and the button acts on the stashed event.
  await page.goto('/okr-ally')
  // wait for hydration (the client component + its effect must be mounted)
  await expect(page.getByRole('button', { name: /Say hi to Ally/i })).toBeVisible({ timeout: 45_000 })

  // not shown before any event
  await expect(page.getByRole('button', { name: 'Install', exact: true })).toHaveCount(0)

  await page.evaluate(() => {
    const e: Event & { prompt?: () => Promise<void>; userChoice?: Promise<unknown> } = new Event('beforeinstallprompt', {
      cancelable: true,
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(window as any).__promptCalled = 0
    e.prompt = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(window as any).__promptCalled++
      return Promise.resolve()
    }
    e.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' })
    window.dispatchEvent(e)
  })

  const installBtn = page.getByRole('button', { name: 'Install', exact: true })
  await expect(installBtn).toBeVisible()
  await expect(page.getByText(/Install OKR Ally for one-tap access/i)).toBeVisible()

  await installBtn.click()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expect(await page.evaluate(() => (window as any).__promptCalled)).toBe(1)
  // banner dismisses itself after the prompt resolves
  await expect(installBtn).toHaveCount(0)
})

// ══════════════════════════════════════════════════════════
// 15. "How it works" walkthrough — reachable before sign-in
// ══════════════════════════════════════════════════════════
test('walkthrough: intro → step every slide → CTA lands on the email gate', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/okr-ally')
  await expect(page.getByRole('button', { name: /See how it works/i })).toBeVisible({ timeout: 45_000 })

  await page.getByRole('button', { name: /See how it works/i }).click()
  await expect(page.getByRole('heading', { name: 'How OKR Ally works' })).toBeVisible()
  await expect(page.getByText('1 / 10')).toBeVisible()
  await expect(page.getByText(/This is the front door/i)).toBeVisible()

  // ← Back returns to the intro
  await page.getByRole('button', { name: '← Back' }).click()
  await expect(page.getByRole('button', { name: /Say hi to Ally/i })).toBeVisible()

  // re-open and step through every slide with Next — the slides follow the real
  // conversation order (intro → sign-in → context → objective → KRs → confirm → report)
  await page.getByRole('button', { name: /See how it works/i }).click()
  for (let i = 1; i < 10; i++) {
    await expect(page.getByText(`${i} / 10`)).toBeVisible()
    await page.getByRole('button', { name: 'Next', exact: true }).click()
  }
  await expect(page.getByText('10 / 10')).toBeVisible()

  // no good-vs-bad comparison slides any more — every slide before the CTA is a
  // real product screenshot
  await page.getByRole('button', { name: 'Back', exact: true }).click() // slide 9 — the report
  await expect(page.getByText(/an overall score, how it breaks down across the five criteria/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: /vs a strong one|vs a full one|vs a specified one/i })).toHaveCount(0)
  await page.getByRole('button', { name: 'Next', exact: true }).click()

  // final slide CTA → email gate
  await page.getByRole('button', { name: /Start my free review/i }).click()
  await expect(page.getByPlaceholder('you@company.com')).toBeVisible()
})

// ══════════════════════════════════════════════════════════
// 16. Corporate credits — purchase, allocate/reclaim, org-first deduction,
//     access control, report isolation, existing-account safety.
// ══════════════════════════════════════════════════════════

const rzId = (p: string) => `${p}_${(Math.random().toString(36) + '0'.repeat(14)).slice(2, 16)}`

function corpFulfil(o: {
  purchaserUserId: string
  purchaserEmail?: string
  gstin: string
  adminEmail: string
  companyName?: string
  credits?: number
  razorpayPaymentId?: string
  placeOfSupply?: string
}) {
  return fulfilCorporatePurchase({
    purchaserUserId: o.purchaserUserId,
    purchaserName: 'Buyer',
    purchaserEmail: o.purchaserEmail ?? 'okr-e2e-buyer@example.com',
    adminEmail: o.adminEmail,
    companyName: o.companyName ?? 'Test Corp LLP',
    gstin: o.gstin,
    registeredAddress: '1 Test Road, Bengaluru, Karnataka 560001',
    placeOfSupply: o.placeOfSupply ?? 'Karnataka',
    credits: o.credits ?? 100,
    listPrice: 6000,
    baseAmount: 6000,
    gstAmount: 1080,
    totalAmount: 7080,
    razorpayPaymentId: o.razorpayPaymentId ?? rzId('pay'),
    razorpayOrderId: rzId('order'),
  })
}

test('corporate: purchase creates org + admin + company invoice; same GSTIN tops up', async ({ context }) => {
  test.setTimeout(120_000)
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-orgadmin-${Date.now()}@example.com`

  const r1 = await corpFulfil({ purchaserUserId: buyer.userId, purchaserEmail: buyer.email, gstin, adminEmail, credits: 100 })
  expect(r1.ok).toBe(true)
  expect(r1.alreadyProcessed).toBe(false)

  const org = await getOrgByGstin(gstin)
  expect(org).toBeTruthy()
  expect(org!.credits_purchased).toBe(100)

  const admin = await resolveOrCreateUser(adminEmail)
  createdUsers.push(admin.id)
  const af = await getUserOrgFields(admin.id)
  expect(af.is_org_admin).toBe(true)
  expect(af.organization_id).toBe(org!.id)

  const inv = await pool.query(`SELECT gstin, buyer_address, total_amount FROM invoices WHERE user_id = $1`, [buyer.userId])
  expect(inv.rows).toHaveLength(1)
  expect(inv.rows[0].gstin).toBe(gstin)
  expect(inv.rows[0].buyer_address).toContain('Test Road')
  expect(Number(inv.rows[0].total_amount)).toBe(7080)

  // fresh payment id, SAME gstin → top up, not a duplicate org
  const r2 = await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 200 })
  expect(r2.alreadyProcessed).toBe(false)
  expect((await getOrgByGstin(gstin))!.credits_purchased).toBe(300)
  const n = await pool.query(`SELECT count(*) c FROM organizations WHERE gstin = $1`, [gstin])
  expect(Number(n.rows[0].c)).toBe(1)
  expect(r1.invoiceUnissued).toBe(false)
})

test('corporate: an invoice failure flags the ledger + returns invoiceUnissued; pool + admin tag still fine', async ({ context }) => {
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-invfail-${Date.now()}@example.com`
  const payId = rzId('pay')

  // an unknown place of supply makes createAndSendInvoice soft-fail
  const r = await corpFulfil({
    purchaserUserId: buyer.userId,
    gstin,
    adminEmail,
    credits: 100,
    razorpayPaymentId: payId,
    placeOfSupply: 'Nowhereland',
  })
  expect(r.ok).toBe(true)
  expect(r.invoiceUnissued).toBe(true)

  // pool + admin tag are correct regardless
  expect((await getOrgByGstin(gstin))!.credits_purchased).toBe(100)
  const admin = await resolveOrCreateUser(adminEmail)
  createdUsers.push(admin.id)
  expect((await getUserOrgFields(admin.id)).is_org_admin).toBe(true)

  // no invoice row, and the ledger row is stamped for recovery
  expect((await pool.query(`SELECT 1 FROM invoices WHERE razorpay_payment_id=$1`, [payId])).rows).toHaveLength(0)
  const txn = await pool.query<{ note: string | null }>(
    `SELECT note FROM credit_transactions WHERE razorpay_payment_id=$1 AND type='org_purchase'`,
    [payId]
  )
  expect(txn.rows[0].note).toContain('INVOICE NOT ISSUED')
})

test('corporate: buyer ≠ admin — the admin gets the "you\'re the admin" email, BCC to PGS', async ({ context }) => {
  test.setTimeout(120_000)
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-adminnote-${Date.now()}@example.com` // deliberately NOT the buyer

  // Capture Brevo API calls without a real key/inbox: stub only api.brevo.com,
  // pass everything else (Sanity, Blob) through to the real fetch.
  const realFetch = global.fetch
  const brevo: { to: string; bcc: string[]; subject: string; html: string; text: string }[] = []
  process.env.BREVO_API_KEY = 'stub-key-for-capture'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.fetch = (async (url: any, opts: any) => {
    if (String(url).includes('api.brevo.com')) {
      const p = JSON.parse(opts.body)
      brevo.push({
        to: p.to?.[0]?.email,
        bcc: (p.bcc ?? []).map((b: { email: string }) => b.email),
        subject: p.subject,
        html: p.htmlContent ?? '',
        text: p.textContent ?? '',
      })
      return new Response(JSON.stringify({ messageId: 'stub' }), { status: 201 })
    }
    return realFetch(url, opts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any

  let r
  try {
    r = await corpFulfil({
      purchaserUserId: buyer.userId,
      purchaserEmail: buyer.email,
      gstin,
      adminEmail,
      companyName: 'Northwind Trading LLP',
      credits: 200,
    })
  } finally {
    global.fetch = realFetch
    delete process.env.BREVO_API_KEY
  }
  createdUsers.push((await resolveOrCreateUser(adminEmail)).id)

  expect(r.ok).toBe(true)
  expect(r.adminNotified).toBe(true)
  expect(r.invoiceUnissued).toBe(false)

  // the admin-notification email
  const note = brevo.find((e) => e.to === adminEmail)
  expect(note, `expected a Brevo email to ${adminEmail}; got ${JSON.stringify(brevo.map((e) => e.to))}`).toBeTruthy()
  expect(note!.bcc).toContain('pgs@embiggen.co.in') // PGS copied, no skipBcc
  expect(note!.subject).toContain('Northwind Trading LLP')
  expect(note!.text).toContain('200') // pool size
  expect(note!.text).toContain('subramaniampg.guru/okr-ally') // sign-in link
  expect(note!.text).toMatch(/Company tab/i)

  // and the GST invoice went to the buyer, also BCC PGS (unchanged behaviour)
  const invMail = brevo.find((e) => e.to === buyer.email && /Tax invoice/i.test(e.subject))
  expect(invMail).toBeTruthy()
  expect(invMail!.bcc).toContain('pgs@embiggen.co.in')
})

test('email BCC scope: invoice + payment emails copy PGS; the other five do not', async ({ context }) => {
  test.setTimeout(180_000)

  // Same in-process Brevo capture as the corporate admin-email test — these
  // paths call the send functions directly, so a fetch stub here is enough.
  const realFetch = global.fetch
  const brevo: { to: string; bcc: string[]; subject: string }[] = []
  process.env.BREVO_API_KEY = 'stub-key-for-capture'
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  global.fetch = (async (url: any, opts: any) => {
    if (String(url).includes('api.brevo.com')) {
      const p = JSON.parse(opts.body)
      brevo.push({
        to: p.to?.[0]?.email,
        bcc: (p.bcc ?? []).map((b: { email: string }) => b.email),
        subject: p.subject,
      })
      return new Response(JSON.stringify({ messageId: 'stub' }), { status: 201 })
    }
    return realFetch(url, opts)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any

  const pgs = 'pgs@embiggen.co.in'
  const bccFor = (re: RegExp) => {
    const hit = brevo.find((e) => re.test(e.subject))
    expect(hit, `no captured email matching ${re} — got ${JSON.stringify(brevo.map((e) => e.subject))}`).toBeTruthy()
    return hit!.bcc
  }

  const admin = await signIn(context, 'http://localhost:3200')
  createdUsers.push(admin.userId)

  try {
    await setAdmin(admin.userId, true)
    const adminUser = await resolveOrCreateUser(admin.email)

    // ── REMOVE 1: the review-ready email ────────────────────────────────
    const seeded = await seedCompletedReview(admin.userId, 'BCC-scope objective')
    const stored = await getReviewForSubmission(seeded.submissionId)
    await generateStoreAndEmailReport({
      reviewId: seeded.reviewId,
      submissionId: seeded.submissionId,
      userName: adminUser.name,
      userEmail: adminUser.email,
      objective: 'BCC-scope objective',
      krs: [{ text: 'Seed KR from 10 to 20', initiatives: [] }],
      contextSnapshot: {},
      review: stored!.review,
    })

    // ── REMOVE 2: PGS's personal "A note on your OKR" ───────────────────
    await pool.query(
      `INSERT INTO improvement_emails (review_id, draft_text) VALUES ($1, $2)
       ON CONFLICT (review_id) DO UPDATE SET draft_text = EXCLUDED.draft_text`,
      [seeded.reviewId, 'A short personal note about your OKR from PGS.']
    )
    const noteRes = await sendImprovementEmail(adminUser, seeded.reviewId)
    expect(noteRes.sent).toBe(true)

    // ── REMOVE 3: the admin credit-grant notification ───────────────────
    const granteeEmail = `okr-e2e-bccgrant-${Date.now()}@example.com`
    const grantee = await resolveOrCreateUser(granteeEmail)
    createdUsers.push(grantee.id)
    const grant = await grantCreditsAsAdmin(adminUser, { email: granteeEmail, credits: 2, note: 'e2e' })
    expect(grant.ok).toBe(true)

    // ── REMOVE 4 + KEEP: corporate purchase (invoice + "you're the admin")
    //    then REMOVE 5: an org allocation ────────────────────────────────
    const gstin = testGstin()
    createdGstins.push(gstin)
    const corpAdminEmail = `okr-e2e-bccadmin-${Date.now()}@example.com`
    const fulfil = await corpFulfil({
      purchaserUserId: admin.userId,
      purchaserEmail: admin.email,
      gstin,
      adminEmail: corpAdminEmail,
      companyName: 'BCC Scope LLP',
      credits: 100,
    })
    expect(fulfil.ok).toBe(true)
    const corpAdmin = await resolveOrCreateUser(corpAdminEmail)
    createdUsers.push(corpAdmin.id)
    const empEmail = `okr-e2e-bccemp-${Date.now()}@example.com`
    const alloc = await allocateOrgCredits(corpAdmin, { email: empEmail, credits: 3 })
    expect(alloc.ok).toBe(true)
    createdUsers.push((await resolveOrCreateUser(empEmail)).id)
  } finally {
    global.fetch = realFetch
    delete process.env.BREVO_API_KEY
    await setAdmin(admin.userId, false).catch(() => {})
  }

  // KEEP — money landed:
  expect(bccFor(/^Tax invoice /)).toContain(pgs)
  expect(bccFor(/you're the OKR Ally admin for/i)).toContain(pgs)

  // REMOVE — not a payment event:
  expect(bccFor(/^Your OKR Ally review$/)).not.toContain(pgs)
  expect(bccFor(/^A note on your OKR/)).not.toContain(pgs)
  expect(bccFor(/added to your OKR Ally account$/)).not.toContain(pgs)
  expect(bccFor(/OKR Ally review credits? from /i)).not.toContain(pgs)
})

test('corporate: fulfilment is idempotent on the payment id', async ({ context }) => {
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-orgadmin2-${Date.now()}@example.com`
  const payId = rzId('pay')
  await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 200, razorpayPaymentId: payId })
  const dup = await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 200, razorpayPaymentId: payId })
  expect(dup.alreadyProcessed).toBe(true)
  expect((await getOrgByGstin(gstin))!.credits_purchased).toBe(200)
  createdUsers.push((await resolveOrCreateUser(adminEmail)).id)
})

test('corporate: allocate then reclaim, exact org-specific figures both ways', async ({ context }) => {
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-cadmin-${Date.now()}@example.com`
  await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 100 })
  const admin = await resolveOrCreateUser(adminEmail)
  createdUsers.push(admin.id)
  const org = (await getOrgByGstin(gstin))!

  const empEmail = `okr-e2e-emp-${Date.now()}@example.com`
  const alloc = await allocateOrgCredits(admin, { email: empEmail, credits: 5 })
  expect(alloc.ok).toBe(true)
  const emp = await resolveOrCreateUser(empEmail)
  createdUsers.push(emp.id)

  expect(await getOrgBalance(emp.id, org.id)).toBe(5)
  let o = await getOrgByGstin(gstin)
  expect(o!.credits_allocated).toBe(5)
  expect(o!.credits_purchased - o!.credits_allocated).toBe(95)
  const ef = await getUserOrgFields(emp.id)
  expect(ef.organization_id).toBe(org.id) // tagged with the org
  expect(ef.is_org_admin).toBe(false) // but NOT an admin

  const rec = await reclaimOrgCredits(admin, { email: empEmail })
  expect(rec.ok && rec.reclaimed).toBe(5)
  expect(await getOrgBalance(emp.id, org.id)).toBe(0)
  o = await getOrgByGstin(gstin)
  expect(o!.credits_allocated).toBe(0)
  const led = await pool.query(
    `SELECT credits_allocated FROM organization_allocations WHERE organization_id=$1 AND lower(email)=lower($2) ORDER BY allocated_at`,
    [org.id, empEmail]
  )
  expect(led.rows.map((r) => r.credits_allocated)).toEqual([5, -5])
})

test('corporate: a review spends the org balance first, personal untouched until org is empty', async ({ context }) => {
  test.setTimeout(300_000)
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-dadmin-${Date.now()}@example.com`
  await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 100 })
  const admin = await resolveOrCreateUser(adminEmail)
  createdUsers.push(admin.id)
  const org = (await getOrgByGstin(gstin))!

  const emp = await signIn(context, 'http://localhost:3200', `okr-e2e-both-${Date.now()}@example.com`)
  createdUsers.push(emp.userId)
  await seedCredits(emp.userId, 2)
  await allocateOrgCredits(admin, { email: emp.email, credits: 2 })
  await publishOrgContext(org.id, 'Org company context for deduction test.', 'Org business context for deduction test.')
  expect(await getOrgBalance(emp.userId, org.id)).toBe(2)

  const body = {
    objective: 'New enterprise customers reach production use without a services engagement.',
    krs: [{ text: 'Raise 60-day activation from 44% to 70%', initiatives: [] }],
    context_snapshot: {
      company_context: { final_text: 'A 60-person infra SaaS, ~$7M ARR, Series A, ~400 mid-market customers.' },
      business_context: { final_text: 'Board goal is NRR 104% to 115%; the compliance module is the retention lever.' },
      role_context: { final_text: 'VP Customer Success; I own onboarding and renewals, not pricing or the roadmap.' },
    },
  }
  const review = async (n: number) => {
    const r = await context.request.post('http://localhost:3200/api/okr-ally/review', {
      headers: { cookie: emp.cookieHeader },
      data: { idempotencyKey: `e2e-orgded-${Date.now()}-${n}`, ...body },
    })
    const j = await r.json()
    expect(r.status(), JSON.stringify(j)).toBe(200)
    expect(j.status).toBe('complete')
  }

  await review(1)
  expect(await getOrgBalance(emp.userId, org.id)).toBe(1)
  expect(await getBalance(emp.userId)).toBe(2)

  await review(2)
  expect(await getOrgBalance(emp.userId, org.id)).toBe(0)
  expect(await getBalance(emp.userId)).toBe(2)

  await review(3) // org empty → personal
  expect(await getOrgBalance(emp.userId, org.id)).toBe(0)
  expect(await getBalance(emp.userId)).toBe(1)

  const usage = await pool.query(
    `SELECT organization_id FROM credit_transactions WHERE user_id=$1 AND type='usage' ORDER BY created_at`,
    [emp.userId]
  )
  expect(usage.rows.map((r) => (r.organization_id ? 'org' : 'personal'))).toEqual(['org', 'org', 'personal'])
})

test('corporate: org routes 403 for a non-admin employee of the same org', async ({ context }) => {
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-gadmin-${Date.now()}@example.com`
  await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 100 })
  const admin = await resolveOrCreateUser(adminEmail)
  createdUsers.push(admin.id)

  const emp = await signIn(context, 'http://localhost:3200', `okr-e2e-nonadmin-${Date.now()}@example.com`)
  createdUsers.push(emp.userId)
  await allocateOrgCredits(admin, { email: emp.email, credits: 2 })

  for (const path of ['org/status', 'org/report?email=x%40y.com']) {
    const r = await context.request.get(`http://localhost:3200/api/okr-ally/${path}`, { headers: { cookie: emp.cookieHeader } })
    expect(r.status()).toBe(403)
  }
  const alloc = await context.request.post('http://localhost:3200/api/okr-ally/org/allocate', {
    headers: { cookie: emp.cookieHeader },
    data: { email: 'x@y.com', credits: 1 },
  })
  expect(alloc.status()).toBe(403)

  const me = await (
    await context.request.get('http://localhost:3200/api/okr-ally/me', { headers: { cookie: emp.cookieHeader } })
  ).json()
  expect(me.user.isOrgAdmin).toBe(false)

  const adminSession = await signIn(context, 'http://localhost:3200', adminEmail)
  const ok = await context.request.get('http://localhost:3200/api/okr-ally/org/status', { headers: { cookie: adminSession.cookieHeader } })
  expect(ok.status()).toBe(200)
})

test('corporate: report is org-scoped; a pre-existing personal account is left fully intact', async ({ context }) => {
  test.setTimeout(180_000)
  const emp = await signIn(context, 'http://localhost:3200', `okr-e2e-existing-${Date.now()}@example.com`)
  createdUsers.push(emp.userId)
  await seedCredits(emp.userId, 4)
  await seedProfile(emp.userId, {
    name: 'Existing Person',
    companyName: 'Their Co',
    companyContext: 'ctx a',
    businessContext: 'ctx b',
    roleContext: 'ctx c',
  })
  const { submissionId } = await seedCompletedReview(emp.userId, 'A pre-existing objective of theirs')
  const balBefore = await getBalance(emp.userId)
  const profBefore = (await pool.query(`SELECT * FROM user_profile WHERE user_id=$1`, [emp.userId])).rows[0]

  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-radmin-${Date.now()}@example.com`
  await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 100 })
  const admin = await resolveOrCreateUser(adminEmail)
  createdUsers.push(admin.id)
  await allocateOrgCredits(admin, { email: emp.email, credits: 10 })

  expect(await getBalance(emp.userId)).toBe(balBefore)
  expect((await pool.query(`SELECT * FROM user_profile WHERE user_id=$1`, [emp.userId])).rows[0]).toEqual(profBefore)
  expect((await pool.query(`SELECT id FROM submissions WHERE id=$1`, [submissionId])).rows).toHaveLength(1)

  const rep = await getEmployeeOrgReport(admin, emp.email)
  expect(rep).toBeTruthy()
  expect({ allocated: rep!.allocated, used: rep!.used, remaining: rep!.remaining, reclaimed: rep!.reclaimed }).toEqual({
    allocated: 10,
    used: 0,
    remaining: 10,
    reclaimed: 0,
  })

  const adminSession = await signIn(context, 'http://localhost:3200', adminEmail)
  const dl = await context.request.get(
    `http://localhost:3200/api/okr-ally/org/report/pdf?email=${encodeURIComponent(emp.email)}`,
    { headers: { cookie: adminSession.cookieHeader } }
  )
  expect(dl.status()).toBe(200)
  expect(dl.headers()['content-type']).toContain('application/pdf')
})

// ══════════════════════════════════════════════════════════
// 17. Admin-only 24h signed session + admin-unlimited reviews
// ══════════════════════════════════════════════════════════
test('admin session token: signature + 24h window cannot be forged', () => {
  const uid = crypto.randomUUID()
  const good = signAdminSession(uid)
  expect(isAdminSessionToken(good)).toBe(true)
  expect(verifyAdminSession(good)?.userId).toBe(uid)

  // just under 24h → valid; just over → expired
  expect(verifyAdminSession(signAdminSession(uid, Date.now() - (ADMIN_SESSION_MAX_AGE_MS - 60_000)))?.userId).toBe(uid)
  expect(verifyAdminSession(signAdminSession(uid, Date.now() - (ADMIN_SESSION_MAX_AGE_MS + 60_000)))).toBeNull()

  const [, iat, sig] = good.split('.')
  // swap the user id, keep the signature → rejected
  expect(verifyAdminSession(`${crypto.randomUUID()}.${iat}.${sig}`)).toBeNull()
  // roll issuedAt forward to "now", keep the stale signature → rejected
  expect(verifyAdminSession(`${uid}.${Date.now()}.${sig}`)).toBeNull()
  // a correctly-signed token that claims a future issuedAt → rejected
  expect(verifyAdminSession(signAdminSession(uid, Date.now() + 10 * 60_000))).toBeNull()
  // garbage / a bare uuid
  expect(verifyAdminSession('not-a-token')).toBeNull()
  expect(verifyAdminSession(uid)).toBeNull()
})

test('session: admin gets a 24h signed cookie; a regular user keeps the 7d bare-id cookie', async ({ browser }) => {
  const ctxAdmin = await browser.newContext()
  const ctxUser = await browser.newContext()
  const admin = await signIn(ctxAdmin, 'http://localhost:3200', undefined, { admin: true })
  const user = await signIn(ctxUser, 'http://localhost:3200')
  createdUsers.push(admin.userId, user.userId)

  expect(isAdminSessionToken(admin.sessionValue)).toBe(true)
  expect(verifyAdminSession(admin.sessionValue)?.userId).toBe(admin.userId)
  expect(isAdminSessionToken(user.sessionValue)).toBe(false)
  expect(user.sessionValue).toBe(user.userId) // unchanged scheme for regular users

  const hrsLeft = (c: { expires: number }) => (c.expires * 1000 - Date.now()) / 3_600_000
  const adminCookie = (await ctxAdmin.cookies()).find((c) => c.name === 'okr_ally_session')!
  const userCookie = (await ctxUser.cookies()).find((c) => c.name === 'okr_ally_session')!
  expect(hrsLeft(adminCookie)).toBeGreaterThan(23)
  expect(hrsLeft(adminCookie)).toBeLessThan(25)
  expect(hrsLeft(userCookie)).toBeGreaterThan(24 * 6.5) // ~7 days

  const meAdmin = await (await ctxAdmin.request.get('/api/okr-ally/me')).json()
  expect(meAdmin).toMatchObject({ authenticated: true, user: { isAdmin: true } })
  const meUser = await (await ctxUser.request.get('/api/okr-ally/me')).json()
  expect(meUser).toMatchObject({ authenticated: true, user: { isAdmin: false } })

  await ctxAdmin.close()
  await ctxUser.close()
})

test('session: an admin account is unusable with a bare-id, expired, or tampered cookie (no bypass)', async ({ browser }) => {
  const ctx = await browser.newContext()
  const admin = await signIn(ctx, 'http://localhost:3200', undefined, { admin: true })
  createdUsers.push(admin.userId)

  const authedWith = async (value: string) => {
    const r = await ctx.request.get('/api/okr-ally/me', {
      headers: { cookie: `okr_ally_session=${value}` },
    })
    return (await r.json()).authenticated === true
  }

  expect(await authedWith(admin.sessionValue)).toBe(true) // the real signed token
  expect(await authedWith(admin.userId)).toBe(false) // bare id for an admin → NO
  expect(
    await authedWith(signAdminSession(admin.userId, Date.now() - (ADMIN_SESSION_MAX_AGE_MS + 3_600_000)))
  ).toBe(false) // 25h old
  const [, , sig] = admin.sessionValue.split('.')
  expect(await authedWith(`${admin.userId}.${Date.now()}.${sig}`)).toBe(false) // rolled-forward iat, stale sig

  await ctx.close()
})

test('admin unlimited: an admin with zero credits gets a full review, logged as admin_unlimited (amount 0)', async ({ context }) => {
  test.setTimeout(240_000)
  const admin = await signIn(context, 'http://localhost:3200', undefined, { admin: true })
  createdUsers.push(admin.userId)
  expect(await getBalance(admin.userId)).toBe(0)

  const res = await context.request.post('/api/okr-ally/review', {
    headers: { cookie: admin.cookieHeader, 'content-type': 'application/json' },
    data: {
      idempotencyKey: crypto.randomUUID(),
      objective:
        'Our enterprise customers adopt the new analytics module as part of their daily workflow.',
      krs: [
        { text: 'Increase weekly-active analytics users among enterprise accounts from 18% to 45%' },
        { text: 'Raise the share of enterprise renewals that cite analytics as a driver from 5% to 25%' },
      ],
      context_snapshot: {},
    },
  })
  expect(res.status()).toBe(200)
  const j = await res.json()
  expect(j.status).toBe('complete')
  expect(j.reviewId).toBeTruthy()

  // nothing charged; exactly one audit row, type admin_unlimited, amount 0
  expect(await getBalance(admin.userId)).toBe(0)
  expect(await getCreditTransactions(admin.userId)).toEqual([{ type: 'admin_unlimited', amount: 0 }])

  // the free-review coupon was NOT consumed — the admin branch runs before it
  const red = await pool.query(`SELECT 1 FROM coupon_redemptions WHERE user_id = $1`, [admin.userId])
  expect(red.rowCount).toBe(0)
})

// ══════════════════════════════════════════════════════════
// 18. Help — the "why aren't the rewrites scored" entry
// ══════════════════════════════════════════════════════════
test('help: the "why aren\'t the rewrites scored" entry renders and is findable by search', async ({ page, context }) => {
  const u = await signIn(context, 'http://localhost:3200')
  createdUsers.push(u.userId)
  await page.goto('/okr-ally')
  await page.getByRole('button', { name: 'Help', exact: true }).click()

  const q = "Why don't the two suggested rewrites get their own score?"
  await expect(page.getByText(q)).toBeVisible()
  await page.getByText(q).click() // expand the <details>
  await expect(page.getByText(/grading my own suggestions, not a genuine independent check/)).toBeVisible()
  await expect(page.getByText(/actually use it as your OKR and submit it fresh/)).toBeVisible()

  const search = page.getByPlaceholder('Search help…')
  await search.fill('grading my own suggestions')   // term from the answer
  await expect(page.getByText(q)).toBeVisible()
  await search.fill('rewrites get their own score') // term from the question
  await expect(page.getByText(q)).toBeVisible()
  await search.fill('zzz-no-such-term')
  await expect(page.getByText(q)).toHaveCount(0)
})

// ══════════════════════════════════════════════════════════
// 19. Corporate shared context (migration 011)
// ══════════════════════════════════════════════════════════
test('corporate context: employee blocked until published, then unblocked; org context frozen per submission', async ({ context }) => {
  test.setTimeout(300_000)
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const gstin = testGstin()
  createdGstins.push(gstin)
  const adminEmail = `okr-e2e-ctxadmin-${Date.now()}@example.com`
  await corpFulfil({ purchaserUserId: buyer.userId, gstin, adminEmail, credits: 100 })
  const admin = await resolveOrCreateUser(adminEmail)
  createdUsers.push(admin.id)
  const org = (await getOrgByGstin(gstin))!

  const emp = await signIn(context, 'http://localhost:3200', `okr-e2e-ctxemp-${Date.now()}@example.com`)
  createdUsers.push(emp.userId)
  await allocateOrgCredits(admin, { email: emp.email, credits: 5 })

  const body = {
    objective: 'New enterprise customers reach production use without a services engagement.',
    krs: [{ text: 'Raise 60-day activation from 44% to 70%', initiatives: [] }],
    context_snapshot: {
      company_context: { final_text: 'PERSONAL company text the employee typed' },
      business_context: { final_text: 'PERSONAL business text the employee typed' },
      role_context: { final_text: 'I am the VP of Customer Success.' },
    },
  }
  const review = () =>
    context.request.post('http://localhost:3200/api/okr-ally/review', {
      headers: { cookie: emp.cookieHeader },
      data: { idempotencyKey: `e2e-ctx-${Date.now()}-${Math.random().toString(36).slice(2)}`, ...body },
    })
  const meNow = async () =>
    (await context.request.get('http://localhost:3200/api/okr-ally/me', { headers: { cookie: emp.cookieHeader } })).json()

  // /me reflects the block; a review is refused with the specific code
  expect((await meNow()).orgContext).toMatchObject({ confirmed: false })
  let r = await review()
  expect(r.status()).toBe(403)
  expect((await r.json()).code).toBe('org_context_unconfirmed')

  // admin publishes → unblocked, /me carries the shared text
  await publishOrgContext(org.id, 'ORG COMPANY CONTEXT v1', 'ORG BUSINESS CONTEXT v1')
  expect((await meNow()).orgContext).toMatchObject({
    confirmed: true,
    companyContext: 'ORG COMPANY CONTEXT v1',
    businessContext: 'ORG BUSINESS CONTEXT v1',
  })

  r = await review()
  expect(r.status(), JSON.stringify(await r.json())).not.toBe(403)

  // the submission froze the ORG company/business context and the PERSONAL role
  const sub1 = (await getLatestSubmission(emp.userId))!
  const snap1 = await getSubmissionContextSnapshot(sub1.id)
  expect(snap1.company_context.final_text).toBe('ORG COMPANY CONTEXT v1')
  expect(snap1.business_context.final_text).toBe('ORG BUSINESS CONTEXT v1')
  expect(snap1.role_context.final_text).toBe('I am the VP of Customer Success.')

  // admin edits + reconfirms → the earlier submission is untouched; the next gets v2
  await publishOrgContext(org.id, 'ORG COMPANY CONTEXT v2', 'ORG BUSINESS CONTEXT v2')
  expect((await getSubmissionContextSnapshot(sub1.id)).company_context.final_text).toBe('ORG COMPANY CONTEXT v1')

  await review()
  const latest = (await pool.query(`SELECT id FROM submissions WHERE user_id=$1 ORDER BY created_at DESC LIMIT 1`, [emp.userId])).rows[0]
  expect((await getSubmissionContextSnapshot(latest.id)).company_context.final_text).toBe('ORG COMPANY CONTEXT v2')
})

test('corporate context: two employees under different orgs see only their own org context', async ({ browser }) => {
  const ctxA = await browser.newContext()
  const ctxB = await browser.newContext()
  const buyerA = await signIn(ctxA, 'http://localhost:3200')
  const buyerB = await signIn(ctxB, 'http://localhost:3200')
  createdUsers.push(buyerA.userId, buyerB.userId)
  const gA = testGstin()
  const gB = testGstin()
  createdGstins.push(gA, gB)
  const adminA = `okr-e2e-ia-${Date.now()}@example.com`
  const adminB = `okr-e2e-ib-${Date.now()}@example.com`
  await corpFulfil({ purchaserUserId: buyerA.userId, gstin: gA, adminEmail: adminA, companyName: 'Alpha Corp LLP', credits: 100 })
  await corpFulfil({ purchaserUserId: buyerB.userId, gstin: gB, adminEmail: adminB, companyName: 'Beta Corp LLP', credits: 100 })
  const oA = (await getOrgByGstin(gA))!
  const oB = (await getOrgByGstin(gB))!
  const adminAUser = await resolveOrCreateUser(adminA)
  const adminBUser = await resolveOrCreateUser(adminB)
  createdUsers.push(adminAUser.id, adminBUser.id)
  await publishOrgContext(oA.id, 'ALPHA company context', 'ALPHA business context')
  await publishOrgContext(oB.id, 'BETA company context', 'BETA business context')

  const empA = await signIn(ctxA, 'http://localhost:3200', `okr-e2e-ea-${Date.now()}@example.com`)
  const empB = await signIn(ctxB, 'http://localhost:3200', `okr-e2e-eb-${Date.now()}@example.com`)
  createdUsers.push(empA.userId, empB.userId)
  await allocateOrgCredits(adminAUser, { email: empA.email, credits: 2 })
  await allocateOrgCredits(adminBUser, { email: empB.email, credits: 2 })

  const meOf = async (u: { cookieHeader: string }) =>
    (await ctxA.request.get('http://localhost:3200/api/okr-ally/me', { headers: { cookie: u.cookieHeader } })).json()

  expect((await meOf(empA)).orgContext).toMatchObject({
    organizationName: 'Alpha Corp LLP',
    companyContext: 'ALPHA company context',
    businessContext: 'ALPHA business context',
    confirmed: true,
  })
  expect((await meOf(empB)).orgContext).toMatchObject({
    organizationName: 'Beta Corp LLP',
    companyContext: 'BETA company context',
    businessContext: 'BETA business context',
    confirmed: true,
  })
  await ctxA.close()
  await ctxB.close()
})

test('context notice: an individual user editing their own context sees the "going forward only" note', async ({ page, context }) => {
  const u = await signIn(context, 'http://localhost:3200')
  createdUsers.push(u.userId)
  await seedProfile(u.userId, {
    name: 'Nora Individual',
    companyName: 'Solo Co',
    companyContext: 'We build analytics tooling for small teams.',
    businessContext: 'Moving from free to paid conversion focus this year.',
    roleContext: 'I own the product.',
  })
  await page.goto('/okr-ally')
  await expect(page.getByText(/Here's what I have on file/i)).toBeVisible()

  const notice = page.getByText(/apply to reviews you run from now on/i)
  await expect(notice).toHaveCount(0) // nothing changed yet

  await page
    .locator('div')
    .filter({ has: page.getByText('Your role', { exact: true }) })
    .last()
    .getByRole('button', { name: 'Edit' })
    .click()
  await page.locator('textarea').last().fill('I own the product and the platform team, about 18 people.')

  await expect(notice).toBeVisible()
  await expect(notice).toContainText(/keep the context they were run with/i)
})

// ══════════════════════════════════════════════════════════
// 20. Role-specific walkthroughs (migration 012)
// ══════════════════════════════════════════════════════════
test('walkthrough: org admin sees the admin walkthrough once on the first Company-tab visit', async ({ page, context }) => {
  const u = await signIn(context, 'http://localhost:3200')
  createdUsers.push(u.userId)
  const org = await seedOrg('Walkthrough Admin Co')
  createdGstins.push(org.gstin)
  await makeOrgAdmin(u.userId, org.id)

  await page.goto('/okr-ally')
  await page.getByRole('button', { name: 'Company', exact: true }).click()

  // auto-shows on first visit
  await expect(page.getByRole('heading', { name: 'Running OKR Ally for your company' })).toBeVisible()
  await expect(page.getByText(/The credit pool/i)).toBeVisible()
  for (let i = 0; i < 3; i++) await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.getByText(/Seeing usage/i)).toBeVisible()
  await page.getByRole('button', { name: 'Got it' }).click()

  // now the real admin screen; walkthrough gone; server recorded it
  await expect(page.getByText('Purchased', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Running OKR Ally for your company' })).toHaveCount(0)
  await expect.poll(() => getSeenWalkthroughs(u.userId)).toContain('org_admin')

  // second visit — reload, reopen Company → no walkthrough
  await page.reload()
  await page.getByRole('button', { name: 'Company', exact: true }).click()
  await expect(page.getByText('Purchased', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Running OKR Ally for your company' })).toHaveCount(0)

  // but the revisit link still opens it
  await page.getByRole('button', { name: /See the admin walkthrough again/i }).click()
  await expect(page.getByRole('heading', { name: 'Running OKR Ally for your company' })).toBeVisible()
})

test('walkthrough: an org employee sees the employee walkthrough once when they reach the context screens', async ({ page, context }) => {
  const buyer = await signIn(context, 'http://localhost:3200')
  createdUsers.push(buyer.userId)
  const org = await seedOrg('Walkthrough Employee Co')
  createdGstins.push(org.gstin)
  await makeOrgAdmin(buyer.userId, org.id) // buyer is a throwaway admin here
  await publishOrgContext(org.id, 'Company context published by the admin.', 'Business context published by the admin.')

  const emp = await signIn(context, 'http://localhost:3200', `okr-e2e-wemp-${Date.now()}@example.com`)
  createdUsers.push(emp.userId)
  await joinOrg(emp.userId, org.id)

  await page.goto('/okr-ally')
  // walk the identity steps to reach the (only) context step, ctx_role
  await expect(page.getByText(/what should I call you/i)).toBeVisible()
  await page.locator('input[type="text"], textarea').last().fill('Wanda Employee')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click() // skip phone
  await page.getByText(/name of your company/i).waitFor()
  await page.locator('input[type="text"], textarea').last().fill('My Team')
  await page.getByRole('button', { name: 'Next', exact: true }).click()

  // reaching the context screen fires the walkthrough
  await expect(page.getByRole('heading', { name: 'OKR Ally at your company' })).toBeVisible()
  await expect(page.getByText(/Your company sets part of the context/i)).toBeVisible()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Got it' }).click()

  // back on the form at the role step; server recorded it
  await expect(page.getByText(/your own role/i)).toBeVisible()
  await expect.poll(() => getSeenWalkthroughs(emp.userId)).toContain('employee')

  // reload → form resumes, walkthrough does NOT re-pop
  await page.reload()
  await expect(page.getByRole('heading', { name: 'OKR Ally at your company' })).toHaveCount(0, { timeout: 15_000 })
})

test('walkthrough: an individual (non-org) user sees neither role walkthrough', async ({ page, context }) => {
  const u = await signIn(context, 'http://localhost:3200')
  createdUsers.push(u.userId)
  await page.goto('/okr-ally')
  await expect(page.getByText(/what should I call you/i)).toBeVisible()
  // step through name/company to where an org employee's would have fired
  await page.locator('input[type="text"], textarea').last().fill('Ivy Individual')
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await page.getByRole('button', { name: 'Continue', exact: true }).click()
  await page.locator('input[type="text"], textarea').last().fill('Ivy Co')
  await page.getByRole('button', { name: 'Next', exact: true }).click()

  await expect(page.getByText(/Tell me about your company or organisation/i)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'OKR Ally at your company' })).toHaveCount(0)
  await expect(page.getByRole('heading', { name: 'Running OKR Ally for your company' })).toHaveCount(0)
  // no company tab, no revisit links
  await expect(page.getByRole('button', { name: 'Company', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /walkthrough again/i })).toHaveCount(0)
  expect(await getSeenWalkthroughs(u.userId)).toEqual([])
})
