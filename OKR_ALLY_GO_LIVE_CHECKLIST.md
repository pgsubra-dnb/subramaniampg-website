# OKR Ally — Go-Live Checklist

Running list of everything that must be done outside the codebase before OKR Ally
can go live. Populated retroactively from build-sequence steps 1–7; **append new
items here as later steps surface them** rather than scattering them across step
reports.

Status legend: `[ ]` not done · `[x]` done · `[~]` partially done / needs confirmation

---

## 1. Vercel environment variables

The project is `subramaniampg-website` (Vercel Pro, team `pgs-6398s-projects`).

| Variable | Status | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | `[ ]` **required** | Claude Sonnet 5 review engine **and** Claude Haiku 4.5 context-refinement pipeline (assess / paraphrase). Not yet in Vercel. Add to Production (Preview too if preview deploys should run reviews). |
| `RAZORPAY_WEBHOOK_SECRET` | `[ ]` **required** | Server-side webhook signature verification. Not yet in Vercel. Must match the secret set in the Razorpay dashboard (see §4). |
| `BLOB_READ_WRITE_TOKEN` | `[x]` done | Added to Production, Preview, Development when the `okr-ally-pdfs` Blob store was linked (2026-08-28). |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | `[~]` | Present in **Production only**. Add to Preview/Development if payments should be testable on preview deployments. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `[~]` | Present in Production only. Needed client-side for the Razorpay checkout on the Pricing tab (step 9). |
| `BREVO_API_KEY` | `[~]` | Present in Production + Preview, **not Development**. All OKR Ally emails (magic link, review report, GST invoice) silently no-op without it. Fine for prod; local dev can't send email. |
| `DATABASE_URL` | `[x]` done | Neon (shared with the worklife survey). Production + Development. |
| `NEXT_PUBLIC_OKR_ALLY_SANITY_DATASET` | `[ ]` **required** | Must be `okr-ally`. OKR Ally's Sanity content (magic-link tokens, coupon, course anchor, settings) lives in its own private dataset `okr-ally`, **not** `production`. `lib/okrAllySanity.ts` defaults to `okr-ally` if the var is unset, but set it explicitly on Production (and Preview if reviews run there) so the isolation is visible in the Vercel dashboard. In `.env.local` already. |
| `OKR_ALLY_COURSE_SLUG` | `[ ]` optional | Only set if the `okrAllyCourse` anchor doc's slug is **not** `okr-ally` (the default). It is currently `okr-ally` — leave unset. |
| `OKR_ALLY_FREE_REVIEW_COUPON` | `[ ]` **required for the free tier** | Set to **`OKRALLY-FIRST-FREE`**. This is **layer 2 of a two-layer gate** — see the ⚠ note under the coupon item in §2. The Sanity coupon being `active` is not enough on its own; without this env var, `/api/okr-ally/status` reports `freeReviewAvailable: false`, every review charges a credit, and the intro screen still says "first review is free". The user never types the code; the confirm screen sends it automatically when eligible. |
| `OKR_ALLY_REVIEW_TIMEOUT_MS` | `[ ]` optional | Per-attempt Claude timeout override; defaults to 120000 (120s). Leave unset unless tuning. |
| `OKR_ALLY_CONTEXT_DAILY_CAP` | `[ ]` optional | Per-user daily cap on the context assess/paraphrase Haiku calls; defaults to 150. Lower it if abuse appears. |

## 2. Sanity — content & config (OKR Ally Studio workspace)

OKR Ally has its own **private dataset `okr-ally`** and its own Studio workspace.

**Where to edit it:** the hosted Studio at **https://subramaniampg.sanity.studio/**
(deployed with the two-workspace config on 2026-08-28) → sign in → pick
**"OKR Ally"** on the "Choose your workspace" screen. The site content is under
**"Website"** now, at `/studio/website`. Nothing in the OKR Ally workspace touches
the `production` dataset or the Academy.

> The embedded route on the live site, `subramaniampg.guru/studio`, still serves
> the **old single-workspace** config and will until the Next.js app is
> redeployed to Vercel (that redeploy is step 11 / §8). Until then, use the
> `subramaniampg.sanity.studio` URL above for OKR Ally content.

All three documents below were **created 2026-08-28**; what remains is filling the
accountant/footer fields.

- [x] **`okrAllyCourse` anchor** — `_id: okr-ally-course`, title "OKR Ally", slug `okr-ally`. The `applicableCourse` target for the coupon; no other purpose.
- [x] **`okrAllyCoupon` free-first-review coupon** — `_id: okr-ally-coupon-first-free`, code **`OKRALLY-FIRST-FREE`**, `discountPercent: 100`, `active: true`, **no `expiryDate`** (intentional — see the note below), `applicableCourse` → the anchor. One-per-user enforcement is in Neon (`coupon_redemptions`).
  - **⚠ The free review has a TWO-LAYER activation gate. Both are required; neither alone is enough:**
    1. the `okrAllyCoupon` doc is `active: true` in the `okr-ally` Sanity dataset (done), **and**
    2. `OKR_ALLY_FREE_REVIEW_COUPON=OKRALLY-FIRST-FREE` is set in Vercel (§1 — **not done**).
    `/api/okr-ally/status` computes `freeReviewAvailable` as `(env var is set) AND (coupon validates as 100%-off)`. If only the Sanity side is checked, the coupon *looks* live in Studio but every review still silently charges a credit while the intro screen keeps saying "your first review is free". If only the env var is set (coupon inactive/expired/missing), same visible symptom. Verify **both** on the target environment before go-live, and re-verify after any coupon edit.
  - **`expiryDate` is intentionally empty — do not add one without asking PGS.**
    The `okrAllyCoupon` schema makes `expiryDate` optional, and `validateCoupon()`
    treats a missing expiry as "never expires" (verified live 2026-08-28: the
    no-expiry coupon validates, a past-dated coupon still correctly fails). The
    free-first-review offer is open-ended **by design** — this is a decision, not
    an oversight or a TODO. If a future reader wants to time-box the offer (launch
    promo, cohort, etc.), that is a business call for PGS: set a date in the OKR
    Ally Studio workspace. Note that once a date is set, the coupon silently stops
    validating after it and `freeReviewAvailable` flips to false with no other
    warning.
- [x] **`okrAllySettings` singleton** — `_id: okrAllySettings`, created with `email`, `phone`, `okrAllyBookingUrl` (`https://cal.id/pgs/short-discussion`), `legalBusinessName` ("Embiggen Consulting LLP"). **GST supplier fields set 2026-08-29 (PGS-confirmed values), verified via live invoice render test — all four print correctly on both the CGST+SGST and IGST branch PDFs:**
  - [x] `supplierGstin` — `33AAKFE0742K1ZJ` (passes `GSTIN_RE`; state 33 = Tamil Nadu; embedded PAN matches `supplierPan`)
  - [x] `supplierPan` — `AAKFE0742K`
  - [x] `registeredAddress` — `45, Srinivasa Iyer Street, West Mambalam, Chennai, Tamil Nadu 600033, India`
  - [x] `supplierSacCode` — `998311` set in `okrAllySettings` and rendering correctly, **but see §3: still pending PGS confirmation that this code was given by his accountant (vs. independently validated as plausible)**
  - [ ] `substackUrl`, `linkedinUrl` — footer/exit-screen links (optional; `okrAllyBookingUrl` already set)
  - The four GST fields are set, so invoice generation no longer soft-fails to `supplier-not-configured`.

## 3. Accountant — confirm before invoicing

- [ ] **SAC code** for the review service — exact code and digit count (4 vs 6). Always begins "99". `998311` is now set in `okrAllySettings.supplierSacCode` and renders correctly on invoices (§2), **but still unconfirmed**: PGS needs to say whether `998311` was explicitly given by his accountant, or was only independently validated as plausible. Do not treat this as closed until PGS confirms the source.
- [x] **Bill of Supply for ₹0 transactions** — no Bill of Supply is needed (accountant-confirmed
  2026-08-29): the 100%-off coupon discounts the *price* to zero, it does not make the service
  GST-exempt, so there is no exempt/nil-rated supply. **Superseded 2026-08-30 on PGS's instruction:**
  every transaction now gets a **full GST Tax Invoice, including the ₹0 first review** — a real Tax
  Invoice showing the discount ladder (List price → Discount 100% (coupon) → Net taxable value ₹0
  → CGST/SGST ₹0 → Total ₹0), not a Bill of Supply and not "no document". See migration 007 and the
  Notes section. This is consistent with the accountant's point (still a taxable supply, just
  100%-discounted).

## 4. Razorpay dashboard

- [ ] **Register the webhook** — URL `https://subramaniampg.guru/api/okr-ally/webhook`, events **`payment.captured`** and **`order.paid`**, secret = the value put in `RAZORPAY_WEBHOOK_SECRET` (§1). This is the fallback confirmation path for the closed-tab case; without it a payment made while the browser is closed never credits.

## 5. Neon — one-time manual

- [x] **Admin flag** — **DONE 2026-08-29.** PGS signed in (Neon `users` row
  `12050af9-5fdf-443e-89b1-76d3ee265099`, created 2026-08-29 08:44 UTC); ran
  `UPDATE users SET is_admin = true WHERE email = 'pgs@embiggen.co.in';`
  (1 row), verified `is_admin = true` and that it is the only admin row.
  Gates the admin review screen (step 9 / section 9).

## 6. Not yet built (not in the numbered build sequence)

- [x] **Admin review screen** (`is_admin` users) — **BUILT 2026-08-29** (§4/§9/§12).
  Admin-only 4th tab in `/okr-ally` → `AdminList` (every completed review across
  users) → `AdminReviewScreen`: verbatim submission + the automated review + two
  option panels (one note per rubric criterion + general + 1–5 rating, stored in
  `expert_reviews`) + the improvement-email panel (Claude drafts from PGS's
  notes in his voice as added commentary — never a score/rating — then edit and
  "Send to <user email>", which Brevo-sends and stamps `improvement_emails.sent_at`
  only on a confirmed send). Migration 006 (`UNIQUE(review_id)` on
  `improvement_emails`) applied to Neon; the `.sql` lives in the design-package
  folder with 002–005 (untracked there, like the others). Routes under
  `/api/okr-ally/admin/*` (403 for non-admins). e2e spec 6 covers it.
- [x] **Admin list filtering + pagination** — **BUILT 2026-08-30.** The Admin tab list now has
  objective / company-name / email filters (combinable) and 20-per-page pagination
  (`GET /api/okr-ally/admin/reviews?q=&company=&email=&page=&pageSize=`, returns
  `{ items, total, page, pageSize }`). e2e spec 9.
- [x] **Manual admin credit grants** — **BUILT 2026-08-30.** "Grant credits to an account" panel on
  the Admin tab → `POST /api/okr-ally/admin/grant-credits { email, credits, note? }`. New
  `credit_transactions.type = 'admin_grant'` + `note` column (migration 007). Atomic (ledger +
  balance in one txn). The recipient is **always** emailed (which BCCs PGS); a grant to an account
  that has not completed a review yet succeeds but returns a `warning`. e2e spec 8.

## 7. Manual end-to-end pass (before go-live)

The automated Playwright suite (`npm run test:e2e`, `e2e/okr-ally.spec.ts`, 10 specs)
covers the happy path, the refund-on-failure path, ownership scoping, the required
rating, thin-context handling (a spec submits deliberately vague company context,
asserts a clarifying question renders, answers it, and verifies the persisted
`context_snapshot`), the `validateReviewOutput` 2–3-initiative gate, the admin
review screen (403 gate for non-admins, expert feedback on both options, and a
grounded improvement-email draft with no score/rating language), and — as of
2026-08-30 — the ₹0 first-review Tax Invoice + discount ladder, the manual admin
credit grant, and the admin list filters + pagination.
What it
**can't** cover and must be done by hand once, against a preview/production deploy
with real credentials:

- [ ] **Magic link in a real inbox** — request a link from the email gate, open the
  email, click through, confirm the session lands on the form. (Needs
  `BREVO_API_KEY` on the target environment.)
- [ ] **The free first review actually runs free** — on the target environment,
  with a fresh email, confirm `/api/okr-ally/status` returns
  `freeReviewAvailable: true`, then submit a review and confirm **no credit was
  charged** (balance stays 0, `credit_transactions` shows the coupon redemption,
  not a `usage` debit). This is the end-to-end check of the two-layer gate in §2
  — passing it means both the Sanity coupon *and* `OKR_ALLY_FREE_REVIEW_COUPON`
  are correctly set on that environment.
- [ ] **Confirmation emails actually arrive** — after a completed review: the
  "your OKR Ally review" email with the PDF attached. After a purchase: the
  "credits ready" email and the numbered GST invoice PDF.
- [ ] **The self-BCC actually lands — check `pgs@embiggen.co.in` directly.**
  `lib/sendBrevoEmail.ts` sends FROM and BCCs `pgs@embiggen.co.in`. As of 2026-08-30
  this has only been **code-verified** (payload always carries the BCC), never
  physically confirmed: the M365 mailbox reachable via the assistant's connector is
  `pgs@embiggen.co` (a *different* address), and none of the 4 OKR Ally emails sent
  to `.co.in` during the 2026-08-29 testing (sign-in, review, credits, invoice
  `OKR/26-08/0001`) appeared in the `.co` mailbox. PGS to open the `.co.in` inbox
  and confirm the invoice `OKR/26-08/0001` email + the review/credits emails +
  their BCC copies are actually there (and not in spam). If they are not, the
  sender/BCC address needs revisiting before go-live.
- [ ] **The ₹0 first-review invoice arrives** — after the free first review, a
  "Tax invoice OKR/YY-MM/XXXX — OKR Ally" email with a ₹0 Tax Invoice PDF attached
  (List price ₹50 → 100% discount → Total ₹0), to the user **and** BCC to
  `pgs@embiggen.co.in`. Confirm the invoice number increments the shared
  `invoice_counters` sequence.
- [ ] **A manual admin credit grant** — from the Admin tab, grant a few credits to
  a test account by email; confirm the balance updates and the recipient (and PGS,
  by BCC) get the "credits added" email.
- [ ] **PDF download from the UI** — click "Download PDF" on the report screen and
  on a History entry; confirm the file opens and renders.
- [ ] **A real Razorpay checkout** — buy a pack through the Pricing tab with a
  real card (or a Razorpay test card if the keys are test-mode): confirm the
  modal opens, payment completes, `verify-payment` credits the account, the
  invoice email arrives, and the balance updates. Then verify the **webhook**
  fallback by completing a payment and closing the tab before `verify-payment`
  fires — the webhook should still credit it (requires §4 webhook registration).
- [ ] **A real clarifying question mid-form** — enter deliberately thin context
  and confirm Ally's question renders inline and Skip works. (The Send/answer
  path is now automated in `e2e/okr-ally.spec.ts`; this manual check is for the
  Skip path and the production UI.)

## 8. Deploy

### Standing deployment process (do not deviate)

1. **Merge to `main` first.** All work lands via a PR into `main`. Never push
   feature-branch code straight to production.
2. **Deploy only from `main`.** `git checkout main && git pull`, clean install
   (`npm ci`), `npm run build` to confirm green, then `vercel --prod` from that
   checkout.
3. **Never run `vercel --prod` from a feature branch or an unmerged working
   tree.** Doing so twice put code live that `main` didn't contain, and left
   `main` and production out of sync until PR #2 reconciled them (2026-08-29).

Vercel's git integration is **not** wired to auto-deploy `main` for this project —
every production deploy is a manual `vercel --prod` upload from local. So the
"deploy from `main`" discipline is entirely on the operator.

**Reconciled + deployed 2026-08-29:** PR #2 merged everything (UX fixes,
logo/radar, admin screen) into `main` (`e886a29`); `vercel --prod` run from a
fresh `main` checkout → `subramaniampg.guru`. `main` = production from here.

- [ ] Deploy to production, **unlinked from main navigation** (marketed separately; page lives at `/okr-ally`).
- [ ] Confirm `NEXT_PUBLIC_SITE_URL` points at the production domain (magic-link URLs are built from it).
- [ ] Confirm `NEXT_PUBLIC_OKR_ALLY_SANITY_DATASET=okr-ally` and `OKR_ALLY_FREE_REVIEW_COUPON=OKRALLY-FIRST-FREE` are set on the target environment (§1).
- [x] **Hosted Studio deployed** — `sanity deploy` run 2026-08-28; https://subramaniampg.sanity.studio/ now serves the two-workspace picker ("Website" + "OKR Ally"). Verified via the Sanity user-applications manifest.
- [ ] **Redeploy the Next.js app to Vercel** — needed for the *embedded* Studio route `subramaniampg.guru/studio` to pick up the two-workspace config (it currently serves the old single-workspace one). This is the same redeploy that ships the OKR Ally app itself. After it: the site's embedded Studio is at **`/studio/website`** (was `/studio`); bare `/studio` shows the picker — update any bookmarks / internal links.

---

## Notes / risks carried from the build

- **Migration 007 (2026-08-30, applied to Neon).** `okr-ally-schema-migration-007.sql` in the
  design-package folder. (a) `invoices` gains `list_price`, `discount_percent`, `coupon_code`,
  `submission_id`; `razorpay_payment_id` is now nullable; `idx_invoices_submission` (partial unique)
  + `chk_invoice_key` (one of the two idempotency keys must be present). (b) `credit_transactions`
  `type` CHECK widened with `admin_grant`, plus a `note` column.
- **A GST Tax Invoice is now issued for EVERY transaction, including the ₹0 first review.**
  - Paid packs: unchanged flow (verify-payment / webhook), but the invoice now prints the discount
    ladder when a coupon was applied. `create-order` stamps `listPrice` + `discountPercent` into the
    order notes.
  - ₹0 first review: issued from `POST /api/okr-ally/review` on the coupon-redemption success path
    (that path never touches create-order/verify-payment/the webhook). Idempotent on `submission_id`.
    Sent to the user's email and — via `sendBrevoEmail`'s default BCC — copied to PGS, same as any
    paid invoice.
  - **Place of supply for the ₹0 invoice defaults to the supplier's own registered state
    (Tamil Nadu)** — the free-review flow has no checkout step / state field, and GST is nil either
    way, so it renders as an intra-state nil invoice (CGST ₹0 + SGST ₹0). If PGS later wants the
    buyer's real state on ₹0 invoices, that needs a state field added to the free-review confirm
    screen.
  - **Not backfilled:** the 3 pre-2026-08-30 ₹0 redemptions in prod (PGS's own testing) have no
    invoice. Going-forward only — PGS's call.
- **Every invoice is copied to PGS via BCC** — `lib/sendBrevoEmail.ts` BCCs `pgs@embiggen.co.in`
  whenever `skipBcc` is not passed; `createAndSendInvoice` never passes it. **Code-verified only**
  (2026-08-30 payload inspection) — the BCC to `pgs@embiggen.co.in` has NOT been physically
  confirmed in an inbox (see §7; the connector mailbox is `pgs@embiggen.co`, a different address).
  PGS is checking `.co.in` directly. Do not add `skipBcc` to the invoice send.
- **`credit_transactions.type` now has four values** — `purchase`, `usage`,
  `refund_failed_generation`, `admin_grant`. `admin_grant` rows are deliberately **not** surfaced in
  the user-facing History dashboard (which shows only `purchase`); they just land in the balance.

- **Sanity dataset isolation (2026-08-28).** OKR Ally's Sanity content lives in a
  dedicated **private** dataset `okr-ally`, separate from `production`. The old
  `sandbox` dataset (a 395-doc staging clone) was **deleted** to free a slot —
  the Sanity plan caps at 2 datasets. If a staging dataset is needed again, that
  is a plan-upgrade decision. `lib/okrAllySanity.ts` is the single code path
  from OKR Ally to Sanity (own client + own magic-link token helpers);
  `lib/academy.ts` and the `production` dataset/schema are untouched by OKR Ally.
  `sanity.config.ts` is now a two-workspace array ("Website" → `/studio/website`,
  "OKR Ally" → `/studio/okr-ally`). The `okr-ally` dataset uses dedicated
  `okrAllyCourse` / `okrAllyCoupon` / `okrAllySettings` schema types (the Academy
  `course`/`coupon` schemas can't be reused — they reference `academyModule` /
  `bookingLink`).
- **`.env.local` was rewritten** by `vercel blob create-store --yes` on 2026-08-28 (re-pulled from Vercel dev env). Lost only two empty vars and comments; `.env.local.backup-20260723-142701` predates the OKR Ally work.
- **`reviews.model_version`** stores the Anthropic API's `model` field, which currently returns the bare alias `claude-sonnet-5` (not a dated snapshot) — it can't distinguish underlying model versions if the alias is repointed. `rubric_version` is the reliable lever for segmenting past reviews.
- **Review latency** — a review takes ~45–60s (Sonnet 5, `effort: medium`). The result is shown on the report screen and also emailed. `maxDuration = 300` on the route is the Vercel Pro ceiling.
- **Vercel Blob store** `okr-ally-pdfs` is **private** — report and invoice PDFs are not publicly fetchable; downloads always go through the authenticated, ownership-scoped routes.
