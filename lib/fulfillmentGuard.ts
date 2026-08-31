/**
 * Guardrail: a non-production process must never silently make durable
 * PRODUCTION writes on the back of a payment.
 *
 * `.env.local` in this repo carries the REAL production `DATABASE_URL`,
 * `SANITY_API_TOKEN` and `BLOB_READ_WRITE_TOKEN`, so `next dev` (NODE_ENV
 * "development") talks straight to prod. On 2026-08-31 a local webhook test
 * with a fake payment id (`pay_TEST123`) flowed all the way through and created
 * a real GST invoice + Blob PDF and consumed an invoice number. This stops a
 * repeat.
 *
 * Call `assertFulfillmentAllowed()` at the top of any code path that, as part
 * of fulfilling a payment, creates an invoice, uploads a Blob, grants credits,
 * or writes a submission/review. Two independent checks:
 *
 *   1. Environment — must be real production (`NODE_ENV === 'production'` and
 *      not a Vercel preview), UNLESS `ALLOW_NONPROD_FULFILLMENT=1` is set
 *      explicitly. Playwright sets it for the e2e servers; a developer running
 *      a deliberate local end-to-end test sets it knowingly.
 *
 *   2. Id plausibility — any Razorpay id passed must look real
 *      (`pay_` / `plink_` / `order_` + ≥10 alphanumerics). Catches obviously
 *      synthetic ids (`pay_TEST123`) in ANY environment, prod included.
 */

const RAZORPAY_ID_RE = /^(pay|plink|order|cust|inv)_[A-Za-z0-9]{10,}$/

export class FulfillmentBlockedError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FulfillmentBlockedError'
  }
}

/** Non-null reason string when fulfillment must be blocked, else null. */
export function fulfillmentBlockedReason(): string | null {
  if (process.env.ALLOW_NONPROD_FULFILLMENT === '1') return null
  if (process.env.NODE_ENV !== 'production') {
    return `NODE_ENV=${process.env.NODE_ENV ?? 'undefined'} (not production)`
  }
  if (process.env.VERCEL_ENV === 'preview') return 'VERCEL_ENV=preview'
  return null
}

export function assertFulfillmentAllowed(
  context: string,
  ...razorpayIds: (string | null | undefined)[]
): void {
  const blocked = fulfillmentBlockedReason()
  if (blocked) {
    throw new FulfillmentBlockedError(
      `${context}: fulfillment blocked — ${blocked}. ` +
        `Set ALLOW_NONPROD_FULFILLMENT=1 only for a deliberate test against a scratch dataset.`
    )
  }
  for (const id of razorpayIds) {
    if (id != null && id !== '' && !RAZORPAY_ID_RE.test(id)) {
      throw new FulfillmentBlockedError(`${context}: refusing implausible Razorpay id "${id}"`)
    }
  }
}
