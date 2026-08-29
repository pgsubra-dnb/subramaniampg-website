import { test, expect, Page } from '@playwright/test'
import { FAIL_BASE_URL } from '../playwright.config'
import {
  signIn,
  seedCredits,
  getBalance,
  getLatestSubmission,
  getContextSnapshot,
  getCreditTransactions,
  getFeedback,
  seedCompletedReview,
  seedInvoice,
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
  await expect(page.getByText(/Reviewing your OKR now/i)).toBeVisible()

  // report screen
  await expect(page.getByText(/Your OKR scored/i)).toBeVisible({ timeout: 200_000 })
  await expect(page.getByText('Score breakdown')).toBeVisible()
  await expect(page.getByText('Refined Original')).toBeVisible()
  await expect(page.getByText('Fresh Rewrite')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible()

  // DB side effects
  const sub = await getLatestSubmission(user.userId)
  expect(sub?.status).toBe('complete')
  expect(await getBalance(user.userId)).toBe(0)
  const txns = await getCreditTransactions(user.userId)
  expect(txns).toEqual([{ type: 'usage', amount: -1 }])
})

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
    await expect(page.getByText(/Reviewing your OKR now/i)).toBeVisible()
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
