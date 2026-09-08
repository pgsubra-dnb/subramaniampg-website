# Academy — Corporate seats (as built)

Companion to `OKR_ALLY_TECHNICAL_MANUAL.md`. Describes the corporate bulk
purchase & seat-assignment feature for the Academy. Written from the code on
`feat/academy-corporate-seats`.

---

## 1. What it is

A company buys **N seats of ONE named course** against its GSTIN (flat price:
the course's Sanity `price` × seats + 18% GST; a percentage coupon may discount,
100%-off is refused for corporate). A **designated admin** then assigns seats to
employee email addresses from `/academy/company`. Each assignment:

- creates or finds the employee's Sanity `learnerRecord`,
- appends the course to their `enrolledCourses` (idempotent),
- emails them a 15-minute login link.

The admin can **reclaim** (revoke) a seat while the employee has **not started**
the course, and can **download a per-course usage report** (PDF). The company
gets **one GST tax invoice**, addressed to it, in the shared house series
`OKR/YY-MM/XXXX` — issued exactly like a paid consulting invoice
(`createAndSendInvoice`, `user_id = NULL`).

Learner **progress** stays entirely in Sanity (`learnerRecord`). Only the org /
seat pool / assignment ledger / purchase-idempotency lives in Neon.

---

## 2. Data model (Neon — `db/academy-corporate-schema-001.sql`)

Same Neon database as OKR Ally and the worklife survey. **Applied manually**,
not part of the deploy.

| Table | Key columns | Notes |
|---|---|---|
| `academy_organizations` | `id`, `name`, `gstin UNIQUE`, `registered_address`, `admin_email` | The company. `gstin` is the key — a repeat purchase on the same GSTIN reuses the org; name / address / admin_email stay as first set. `admin_email` (lower) is the seat manager. |
| `academy_course_seats` | `id`, `organization_id`, `course_id`, `course_slug`, `course_title`, `seats_purchased`, `seats_assigned`, `UNIQUE (organization_id, course_id)`, `CHECK seats_assigned <= seats_purchased` | One row per (org, course). A repeat purchase of the same course tops up `seats_purchased`. `seats_assigned` is the denormalised count of active assignments, used for the `FOR UPDATE` pool check. |
| `academy_seat_assignments` | `id`, `organization_id`, `course_seats_id`, `email` (lower), `learner_id` (Sanity, nullable), `status ∈ assigned/revoked`, `assigned_at`, `revoked_at` | One row per assignment; revoke flips `status` (never deleted — ledger stays complete). Partial-unique `(course_seats_id, lower(email)) WHERE status='assigned'` = one live seat per email per course. |
| `academy_corp_purchases` | `id`, `organization_id`, `razorpay_payment_id UNIQUE`, `razorpay_order_id`, `course_id`, `seats`, `list_price`, `base_amount`, `gst_amount`, `total_amount`, `coupon_code`, `invoice_number`, `note` | Fulfilment idempotency guard. `note` carries `[INVOICE NOT ISSUED — …]` when the GST invoice failed to issue. |

`seats_available = seats_purchased − seats_assigned`.

---

## 3. Code

### `lib/academyCorporate.ts` (mirrors `lib/okrAllyOrg.ts`, simplified)
| Export | Purpose |
|---|---|
| `seatPricing(coursePrice, seats, discountPercent?)` | `{ listPrice, base, gst, total, amountInPaise, discountPercent }` via `gstBreakdown`. |
| `fulfilAcademyCorporatePurchase(input)` | Advisory lock `academy-org-fulfil:<gstin>`, dup-check `academy_corp_purchases`, upsert org by GSTIN, upsert `academy_course_seats` (`seats_purchased +=`), insert the purchase row, then `createAndSendInvoice` (non-blocking; on failure `alertInvoiceUnissued` stamps the note + emails PGS), then the "you manage the seats" email to the admin. Idempotent. |
| `requireAcademyOrgAdmin(email)` / `isAcademyOrgAdmin(email)` | Gate — email must equal an `academy_organizations.admin_email`. |
| `assignSeat(email, { courseSeatsId, email })` | Reserve one seat in a 1-row tx (`reserveSeatTx`: `FOR UPDATE`, availability + duplicate check, counter, assignment row), then enrol in Sanity + email after commit. |
| `bulkAssignSeats(email, { courseSeatsId, rows[] })` | Validate every row up front (bad email, dup in file, already-assigned, total > pool); reject the whole file with a row-by-row list if any fail; else **one shared tx** for every row (all-or-nothing), enrolments + emails after commit, ≤10 in flight. |
| `revokeSeat(email, { assignmentId })` | Refused if `hasStartedCourse` (any completed lesson in the course). Flips to `revoked`, `seats_assigned −= 1`, removes the course from the learner's `enrolledCourses`. |
| `resendSeatEnrolment(email, { assignmentId })` | Re-run the Sanity enrolment + login email for a pending / lost-link seat. |
| `getCompanyStatus(email)` | Per-course pools + employee rows `{ email, name, status, enrolmentPending, started, completed }`. `started` from `learnerRecord.completionLog` ∩ course lesson ids; `completed` from `certificateRefs[]->courseRef._ref`. |
| `renderCompanyReportPdf(status)` | jsPDF, one section per course. |

### `lib/academy.ts` additions
| Export | Purpose |
|---|---|
| `enrolLearnerByEmail(email, course, opts)` | Sanity-only enrolment primitive (create/find learner, append course, optional login-link email). Safe to call after a Neon commit. |
| `getSessionLearner(req)` | `{ id, email, name }` from the `academy_session` cookie (learnerRecord `_id`). |
| `ACADEMY_SESSION_COOKIE` | `'academy_session'`. |

### API routes (`app/api/academy/corporate/*`, all `dynamic = 'force-dynamic'`)
| Route | Method | Auth | Purpose |
|---|---|---|---|
| `create-order` | POST | anonymous | Validate course (published, paid), company details, GSTIN, place of supply, optional coupon; `seatPricing`; `razorpay.orders.create` with `notes { app:'academy', kind:'corporate', … }`. |
| `verify-payment` | POST | — | HMAC + fulfilment guard + `fulfilAcademyCorporatePurchase`. |
| `webhook` | POST | Razorpay sig | Silent closed-tab fallback. Same fulfilment. **Needs a separate Razorpay dashboard endpoint on the apex host.** |
| `status` | GET | learner session | `{ isAdmin, organization, courses[] }` or `{ isAdmin:false }`. |
| `assign` | POST | admin | `{ courseSeatsId, email }`. |
| `assign/bulk` | POST | admin | `{ courseSeatsId, text }` — one email per line / CSV first column, `email` header ignored. |
| `assign/template` | GET | — | Starter CSV. |
| `revoke` | POST | admin | `{ assignmentId }`. |
| `resend` | POST | admin | `{ assignmentId }`. |
| `report/pdf` | GET | admin | Usage report PDF. |

### Pages
| Path | Notes |
|---|---|
| `/academy/company/buy` | Buy page (course + seat count + live price, company details, coupon, terms, Razorpay). `noindex`. |
| `/academy/company` | Admin screen: per-course pool, single + paste + CSV assign, People table with Resend / Revoke, usage-report link, buy-more link. `noindex`. |
| `/academy/dashboard` | Shows a "Manage your company's seats →" card when `status.isAdmin`. |
| `/academy` | "Training a team?" link to the buy page. |

---

## 4. Business rules

- **Pricing**: flat `coursePrice × seats`, then percentage coupon, then 18% GST. Total must be ≥ ₹1 — a 100%-off coupon is refused for corporate (email PGS for a complimentary enrolment).
- **Seats max**: 500 self-serve (`create-order` rejects more; the page says email PGS).
- **Idempotency**: `academy_corp_purchases.razorpay_payment_id UNIQUE`; verify-payment and the webhook are safe to both run for one payment.
- **GST invoice**: shared house series `OKR/YY-MM/XXXX` (`invoice_counters`), `user_id = NULL`, supplier snapshot from `okrAllySettings` (same legal entity, Embiggen Consulting LLP). CGST+SGST vs IGST from buyer GSTIN state vs supplier state. Idempotent on the payment id. On failure: `academy_corp_purchases.note` stamped + PGS emailed with everything to re-run `createAndSendInvoice` by hand.
- **Assignment**: one active seat per email per course. Assigning consumes a seat and enrols the employee even if they already had a personal enrolment in that course.
- **Enrolment-after-commit**: the Sanity enrol + email run *after* the Neon transaction commits. A failure there leaves a reserved seat with `learner_id = NULL` → the admin screen shows "Enrolment pending" with a **Resend** action.
- **Revoke**: only while the learner has completed **zero** lessons in the course. Returns the seat to the pool and unenrols them.
- **Admin identity**: a signed-in learner whose email equals `academy_organizations.admin_email`. One admin per org; if the same email admins two orgs, the most recent wins (v1 limitation).
- **Fulfilment guard**: `assertFulfillmentAllowed` (prod-only unless `ALLOW_NONPROD_FULFILLMENT=1`) is enforced in `fulfilAcademyCorporatePurchase` and inside `createAndSendInvoice`.

---

## 5. Environment variables

Reuses what OKR Ally / consulting already set — **no new variables**:
`DATABASE_URL`, `SANITY_API_TOKEN`, `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`,
`NEXT_PUBLIC_RAZORPAY_KEY_ID`, `RAZORPAY_WEBHOOK_SECRET`, `BREVO_API_KEY`,
`BLOB_READ_WRITE_TOKEN`, `NEXT_PUBLIC_SITE_URL`. Preview deployments can't run it
(DB / Sanity / Razorpay absent from Preview) — same as OKR Ally.

---

## 6. Go-live checklist

1. **Apply the migration** to Neon: `db/academy-corporate-schema-001.sql`.
2. **Add a Razorpay dashboard webhook** → `https://subramaniampg.guru/api/academy/corporate/webhook`, events `payment.captured` + `order.paid`, secret = the existing `RAZORPAY_WEBHOOK_SECRET`. **Apex host** — Razorpay's sender does not follow the `www` redirect.
3. **Deploy** from a fresh `main` checkout (`npm ci && npm run build`, then `vercel --prod`).
4. **One real payment** (PGS): buy a small seat count for a real course on the deployed site. Confirm:
   - GST invoice email `OKR/YY-MM/XXXX` addressed to the company, correct CGST+SGST / IGST;
   - `academy_organizations` / `academy_course_seats` / `academy_corp_purchases` rows via SQL;
   - `/academy/company` (signed in as the admin email) shows the pool.
5. **Admin walk** (PGS): assign 2 seats (one via CSV) → both employees get the enrolment email and appear in the People table, and can reach the course via the link. Revoke the unstarted one → seat returns to the pool. Complete a lesson as the other employee → confirm Revoke is refused. Download the usage-report PDF.

---

## 7. Known gaps / follow-ons

- **No automated e2e** — the Academy has no e2e suite (only `okr-ally.spec.ts`) and its Sanity content is the live `production` dataset, so a spec would seed real learner records. Manual prod E2E (step 5) is the check, matching current practice. A spec is a worthwhile follow-up (seed a Neon org directly, mint an `academy_session` for a throwaway learner, drive the routes).
- **One admin per org.** A second admin, or transferring admin, is a future addition (`admin_email` is a single column).
- **`enrolLearnerByEmail` is not yet used by the existing free / paid enrolment routes** — it was added for corporate only, to keep this change's blast radius small. Folding `app/api/academy/enrol` and the learner block of `app/api/verify-payment` onto it is a safe later cleanup.
- **No self-serve "buy more of a different course"** in one transaction — each course is a separate purchase (tops up its own pool).
