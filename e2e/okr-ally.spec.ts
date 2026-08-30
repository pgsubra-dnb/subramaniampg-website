import { test, expect, Page } from '@playwright/test'
import { FAIL_BASE_URL } from '../playwright.config'
import { validateReviewOutput } from '../lib/okrAllyReview'
import {
  signIn,
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
  pool,
} from './helpers'

const createdUsers: string[] = []

test.afterAll(async () => {
  await cleanupUsers(createdUsers)
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
    /business situation this OKR sits inside/i
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
  await page.getByRole('button', { name: '+ add Key Result' }).click()
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
  await expect(page.getByText('Why each criterion scored the way it did')).toBeVisible()
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
          if (await page.getByText(/business situation this OKR sits inside/i).count()) return 'advanced'
          return 'waiting'
        },
        { timeout: 45_000, intervals: [500] }
      )
      .not.toBe('waiting')
    await expect(page.getByText(/business situation this OKR sits inside/i)).toBeVisible({ timeout: 20_000 })

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

  const user = await signIn(context, 'http://localhost:3200')
  createdUsers.push(user.userId)
  const hdr = { cookie: user.cookieHeader }

  // ── not an admin: routes 403, no Admin tab ──
  expect((await context.request.get('/api/okr-ally/admin/reviews', { headers: hdr })).status()).toBe(403)
  await page.goto('/okr-ally')
  await expect(page.getByRole('button', { name: 'History' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Admin' })).toHaveCount(0)

  // ── promote + seed a completed review ──
  await setAdmin(user.userId, true)
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
  expect(draft.toLowerCase()).not.toContain('rating')
  expect(draft.toLowerCase()).not.toMatch(/\bscored?\b/)

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
  expect(Number(inv.list_price)).toBe(50)
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
  const admin = await signIn(ctxA, 'http://localhost:3200')
  const recipient = await signIn(ctxB, 'http://localhost:3200')
  createdUsers.push(admin.userId, recipient.userId)
  const hdr = { cookie: admin.cookieHeader }

  // non-admin → 403
  expect(
    (await ctxA.request.post('/api/okr-ally/admin/grant-credits', { headers: hdr, data: { email: recipient.email, credits: 2 } })).status()
  ).toBe(403)

  await setAdmin(admin.userId, true)

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

  await setAdmin(admin.userId, false)
  await ctxA.close()
  await ctxB.close()
})

// ══════════════════════════════════════════════════════════
// 9. Admin list — company / email filters + pagination
// ══════════════════════════════════════════════════════════
test('admin list: company and email filters narrow results, pagination is honoured', async ({ context }) => {
  const admin = await signIn(context, 'http://localhost:3200')
  createdUsers.push(admin.userId)
  await setAdmin(admin.userId, true)
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

  await setAdmin(admin.userId, false)
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
