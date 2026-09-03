import CorporateClient from './CorporateClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'OKR Ally — corporate OKR Reviews',
  robots: { index: false, follow: false },
}

/**
 * Self-serve corporate review-credit bundles. Signed-in only (the Razorpay
 * order is tied to the purchaser's user id, same as every other payment path).
 */
export default function OkrAllyCorporatePage() {
  return <CorporateClient brand="okr_ally" />
}
