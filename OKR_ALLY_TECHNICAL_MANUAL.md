# OKR Ally — Technical Product Manual (as built)

Companion to `OKR_ALLY_GO_LIVE_CHECKLIST.md`. This is the as-built reference for
the feature: what it is, how it is wired, and every rule that governs it. Written
from the code on `main` as of the Help-tab / book-consulting batch (Aug 2026,
schema through migration 008).

Design source of truth for intent: `Scripts/okr-ally/OKR-Ally-Design-Document.md`
(in the design-package repo, not this one). This manual describes the
implementation, which is authoritative where the two differ.

---

## 1. What it is

OKR Ally lives at **`/okr-ally`** on the `subramaniampg-website` Next.js app
(also reachable at `app.subramaniampg.guru/okr-ally`). A signed-in user submits
one Objective + its Key Results + three context fields; Claude scores the OKR
against a fixed 5-criterion rubric and returns two rewrites (a "Refined Original"
and a "Fresh Rewrite"). The user gets a scored on-screen report + a PDF by email.

Monetisation: **credit packs** bought via Razorpay (1 credit = 1 review). The
first review per account is free via a 100%-off coupon. Every transaction —
including the ₹0 one — produces a GST tax invoice.

PGS (the sole admin) has an **Admin tab**: a queue of all completed reviews where
he records expert feedback on each rewrite option and sends the user a personal
"improvement note" email (Claude drafts it from his notes; he edits and sends).

It is isolated from the rest of the site: its own Neon tables, its own **private
Sanity dataset `okr-ally`**, its own auth path. Academy auth and the `production`
Sanity dataset are untouched by it.

---

## 2. Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14.2.35, App Router, React 18 |
| Hosting | Vercel (project `subramaniampg-website`, Pro, team `pgs-6398s-projects`). Production deploys are **manual `vercel --prod`** from a fresh `main` checkout — Vercel git auto-deploy is **not** enabled for this project. |
| DB | Neon Postgres (project `odd-haze-51550124`, host `ep-jolly-credit-azanlw6b`), the **same `neondb`** the worklife survey uses. Accessed with `pg` (`Pool`, `DATABASE_URL` \|\| `POSTGRES_URL`). |
| CMS | Sanity project `vpwi5zan`, dataset **`okr-ally`** (private). `@sanity/client` via `next-sanity`. Two-workspace Studio: `/studio/website` (production) + `/studio/okr-ally`. |
| AI | Anthropic API via **raw `fetch`** (no SDK). Review: `claude-sonnet-5`. Context pipeline + nothing else: `claude-haiku-4-5`. |
| Payments | Razorpay (`razorpay` npm SDK for order/link fetch; `crypto` HMAC for signature checks). |
| File storage | Vercel Blob, private store `okr-ally-pdfs` (`store_3WobcPlYFC2pvtfN`, iad1). |
| PDF | `jspdf`, rendered server-side. |
| Email | Brevo (transactional API) via `lib/sendBrevoEmail.ts`. From/BCC `pgs@embiggen.co.in`. |
| Tests | Playwright (`e2e/okr-ally.spec.ts`), the repo's only automated E2E suite. |

All OKR Ally code is namespaced: `lib/okrAlly*.ts`, `app/api/okr-ally/*`,
`app/okr-ally/*`, `sanity/schemas/{okrAlly*,magicToken}.ts`.

---

## 3. Request / data flow

```
Browser (app/okr-ally/OkrAllyClient.tsx, "use client")
  │  fetch /api/okr-ally/*  (all dynamic, session cookie)
  ▼
Route handlers (app/api/okr-ally/*/route.ts)
  │        │                 │
  │        │                 └── Anthropic API (fetch)  — review / context / admin email
  │        └── Sanity (okr-ally dataset)  — magic tokens, coupon, course anchor, settings
  ▼
Neon Postgres (lib/okrAlly.ts pg Pool)      Vercel Blob (lib/okrAllyBlob.ts) — PDFs
  ▲
Razorpay webhook  ──► /api/okr-ally/webhook (server-to-server fallback)
```

- Every OKR Ally API route is `export const dynamic = 'force-dynamic'`.
- The client is a single stateful component with a `phase` state machine and a
  `tab` state; there is no routing inside `/okr-ally` beyond query params
  (`?error=`, `?signedout=1`).

---

## 4. Auth & sessions

- **Magic link.** `POST /api/okr-ally/magic-link` `{ email }` → mints a
  `magicToken` document in the `okr-ally` Sanity dataset (15-minute expiry),
  emails the link. Anyone may request one — the user row is created on first
  verification (unlike Academy, which needs a pre-existing learner).
- Token primitives (`generateToken` / `storeMagicToken` / `verifyMagicToken`)
  are reused from `lib/academy.ts` **as-is**, but OKR Ally's copies live in
  `lib/okrAllySanity.ts` and target the `okr-ally` dataset with no `learnerId`.
- **Verify.** `GET /api/okr-ally/verify?token=…` → resolves/creates a Neon
  `users` row, sets cookie **`okr_ally_session` = that user's UUID**. Redirects
  to `/okr-ally` (or `/okr-ally?error=invalid-link|link-expired|server-error`).
- New users get the email local-part as a placeholder `name` (`users.name` is
  `NOT NULL`); the step form overwrites it.
- `getSessionUser(req)` (`lib/okrAlly.ts`) reads the cookie → `users` row. Every
  non-public route 401s without it.
- **Admin** = `users.is_admin = true`. Set once by SQL for
  `pgs@embiggen.co.in` (user id `12050af9-…`). Admin API routes return 403 (not
  401) when a signed-in non-admin calls them.
- Logout: `GET /api/okr-ally/logout` clears the cookie → `/okr-ally?signedout=1`.

---

## 5. Data model (Neon, `public` schema)

Base migration `okr-ally-schema-migration.sql` + `002`–`008` (all applied). The
`.sql` files live in the **design-package repo** (`Scripts/okr-ally/`), untracked
here.

### Identity / profile
| Table | Key columns | Notes |
|---|---|---|
| `users` | `id uuid pk`, `email unique`, `phone`, `name NOT NULL`, `is_admin bool` | |
| `user_profile` | `user_id pk→users ON DELETE CASCADE`, `company_name`, `company_context`, `business_context`, `role_context` | Saved only if the user opts in on the confirm screen. Prefills returning users. |
| `drafts` | `user_id pk→users ON DELETE CASCADE`, `form_state jsonb` | One in-progress form per user; drives the resume prompt. 100 KB cap enforced in app. |

### Submissions / reviews
| Table | Key columns | Notes |
|---|---|---|
| `submissions` | `id uuid pk`, `user_id→users`, `objective`, `krs jsonb`, `context_snapshot jsonb`, `parent_submission_id→submissions`, `idempotency_key TEXT UNIQUE`, `status` ∈ `pending`/`complete`/`failed_refunded` | `context_snapshot` per field: `{raw_input, clarifying_question, clarifying_answer, paraphrase_suggested, final_text, paraphrase_action}`. GIN index on `to_tsvector(objective)`. |
| `reviews` | `id uuid pk`, `submission_id UNIQUE→submissions ON DELETE CASCADE`, `criteria_scores jsonb`, `overall_score numeric(3,1)`, `objective_feedback jsonb`, `key_result_feedback jsonb`, `suggested_okr_options jsonb`, `rubric_version`, `model_version`, `pdf_url`, `email_sent_at` | `overall_score` is the **app-computed** weighted sum, not Claude's self-reported number. |

### Credits / payments
| Table | Key columns | Notes |
|---|---|---|
| `user_credit_balance` | `user_id pk→users ON DELETE CASCADE`, `credits_remaining int ≥ 0` | |
| `credit_transactions` | `id`, `user_id→users`, `razorpay_payment_id`, `submission_id→submissions`, `amount int`, `type` ∈ `purchase`/`usage`/`refund_failed_generation`/`admin_grant`, `note` | Partial unique index `idx_credit_txn_purchase_payment (razorpay_payment_id) WHERE type='purchase'` = the double-credit guard. |
| `coupon_redemptions` | `id`, `user_id→users`, `coupon_code`, `applied_to_submission→submissions`, `applied_to_order_id` | **Unique `(user_id, coupon_code)`** = one redemption per coupon per user. |
| `okr_ally_daily_usage` | `(user_id, day) pk`, `calls int` | Durable per-UTC-day cap on the pre-payment Haiku endpoints (migration 004). |

### Invoicing
| Table | Key columns | Notes |
|---|---|---|
| `invoice_counters` | `year_month pk` (`'26-08'`), `last_number int` | Atomic increment → invoice number `OKR/YY-MM/XXXX`. |
| `invoices` | `id`, `user_id→users **ON DELETE SET NULL** (nullable)`, `razorpay_payment_id UNIQUE (nullable)`, `submission_id→submissions **ON DELETE SET NULL**`, `invoice_number UNIQUE`, `gstin` (buyer), `list_price NOT NULL`, `discount_percent`, `coupon_code`, `base_amount`, `gst_amount`, `total_amount`, `place_of_supply`, `cgst_amount`/`sgst_amount`/`igst_amount`, `supplier_{name,gstin,pan,address,sac_code}`, `pdf_url` | `chk_tax_split`: exactly CGST+SGST **or** IGST. `chk_invoice_key`: `razorpay_payment_id IS NOT NULL OR submission_id IS NOT NULL`. Partial-unique `idx_invoices_submission (submission_id) WHERE NOT NULL`. **Invoices are never deleted or cascaded** (migration 008 — GST retention). |

### Feedback
| Table | Key columns | Notes |
|---|---|---|
| `outcome_feedback` | `id`, `review_id→reviews ON DELETE CASCADE`, `user_id→users`, `rating smallint 1..5 NOT NULL`, `feedback_text` | Unique `(review_id, user_id)` — upsert, user can change their rating. Rating is **required** on the report screen. |
| `expert_reviews` | `id`, `review_id→reviews ON DELETE CASCADE`, `okr_option_label` ∈ `'Refined Original'`/`'Fresh Rewrite'`, `rubric_feedback jsonb` (one note per criterion), `general_feedback`, `expert_rating smallint 1..5` | Unique `(review_id, okr_option_label)` — upsert per option. Both options must be saved before an improvement email can be drafted. |
| `improvement_emails` | `id`, `review_id→reviews ON DELETE CASCADE` **unique**, `draft_text NOT NULL`, `final_text`, `sent_at` | Unique `(review_id)` — regenerating replaces the draft. `sent_at` stamped only on a confirmed Brevo send. |

---

## 6. Sanity content model (dataset `okr-ally`)

| Type | `_id` | Purpose |
|---|---|---|
| `magicToken` | generated | Magic-link tokens (email, token hash, expiry). Created/consumed by auth. |
| `okrAllyCourse` | `okr-ally-course` | Anchor doc; slug `okr-ally` (`OKR_ALLY_COURSE_SLUG`). Coupons reference it. |
| `okrAllyCoupon` | e.g. `okr-ally-coupon-first-free` | `code`, `discountPercent`, `active`, optional `expiryDate` (null = never expires), `applicableCourse→okrAllyCourse`. Free-first-review coupon: **`OKRALLY-FIRST-FREE`**, 100%, active, no expiry. |
| `okrAllySettings` | `okrAllySettings` | Singleton. `email`, `phone`, `substackUrl`, `linkedinUrl`, `okrAllyBookingUrl` (exit-screen link), and the GST supplier snapshot: `legalBusinessName` "Embiggen Consulting LLP", `registeredAddress` (West Mambalam, Chennai, TN 600033), `supplierGstin` `33AAKFE0742K1ZJ`, `supplierPan` `AAKFE0742K`, `supplierSacCode` `998311`. Read server-side via `getSiteSettings()`. |

Dedicated `okrAllyCourse`/`okrAllyCoupon` schemas exist (rather than reusing
Academy `course`/`coupon`) because the Academy types pull in `academyModule` /
`bookingLink` references.

---

## 7. API routes

All under `app/api/okr-ally/`, all `dynamic = 'force-dynamic'`, all JSON unless
noted. `[auth]` = 401 without a session; `[admin]` = 403 for non-admins.

### Auth
| Route | Method | Purpose |
|---|---|---|
| `magic-link` | POST | `{email}` → mint token + email link. Always 200 (no account enumeration). |
| `verify` | GET | `?token=` → create/load user, set cookie, redirect. |
| `me` | GET | `{authenticated, user?, creditsRemaining?}`. |
| `logout` | GET | Clear cookie, redirect to `?signedout=1`. |

### Form / profile / draft
| Route | Method | Purpose |
|---|---|---|
| `status` | GET `[auth]` | `{creditsRemaining, freeReviewAvailable, links{booking,substack,linkedin}}` + pack pricing. |
| `profile` | GET/PUT `[auth]` | GET prefills the form. PUT writes name/phone→`users`, context→`user_profile` (COALESCE partial updates). |
| `draft` | GET/PUT/DELETE `[auth]` | The single in-progress `drafts` row. 100 KB cap. |
| `context/assess` | POST `[auth]` | `{field, text, lastCheckedText?}` → Haiku: specific-enough? already-clear? one clarifying question. `lastCheckedText` match → `{skipped:true}` with **no** model call. Non-blocking: `{degraded:true}` on failure. Rate-limited 30/min + daily cap. |
| `context/paraphrase` | POST `[auth]` | `{field, text}` → Haiku clarity rewrite (no new facts). Non-blocking. Same limits. |

### Review
| Route | Method | Purpose |
|---|---|---|
| `review` | POST `[auth]`, `maxDuration=300` | The core call. See §8/§9. Body: `{idempotencyKey, objective, krs, context_snapshot, parentSubmissionId?, couponCode?}`. |
| `submission/[id]` | GET `[auth]` | Full submission + review + this user's feedback, ownership-scoped (404 otherwise). Report screen. |
| `report/[submissionId]` | GET `[auth]` | Report **PDF** — Blob-first, regenerate-from-rows fallback. Ownership-scoped. |
| `history` | GET `[auth]` | Past submissions (objective, score, date, rated flag), newest first. |
| `account` | GET `[auth]` | Money history: pack purchases + invoices, for the History dashboard. |
| `feedback` | POST `[auth]` | `{reviewId, rating 1-5 (required), feedbackText?}` → upsert `outcome_feedback`. |

### Payments / invoicing
| Route | Method | Purpose |
|---|---|---|
| `validate-coupon` | POST `[auth]` | Sanity rules + one-per-user Neon check → `{valid, discountPercent}`. |
| `create-order` | POST `[auth]` | `{pack, couponCode?, buyerState (required), buyerGstin?}` → Razorpay order. Stamps `app='okr-ally'`, `userId`, `pack`, `credits`, `couponCode`, `base`, `gst`, `total`, `listPrice`, `discountPercent`, `placeOfSupply`, `buyerGstin` into order `notes` (client cannot influence what's granted). |
| `verify-payment` | POST `[auth]` | `{razorpay_order_id, razorpay_payment_id, razorpay_signature}`. HMAC-SHA256(`order_id\|payment_id`, `RAZORPAY_KEY_SECRET`). Fetches order, checks `notes.userId`, `grantCredits` (idempotent), sends "credits ready" email, `createAndSendInvoice`. Primary confirmation path. |
| `webhook` | POST | Razorpay server-to-server fallback for the closed-tab case. Events `payment.captured` + `order.paid`, secret `RAZORPAY_WEBHOOK_SECRET`. Same idempotent `grantCredits`. |
| `invoice/[id]` | GET `[auth]` | Invoice **PDF** — Blob-first, regenerate-from-row fallback. `getInvoiceForUser(id, userId)` (`AND user_id=$2`) → 404 for others. |

### Admin (all `[admin]`)
| Route | Method | Purpose |
|---|---|---|
| `admin/reviews` | GET | All completed reviews across users. Filters `q` (objective ILIKE), `company`, `email` (join `user_profile`); `page`/`pageSize` (≤50, `count(*) OVER()`). `{items, total, page, pageSize}`. |
| `admin/review/[submissionId]` | GET | Full completed review + verbatim submission + existing expert feedback. |
| `admin/expert-review` | POST | Upsert expert feedback for one option: `{reviewId, okrOptionLabel, rubricFeedback{criterion:note}, generalFeedback, expertRating 1-5}`. |
| `admin/improvement-email` | POST, `maxDuration` | `{action: 'generate'|'save'|'send', reviewId, finalText?}`. `generate` needs **both** options saved; Claude drafts (never a score/rating). `send` = Brevo `final_text ?? draft_text` to the review owner, stamps `sent_at` only on confirmed delivery. |
| `admin/grant-credits` | POST | `{email, credits, note?}`. Atomic: `admin_grant` ledger row + balance upsert. Recipient always emailed (BCCs PGS). Account must have signed in once (FK). Soft `warning` if they've not completed a review. |

---

## 8. Business rules

### Credits & packs (`lib/okrAllyBilling.ts`, `lib/okrAllyPricing.ts`)
- 1 credit = 1 review. Packs (base price, excl. GST): `single` ₹100 / 1 credit,
  `pack5` ₹375 / 5 (₹75 a review), `pack10` ₹500 / 10 (₹50 a review).
- **GST 18%** added on top: `gstBreakdown(base)` → `{base, gst=round(base*0.18),
  total, amountInPaise}`. Displayed totals: ₹118 / ₹443 / ₹590.
- Credits never expire. `credits_remaining` has a `CHECK (>= 0)`.

### Coupons
- Sanity `okrAllyCoupon` must be `active`, anchored to the `okr-ally` course,
  and either no `expiryDate` or one that is today-or-later.
- **AND** the user must not already have a `coupon_redemptions` row for that
  code (`unique (user_id, coupon_code)`, enforced in Neon, not Sanity).
- **Percentage coupons** (e.g. 30%) apply to **pack purchases only**
  (`create-order`). A percentage coupon passed to `review` is rejected.
- **100%-off coupons** apply to the **free first review only** (`review` route),
  consumed at submission time as `coupon_redemptions.applied_to_submission`.

### Free first review (two-layer gate)
1. Sanity coupon `OKRALLY-FIRST-FREE` `active:true`, **and**
2. env `OKR_ALLY_FREE_REVIEW_COUPON=OKRALLY-FIRST-FREE` set on Vercel.

Either alone "looks configured" but silently charges a credit. The client passes
the code as `couponCode` to `POST /review`; the server validates it, requires
`discountPercent === 100`, and `startSubmission` records the redemption instead
of deducting a credit — **atomically** with the submission insert.
- A ₹0 first review **still gets a GST tax invoice** (list price → 100% discount
  → nil taxable value → nil GST → ₹0). Place of supply defaults to the
  supplier's own state (Tamil Nadu) — the free flow has no state field. The
  accountant confirmed **no Bill of Supply** is needed (a 100% price discount is
  not a GST exemption).

### Submission limits (`lib/okrAllySubmission.ts`)
- `objective` ≤ 500, each `kr` ≤ 250, each `initiative` ≤ 250, `contextField`
  (final text) ≤ 1000 chars.
- 1–6 Key Results; ≤ 3 initiatives per KR.
- The review itself enforces **2–3 initiatives per KR** in the *output* (prompt +
  schema `minItems:2,maxItems:3` + `validateReviewOutput`); a violation → retry
  then refund.
- Rate limit: **5 submissions per rolling minute per user** (`SUBMISSIONS_PER_MINUTE`).

### Idempotency & refunds (`review` route)
- Client generates one `idempotencyKey` per attempt. A duplicate returns the
  existing submission's state — **never re-charges**.
- `startSubmission` is one transaction: create `submissions` (pending) **and**
  pay (deduct a credit **or** record the free-review redemption). Rolls back
  entirely on failure → no submission without a charge.
- Generation failure (schema-invalid output, or timeout) → `refundFailedSubmission`
  (credit back / redemption undone), `submissions.status='failed_refunded'`,
  HTTP 502. **No silent retry** for timeouts; only fast failures retry once.
  Ledger nets to zero (`usage -1` + `refund_failed_generation +1`).
- `completeSubmission` failing *after* a successful generation leaves the
  submission `pending` for manual reconciliation (the output isn't lost — it's
  in `reviews`).

### Pre-payment abuse guard
- `context/assess` + `context/paraphrase` are callable by any signed-in user
  before any credit is spent. Guarded by an in-memory 30/min burst limit **and**
  a durable per-UTC-day cap (`okr_ally_daily_usage`, default 150/day, env
  `OKR_ALLY_CONTEXT_DAILY_CAP`). Over the cap → 429 with no model call.

### GST invoicing (`lib/okrAllyInvoice.ts`, `lib/indiaGstStates.ts`)
- Invoice number `OKR/YY-MM/XXXX` from `invoice_counters` (atomic, advisory lock).
- Supplier details **snapshotted** onto each row from `okrAllySettings` at
  generation time.
- Buyer state (2-digit GST code) vs supplier state (33, Tamil Nadu) →
  **CGST+SGST** (intra-state) or **IGST** (inter-state). `chk_tax_split` enforces
  exactly one split.
- Idempotent on `razorpay_payment_id` (paid) or `submission_id` (₹0).
- PDF uses `Rs.` not `₹` (jsPDF Helvetica has no U+20B9); the **email HTML** uses
  `₹`. This divergence is deliberate — do not "unify" it.
- `sendBrevoEmail` BCCs `pgs@embiggen.co.in` by default → **every invoice is
  copied to PGS** automatically.

### User-facing report display (2026-08-30, deployed)
- Per-criterion **rationale text and weight %** are **hidden** on the web report
  and in the PDF. `computeOverallScore()` + `RUBRIC` are untouched — weights
  still drive the number, they're just not shown to the user.
- The **admin** review screen still shows full rationale + weights.

---

## 9. AI pipeline

### Review (`lib/okrAllyReview.ts`, `POST /api/okr-ally/review`)
- Model **`claude-sonnet-5`** (alias, not a dated snapshot), raw `fetch`.
- `thinking: { type: 'adaptive' }`, `output_config: { effort: 'medium' }`
  (~40–90 s), `tool_choice: 'auto'` (forced tool is incompatible with adaptive
  thinking). Single tool `submit_okr_review` for structured output.
- **Rubric** (`RUBRIC_VERSION = 'okr-ally-rubric-v1'`), fixed weights:
  | Criterion | Weight |
  |---|---|
  | Outcome vs Output | 25% |
  | Alignment | 25% |
  | Measurability | 20% |
  | Specificity | 15% |
  | Ambition vs Realism | 15% |
- `overall_score` = **app-computed** weighted sum (`computeOverallScore`), 0–10,
  1 dp. Claude also returns its own; the app's is authoritative.
- `validateReviewOutput` is the gate: exactly 5 criteria, no dupes, scores in
  range, rationale present, 2–3 initiatives per KR in both options. Fail → retry
  once (fast failures only) → refund.
- `ATTEMPT_TIMEOUT_MS` env override `OKR_ALLY_REVIEW_TIMEOUT_MS`; route
  `maxDuration = 300` (Vercel Pro ceiling).
- `reviews.model_version` = the API response's `model` field (verified
  `claude-sonnet-5`).
- Grounding: judge only the submitted text + user context; no outside knowledge,
  no invented detail.

### Context refinement (`lib/okrAllyContext.ts`)
- Model **`claude-haiku-4-5`**, no thinking / no effort, **forced** `tool_choice`
  for deterministic structured output. `ATTEMPT_TIMEOUT_MS = 30 s`.
- `assessField` → `record_assessment` tool: `specific_enough`, `already_clear`,
  `clarifying_question` (empty unless not specific). `needsParaphrase` derived.
- `paraphraseField` → clarity/structure rewrite only; keep grammatical person,
  don't unpack vague phrases, ~same length, **no new facts**.
- Both endpoints **degrade non-blocking** (`degraded:true`, form proceeds).

### Admin improvement email (`lib/okrAllyAdmin.ts`)
- Model `claude-sonnet-5`, `output_config: { effort: 'low' }`, forced tool,
  `EMAIL_TIMEOUT_MS = 45 s`.
- Hard prompt rules: PGS's first-person voice; **never** a score, rating, or
  "weak automated output" language; grounded only in the submission + context +
  PGS's entered notes. Requires both `expert_reviews` rows to exist.

---

## 10. Screen / UI inventory

Single client component `app/okr-ally/OkrAllyClient.tsx`. Tokens + shared
components in `_ui.tsx` (from `okr-ally-ui-mockup.html`).

### Phases (`phase` state)
| Phase | Screen |
|---|---|
| `loading` | spinner |
| `intro` | first-person intro; "More from PGS" footnote links `/work/okr-consulting` + `/assessment` |
| `email` | email gate; `?error=` messages |
| `app` | the tabbed app |
| `signedout` | thank-you + `ShareCard`; `?signedout=1` held in URL until "Back to the start" |

### Tabs (`tab` state, `TabBar`)
| Tab | Component | Who |
|---|---|---|
| Ally | `_form.tsx` `StepForm` (or resume prompt, or report) | all |
| Pricing & Plans | `_pricing.tsx` | all |
| History | `_history.tsx` — Reviews (searchable) + Purchases + Invoices | all |
| **Help** | `_help.tsx` — 4 topics, client-side search, no API calls | all |
| Admin | `_admin.tsx` `AdminList` → `AdminReviewScreen` | `is_admin` only |

### StepForm (`_form.tsx`, `_formState.ts`)
Conversational step machine, transcript rendered as chat bubbles, any step
editable, debounced draft autosave, char counts.
- Steps: `name` → `phone` (optional) → `company_name` → `ctx_company` →
  `ctx_business` → `ctx_role` → `objective` → `krs` → `confirm`.
- Context steps run assess → (optional clarify) → (optional paraphrase:
  Confirm / Modify / Ignore).
- `CTX_PROMPT` (in `_formState.ts`) holds the three questions. `ctx_business`:
  *"How does this objective connect to your organisation's broader goals or
  priorities, and what impact is it meant to have?"* The context **pipeline**
  uses its own `FIELD_LABEL` map, independent of `CTX_PROMPT`.
- **Returning user with a full saved profile** (`companyName` + all 3 contexts):
  `mode:'summary'`, lands on `profile_summary` — one screen, fields editable
  inline, only edited context fields re-run assess/clarify/paraphrase. Partial
  profile → stepwise (prefilled). `FormState.mode: 'stepwise' | 'summary'`.
- Confirm screen: policy box + "save this context to my profile" toggle
  (default on for returning users). Submit → `GeneratingIndicator` (client-timed
  rotating captions; the route is one blocking fetch, no streaming).

### Report (`_report.tsx`)
`ScoreInfographic` (band-coloured ring + 5-axis radar), objective + KR feedback,
two `OptionCard`s (Refined = plain / Fresh = emerald), **Download PDF**,
**required** star rating → feedback text → `ExitLinks` (`ShareCard` + booking
link from `okrAllySettings.okrAllyBookingUrl` + `/work/okr-consulting` +
`/assessment` + substack/linkedin).

---

## 11. PDFs & Blob storage

`lib/okrAllyBlob.ts` — private store `okr-ally-pdfs`, `putPdf`/`getPdfBytes`/
`deletePdf`. Degrades gracefully if `BLOB_READ_WRITE_TOKEN` absent (`pdf_url`
null → regenerate from the row).
- **Report PDF** (`lib/okrAllyReport.ts`): jsPDF A4, ~4 pages, OKR Ally logo
  header (`lib/okrAllyReportAssets.ts` base64), score infographic, verbatim
  OKR + context.
- **Invoice PDF** (`lib/okrAllyInvoice.ts`): jsPDF, supplier header, discount
  ladder when `discount_percent > 0` else compact single-line.
- Both download routes: serve the stored Blob, else regenerate from rows (rows
  are the source of truth). Served bytes are byte-identical to an independent
  Blob `get()`. No blob URL ever leaks into an API body (`getReviewDelivery()`
  is server-internal only).

---

## 12. Email (`lib/sendBrevoEmail.ts`)

- Brevo transactional API, `BREVO_API_KEY`. Returns `boolean` (real send) so
  `email_sent_at` / `sent_at` only stamp on success.
- From + **BCC `pgs@embiggen.co.in`** (unless `skipBcc:true`). Optional
  `attachments` (invoice PDF).
- Emails sent: magic link, "review ready" + report PDF, "credits ready", GST
  invoice, admin "A note on your OKR" improvement email, admin credit-grant
  notice.
- Local dev cannot send (`BREVO_API_KEY` not pulled locally; `vercel env pull`
  redacts it). Prod Brevo is verified working (smtp-relay.mailin.fr).
- **Mailbox caveat**: the Outlook MCP reaches `pgs@embiggen.co` (dot-co); the
  app sends from/BCC `pgs@embiggen.co.in` — a **different mailbox**. PGS has
  confirmed `.co.in` receipt directly.

---

## 13. PWA behaviour

Scoped entirely to `/okr-ally` (`app/okr-ally/layout.tsx`,
`public/okr-ally/*`).
- `metadata.robots = { index:false, follow:false }` — the app is noindex.
- Manifest `public/okr-ally/manifest.webmanifest`: `id`/`scope`/`start_url` =
  `/okr-ally`, `display: standalone`, `theme_color #1D9E75`, `background_color
  #FAF8F5`, icons 192/512 `any` + 192/512 `maskable`.
- `apple-touch-icon` 180×180 (iOS ignores manifest icons). `icon-32/192/512`.
  All generated from `brand-assets/okr-ally-icon-emerald.png`.
- **Service worker** `public/okr-ally/sw.js`: `skipWaiting` + `clients.claim` +
  a navigation-only network **pass-through** `fetch` handler. **No caching, no
  offline.** Its only job is to satisfy Chrome/Edge's last installability
  criterion. Registered from `OkrAllyClient.tsx` with `scope:'/okr-ally'`;
  `next.config.mjs` adds `Service-Worker-Allowed: /okr-ally` on `/okr-ally/sw.js`.
- **Custom install prompt**: `InstallAppBanner` (`_ui.tsx`) listens for
  `beforeinstallprompt` (+ a pre-hydration stash to `window.__okrDeferredInstall`
  in `layout.tsx` for repeat visitors), hides in standalone mode, renders a slim
  "Install OKR Ally" bar. Chrome (esp. Android) no longer shows an automatic
  banner.
- Verified installed on Android from `app.subramaniampg.guru/okr-ally` (emerald
  icon correct). iOS + desktop-Chrome install icon are PGS-to-confirm (no such
  browser wired here; the in-app WebView never fires `beforeinstallprompt`).

---

## 14. Environment variables

| Variable | Scope | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | Prod | Review (Sonnet 5) + context (Haiku 4.5) + admin email. |
| `DATABASE_URL` (or `POSTGRES_URL`) | Prod + Dev | Neon. **Not Preview** (fallback `survey_POSTGRES_URL` is a different var and does not count). |
| `SANITY_API_TOKEN` | Prod + Dev | Sanity read/write for the `okr-ally` dataset. |
| `NEXT_PUBLIC_OKR_ALLY_SANITY_DATASET` | Prod (+ Preview if used) | Must be `okr-ally`. `lib/okrAllySanity.ts` defaults to `okr-ally` if unset. |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | all | Hardcoded fallback `vpwi5zan`. |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Prod | Order create + signature verify + order/link fetch. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Prod | Client checkout on the Pricing tab. |
| `RAZORPAY_WEBHOOK_SECRET` | Prod | Webhook signature. Must match the Razorpay dashboard webhook. |
| `BLOB_READ_WRITE_TOKEN` | Prod + Preview + Dev | Vercel Blob (`okr-ally-pdfs`). |
| `BREVO_API_KEY` | Prod + Preview | Not Dev — local dev cannot send email. |
| `OKR_ALLY_FREE_REVIEW_COUPON` | Prod | `OKRALLY-FIRST-FREE` — layer 2 of the free-review gate. |
| `OKR_ALLY_COURSE_SLUG` | (opt) | Defaults `okr-ally`. |
| `OKR_ALLY_CONTEXT_DAILY_CAP` | (opt) | Defaults 150. |
| `OKR_ALLY_REVIEW_TIMEOUT_MS` | (opt) | Ops/test override for the review attempt timeout. |
| `NEXT_PUBLIC_SITE_URL` | Prod + Dev | |

**Net: a Preview deployment cannot run OKR Ally** (DB / Sanity / Anthropic /
Razorpay all missing from Preview).

---

## 15. Deployment

**Standing rule (non-negotiable — see `deploy-from-main-only` memory / checklist
§8):**
1. Every change to `main` goes through a **PR**. No direct commits to `main`,
   including one-liners.
2. Deploy only from `main`: `git checkout main && git pull`, `npm ci`,
   `npm run build` (confirm green), then `vercel --prod` **from that checkout**.
3. Never `vercel --prod` from a feature branch or unmerged tree.

Vercel's git integration does **not** auto-deploy `main` for this project — every
production deploy is a manual `vercel --prod` upload. Hosted Sanity Studio is a
separate `sanity deploy` (regenerates committed `dist/` + `.sanity/runtime/` —
revert those after).

Current prod: `main` (post go-live batch), domains `subramaniampg.guru` +
`app.subramaniampg.guru` (both the same Vercel project;
`app.subramaniampg.guru` added via `vercel domains add`, auto-DNS because the
zone's nameservers are Vercel's).

Migrations are applied to Neon **manually** (the `.sql` files are in the
design-package repo, untracked here) and are **not** part of the deploy.

---

## 16. Testing

`npm run test:e2e` (Playwright). `playwright.config.ts` runs two dev servers:
:3200 (full env) and :3201 (no `ANTHROPIC_API_KEY`, for the refund path).
`e2e/helpers.ts` mints a real `magicToken` in Sanity + hits `/verify`, and does
pg setup/teardown (`cleanupUsers` deletes rows + blobs + tokens).

Specs (`e2e/okr-ally.spec.ts`): happy path (live Claude review + DB assertions),
forced failure → 502 + refund, ownership (owner 200 / other 404 / anon 401 on
report + submission + invoice), required rating, thin-context clarify flow,
admin gate + two-panel requirement + grounded draft, ₹0-invoice ladder, admin
grant, admin list filter/pagination, returning-user summary specs, install-prompt
synthetic-event spec.

**Local dev cannot run OKR Ally** without real `DATABASE_URL` + `SANITY_API_TOKEN`
(both empty in `.env.local`). Full manual E2E on a prod-like deployment is the
established practice for anything user-visible — see checklist §7.

---

## 17. Known gaps / follow-ons

- **`/work/book-consulting` paid flow** (PR #12): built. Razorpay Payment Link →
  `/work/book-consulting/confirmed` verifies the Payment Links signature, matches
  the paid amount to a duration, issues the GST invoice via **this** pipeline
  (`createAndSendInvoice` with `userId: null` + a `serviceLabel` override; GST
  back-calculated from the inclusive amount, place of supply = supplier state),
  and emails the free Cal.id booking link. `lib/consultingCheckout.ts` +
  `lib/consultingBooking.ts`. The one open item is a real end-to-end payment
  test (PGS's — it's a funds transfer). Optional: a `payment_link.paid` webhook
  as a closed-tab fallback.
- No admin "request a personal review" flow for users.
- Preview deployments can't exercise OKR Ally (env gap — by design, noted here so
  nobody spends time debugging it).
- iOS + desktop-Chrome PWA install: deployed, unverified on-device.
- `@sanity/client` is imported by `lib/okrAllySanity.ts` but only in
  `package.json` transitively (via `next-sanity`) — works, worth making explicit.
