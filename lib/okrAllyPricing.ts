import { getAvailableCredits, getSiteSettings } from '@/lib/okrAlly'
import { validateCoupon, PACKS, gstBreakdown } from '@/lib/okrAllyBilling'

/**
 * OKR Ally — pricing / eligibility status for the form's confirm screen and the
 * Pricing tab (build sequence steps 8–9).
 *
 * The free first review is a real Sanity coupon (100%-off, one-per-user). Its
 * code is configured here; the confirm screen sends it as `couponCode` to the
 * review route when `freeReviewAvailable` is true.
 */
export const FREE_REVIEW_COUPON = (process.env.OKR_ALLY_FREE_REVIEW_COUPON || '').trim().toUpperCase()

export interface OkrAllyStatus {
  /** personal + org — what "can I run a review?" checks. */
  creditsRemaining: number
  /** personal `user_credit_balance` only. */
  personalCredits: number
  /** per-organization allocated balances (kept separate from personal). */
  orgCredits: { name: string; credits: number }[]
  freeReviewAvailable: boolean
  freeReviewCode: string | null
  packs: { id: string; label: string; credits: number; base: number; gst: number; total: number; perReview: number }[]
  links: { booking: string | null; substack: string | null; linkedin: string | null }
}

export async function getStatus(userId: string): Promise<OkrAllyStatus> {
  const [credits, settings] = await Promise.all([
    getAvailableCredits(userId),
    getSiteSettings(),
  ])

  let freeReviewAvailable = false
  if (FREE_REVIEW_COUPON) {
    const coupon = await validateCoupon(FREE_REVIEW_COUPON, userId)
    freeReviewAvailable = coupon.valid && coupon.discountPercent === 100
  }

  const creditsRemaining = credits.total

  const packs = Object.values(PACKS).map((p) => {
    const b = gstBreakdown(p.basePrice)
    return {
      id: p.id,
      label: p.label,
      credits: p.credits,
      base: b.base,
      gst: b.gst,
      total: b.total,
      perReview: Math.round((p.basePrice / p.credits) * 100) / 100,
    }
  })

  return {
    creditsRemaining,
    personalCredits: credits.personal,
    orgCredits: credits.org.map((o) => ({ name: o.organizationName, credits: o.credits })),
    freeReviewAvailable,
    freeReviewCode: freeReviewAvailable ? FREE_REVIEW_COUPON : null,
    packs,
    links: {
      booking: settings.okrAllyBookingUrl,
      substack: settings.substackUrl,
      linkedin: settings.linkedinUrl,
    },
  }
}
