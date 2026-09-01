import CorporateClient from './CorporateClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'OKR Ally — corporate credits',
  robots: { index: false, follow: false },
}

/**
 * Self-serve corporate credit bundles. Signed-in only (the Razorpay order is
 * tied to the purchaser's user id, same as every other OKR Ally payment path).
 */
export default function OkrAllyCorporatePage() {
  return <CorporateClient />
}
