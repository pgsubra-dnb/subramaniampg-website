/**
 * Paid consulting booking — single source of truth.
 *
 * PGS offers dedicated advisory time billed at ₹1,000 per 30 minutes, booked and
 * paid through Cal.id event types that have Razorpay enabled. The canonical page
 * that explains this and lets a visitor pick a duration is `/work/book-consulting`
 * (see `app/work/book-consulting/`). Every "book a consulting session" CTA on the
 * site links to that page — nothing hardcodes a Cal.id URL any more.
 *
 * To add a duration (e.g. 120 min), add one entry to CONSULTING_SLOTS.
 */

export const RATE_PER_30_MIN_INR = 1000

/** Internal path of the canonical booking page. */
export const BOOK_CONSULTING_PATH = '/work/book-consulting'

/** The existing free, no-commitment intro call — kept as a secondary option. */
export const FREE_INTRO_URL = 'https://cal.id/pgs/short-discussion'
export const FREE_INTRO_MINUTES = 15

export type ConsultingSlot = {
  /** Session length in minutes. Always a multiple of 30. */
  minutes: number
  /** Price in INR = minutes / 30 * RATE_PER_30_MIN_INR. */
  priceInr: number
  /**
   * The Razorpay-enabled Cal.id event-type URL for this exact duration.
   * `null` while the event type has not been configured yet — the booking page
   * renders that option as disabled ("booking link coming soon").
   */
  calUrl: string | null
}

// ────────────────────────────────────────────────────────────────────────────
// TODO(PGS): replace each `calUrl: null` with the real Cal.id event-type URL
// once the 30 / 60 / 90-minute PAID events are created with Razorpay enabled on
// each one. Until then the booking page shows the option but disables its CTA.
// ────────────────────────────────────────────────────────────────────────────
export const CONSULTING_SLOTS: ConsultingSlot[] = [
  { minutes: 30, priceInr: 1000, calUrl: null /* e.g. 'https://cal.id/pgs/consulting-30' */ },
  { minutes: 60, priceInr: 2000, calUrl: null /* e.g. 'https://cal.id/pgs/consulting-60' */ },
  { minutes: 90, priceInr: 3000, calUrl: null /* e.g. 'https://cal.id/pgs/consulting-90' */ },
]

// Dev-time sanity check that price and duration stay in step.
if (process.env.NODE_ENV !== 'production') {
  for (const slot of CONSULTING_SLOTS) {
    const expected = (slot.minutes / 30) * RATE_PER_30_MIN_INR
    if (slot.priceInr !== expected) {
      // eslint-disable-next-line no-console
      console.warn(
        `[consultingBooking] ${slot.minutes}-min slot priced ₹${slot.priceInr}, expected ₹${expected}`,
      )
    }
  }
}

/** "₹1,000", "₹2,000" — Indian digit grouping. */
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
