-- Academy — Corporate bulk purchase & seat assignment (migration 001)
--
-- A company buys N seats of ONE named course against its GSTIN. A designated
-- admin then assigns seats to employee emails; each assignment enrols that
-- employee (a Sanity learnerRecord) in the course and emails them a login link.
-- Unused seats can be reclaimed (revoked) while the employee has not started.
--
-- Learner PROGRESS stays in Sanity (learnerRecord). Only the org / seat pool /
-- assignment ledger / purchase-idempotency lives here — this is the money and
-- entitlement side, which needs transactions and a GST invoice trail.
--
-- Same Neon database as the OKR Ally tables and the worklife survey
-- (DATABASE_URL / POSTGRES_URL — the one linked to the subramaniampg-website
-- Vercel project). Apply manually; not part of the deploy.
--
-- GST invoices for these purchases are issued through the shared house series
-- (invoices / invoice_counters, OKR/YY-MM/XXXX) via lib/okrAllyInvoice.ts
-- createAndSendInvoice with user_id = NULL — exactly like paid consulting.

-- ── academy_organizations ────────────────────────────────────────────────
-- The company. `gstin` is the key: a second purchase on the same GSTIN adds to
-- the existing org (name / address / admin_email are left as first set).
CREATE TABLE academy_organizations (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  gstin              TEXT NOT NULL UNIQUE,
  registered_address TEXT NOT NULL,
  admin_email        TEXT NOT NULL,        -- lower(); the seat manager. A signed-in
                                           -- learner whose email matches is the admin.
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_academy_org_admin_email ON academy_organizations (lower(admin_email));

-- ── academy_course_seats ─────────────────────────────────────────────────
-- One row per (org, course). A repeat purchase of the same course tops up
-- `seats_purchased`. `seats_assigned` is the denormalised count of currently
-- 'assigned' rows in academy_seat_assignments — kept for the FOR UPDATE pool
-- check, mirroring organizations.credits_allocated.
CREATE TABLE academy_course_seats (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES academy_organizations(id) ON DELETE CASCADE,
  course_id        TEXT NOT NULL,          -- Sanity course._id
  course_slug      TEXT NOT NULL,          -- snapshot
  course_title     TEXT NOT NULL,          -- snapshot
  seats_purchased  INTEGER NOT NULL DEFAULT 0 CHECK (seats_purchased >= 0),
  seats_assigned   INTEGER NOT NULL DEFAULT 0 CHECK (seats_assigned >= 0),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_academy_seats_assigned_le_purchased CHECK (seats_assigned <= seats_purchased),
  UNIQUE (organization_id, course_id)
);

-- ── academy_seat_assignments ─────────────────────────────────────────────
-- One row per assignment. Revoke flips `status` to 'revoked' (never deleted —
-- the ledger stays complete for the usage report). A given email can hold at
-- most one 'assigned' row per course_seats row (enforced by a partial unique
-- index).
CREATE TABLE academy_seat_assignments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES academy_organizations(id) ON DELETE CASCADE,
  course_seats_id  UUID NOT NULL REFERENCES academy_course_seats(id) ON DELETE CASCADE,
  email            TEXT NOT NULL,          -- lower()
  learner_id       TEXT,                   -- Sanity learnerRecord._id
  status           TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN ('assigned', 'revoked')),
  assigned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at       TIMESTAMPTZ
);
CREATE INDEX idx_academy_assign_seats_email
  ON academy_seat_assignments (course_seats_id, lower(email));
CREATE UNIQUE INDEX idx_academy_assign_one_active_per_seat
  ON academy_seat_assignments (course_seats_id, lower(email))
  WHERE status = 'assigned';

-- ── academy_corp_purchases ───────────────────────────────────────────────
-- The purchase-fulfilment idempotency guard (mirrors
-- idx_credit_txn_org_purchase_payment for OKR Ally). One row per Razorpay
-- payment. `note` carries a "[INVOICE NOT ISSUED — …]" marker when the GST
-- invoice failed to issue (the one step with no automatic retry).
CREATE TABLE academy_corp_purchases (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES academy_organizations(id) ON DELETE CASCADE,
  razorpay_payment_id TEXT NOT NULL UNIQUE,
  razorpay_order_id   TEXT,
  course_id           TEXT NOT NULL,
  seats               INTEGER NOT NULL CHECK (seats > 0),
  list_price          INTEGER NOT NULL,    -- INR excl. GST, undiscounted (course price * seats)
  base_amount         INTEGER NOT NULL,    -- INR excl. GST, after any coupon
  gst_amount          INTEGER NOT NULL,
  total_amount        INTEGER NOT NULL,
  coupon_code         TEXT,
  invoice_number      TEXT,
  note                TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
