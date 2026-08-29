import { getCreditsRemaining, getSiteSettings } from '@/lib/okrAlly'
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
  creditsRemaining: number
  freeReviewAvailable: boolean
  freeReviewCode: string | null
  packs: { id: string; label: string; credits: number; base: number; gst: number; total: number; perReview: number }[]
  links: { booking: string | null; substack: string | null; linkedin: string | null }
}

export async function getStatus(userId: string): Promise<OkrAllyStatus> {
  const [creditsRemaining, settings] = await Promise.all([
    getCreditsRemaining(userId),
    getSiteSettings(),
  ])

  let freeReviewAvailable = false
  if (FREE_REVIEW_COUPON) {
    const coupon = await validateCoupon(FREE_REVIEW_COUPON, userId)
    freeReviewAvailable = coupon.valid && coupon.discountPercent === 100
  }

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
