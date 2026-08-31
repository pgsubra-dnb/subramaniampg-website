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
   * Razorpay Payment Link (rzp.io short URL) for this exact duration — where the
   * customer pays. `null` disables the pay button ("Booking opens shortly").
   */
  razorpayPaymentLink: string | null
  /** The Payment Link's Razorpay id (plink_…), for reference / dashboard lookup. */
  razorpayPaymentLinkId: string
  /**
   * Free Cal.id event for this duration, revealed to the customer only AFTER
   * their payment is verified server-side (see lib/consultingCheckout.ts). Cal.id
   * itself has no payment gate.
   */
  calUrl: string
}

// ────────────────────────────────────────────────────────────────────────────
// Razorpay Payment Links (amounts are ₹base + 18% GST). The first set (created
// 2026-08-31, short codes pkAJGdUg/fhELv8uU/RZz1ViqS) had NO callback_url and it
// can't be patched onto an existing link, so they were CANCELLED and recreated
// 2026-08-31 with `callback_url` + `callback_method: "get"` set at creation.
// callback_url on all three verified by re-fetch =
//   https://www.subramaniampg.guru/work/book-consulting/confirmed
// Cal.id event URLs verified live 2026-08-31 (page <title> confirms each duration).
// ────────────────────────────────────────────────────────────────────────────
export const CONSULTING_SLOTS: ConsultingSlot[] = [
  {
    minutes: 30,
    amountInInr: 1180,
    razorpayPaymentLink: 'https://rzp.io/rzp/J8v6UJEI',
    razorpayPaymentLinkId: 'plink_TWK1Py3iytXubM',
    calUrl: 'https://cal.id/pgs/book-time-with-me',
  },
  {
    minutes: 60,
    amountInInr: 2360,
    razorpayPaymentLink: 'https://rzp.io/rzp/Wd191mx',
    razorpayPaymentLinkId: 'plink_TWK1QhVOyzaq0n',
    calUrl: 'https://cal.id/pgs/book-time-with-me-60-minutes',
  },
  {
    minutes: 90,
    amountInInr: 3540,
    razorpayPaymentLink: 'https://rzp.io/rzp/x1Ty1KM',
    razorpayPaymentLinkId: 'plink_TWK1RVVWiylTt5',
    calUrl: 'https://cal.id/pgs/book-time-with-me-90-minutes',
  },
]

/** The slot whose GST-inclusive amount matches `inr` exactly, or null. */
export function slotForAmountInInr(inr: number): ConsultingSlot | null {
  return CONSULTING_SLOTS.find((s) => s.amountInInr === inr) ?? null
}

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
