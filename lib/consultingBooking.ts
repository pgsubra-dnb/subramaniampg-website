/**
 * "A Conversation with PGS" — paid consulting booking. Single source of truth.
 *
 * PGS offers dedicated advisory time billed at ₹1,000 per 30 minutes plus 18%
 * GST. The customer pays through a Razorpay Payment Link (GST-inclusive amount),
 * and — once payment is verified server-side — is shown the free Cal.id event
 * for that duration to pick an actual time. The canonical page is
 * `/work/book-consulting` (see `app/work/book-consulting/`). Every "book a
 * conversation with PGS" CTA on the site links to that page.
 *
 * To add a duration (e.g. 120 min), add one entry to CONSULTING_SLOTS.
 */

export const RATE_PER_30_MIN_INR = 1000
export const GST_RATE = 0.18

/** Internal path of the canonical booking page. */
export const BOOK_CONSULTING_PATH = '/work/book-consulting'

/** The existing free, no-commitment intro call — kept as a secondary option. */
export const FREE_INTRO_URL = 'https://cal.id/pgs/short-discussion'
export const FREE_INTRO_MINUTES = 15

export type ConsultingSlot = {
  /** Session length in minutes. Always a multiple of 30. */
  minutes: number
  /**
   * The amount the customer actually pays, GST-INCLUSIVE, in INR. This is the
   * value configured on the Razorpay Payment Link. The GST invoice must
   * back-calculate: base = amountInInr / (1 + GST_RATE); gst = amountInInr - base.
   * Do NOT add GST on top of this figure.
   */
  amountInInr: number
  /**
   * Razorpay Payment Link (rzp.io short URL) for this exact duration.
   * `null` until the link's `callback_url` is confirmed/configured to point at
   * the payment-confirmation route (see below) — the booking page keeps the
   * option visible but disables its pay button until then.
   */
  razorpayPaymentLink: string | null
  /**
   * Free Cal.id event type for this duration, revealed to the customer only
   * AFTER their payment is verified. `null` until PGS creates the three events
   * and sends the URLs. Cal.id itself has no payment gate.
   */
  calUrl: string | null
}

// ────────────────────────────────────────────────────────────────────────────
// Razorpay Payment Links created 2026-08-31 (amounts are ₹base + 18% GST):
//   30 min → ₹1,180 → https://rzp.io/rzp/pkAJGdUg
//   60 min → ₹2,360 → https://rzp.io/rzp/fhELv8uU
//   90 min → ₹3,540 → https://rzp.io/rzp/RZz1ViqS
//
// BLOCKED until PGS confirms, for EACH link:
//   1. `callback_url` is set to  https://www.subramaniampg.guru/work/book-consulting/confirmed
//      with `callback_method: "get"`  (API-only field on standard Payment Links —
//      not editable from the dashboard list view; see the item-4 notes in PR #12).
//   2. The three free Cal.id event URLs (30/60/90 min) → fill `calUrl` below.
// Flip `razorpayPaymentLink` from null to the rzp.io URL once (1) is confirmed.
// ────────────────────────────────────────────────────────────────────────────
export const CONSULTING_SLOTS: ConsultingSlot[] = [
  { minutes: 30, amountInInr: 1180, razorpayPaymentLink: null /* https://rzp.io/rzp/pkAJGdUg */, calUrl: null },
  { minutes: 60, amountInInr: 2360, razorpayPaymentLink: null /* https://rzp.io/rzp/fhELv8uU */, calUrl: null },
  { minutes: 90, amountInInr: 3540, razorpayPaymentLink: null /* https://rzp.io/rzp/RZz1ViqS */, calUrl: null },
]

/** GST-inclusive → { base, gst, total }, all in INR, rounded to whole rupees. */
export function gstFromInclusive(amountInInr: number): { base: number; gst: number; total: number } {
  const base = Math.round(amountInInr / (1 + GST_RATE))
  return { base, gst: amountInInr - base, total: amountInInr }
}

// Dev-time sanity check: the inclusive amount should be (minutes/30 * rate) + GST.
if (process.env.NODE_ENV !== 'production') {
  for (const slot of CONSULTING_SLOTS) {
    const base = (slot.minutes / 30) * RATE_PER_30_MIN_INR
    const expected = Math.round(base * (1 + GST_RATE))
    if (slot.amountInInr !== expected) {
      // eslint-disable-next-line no-console
      console.warn(
        `[consultingBooking] ${slot.minutes}-min slot amount ₹${slot.amountInInr}, expected ₹${expected}`,
      )
    }
  }
}

/** "₹1,180", "₹2,360" — Indian digit grouping. */
export function formatInr(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`
}

/** "30 minutes", "1 hour", "1 hour 30 minutes". */
export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  const parts: string[] = []
  if (h) parts.push(`${h} hour${h > 1 ? 's' : ''}`)
  if (m) parts.push(`${m} minutes`)
  return parts.join(' ')
}
