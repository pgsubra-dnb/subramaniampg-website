import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { confirmConsultingPayment } from '@/lib/consultingCheckout'
import { formatDuration, formatInr } from '@/lib/consultingBooking'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Booking confirmed — Subramaniam P G',
  robots: { index: false, follow: false },
}

const SUPPORT = 'pgs@embiggen.co.in'

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>
}) {
  const outcome = await confirmConsultingPayment(searchParams)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />
      <section className="max-w-3xl mx-auto px-6 py-16">
        {outcome.status === 'confirmed' && outcome.slot ? (
          <>
            <p className="text-xs font-medium tracking-widest uppercase text-[#1D9E75] mb-4">
              Payment confirmed
            </p>
            <h1 className="font-lora text-3xl font-bold text-[#2C2C2A] leading-snug mb-4">
              You&apos;re booked in — now pick a time
            </h1>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-6">
              Your payment for a {formatDuration(outcome.slot.minutes)} conversation with PGS
              ({formatInr(outcome.slot.amountInInr)}, incl. GST) is confirmed. Choose a slot that
              works for you:
            </p>
            <a
              href={outcome.slot.calUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
              style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
            >
              Pick a time for your {formatDuration(outcome.slot.minutes)} conversation →
            </a>
            <p className="text-sm text-[#5F5E5A] leading-relaxed mt-6">
              {outcome.email
                ? `A confirmation with this link${
                    outcome.invoiceNumber ? `, plus your GST invoice ${outcome.invoiceNumber},` : ' and your GST invoice'
                  } is on the way to ${outcome.email}.`
                : 'Your confirmation and GST invoice are being sent to the email you paid with.'}{' '}
              Keep the calendar link handy — you can pick your time whenever suits you.
            </p>
            <div
              className="rounded-xl p-5 text-sm leading-relaxed mt-8"
              style={{ backgroundColor: '#FAEEDA', color: '#633806', border: '1px solid #E7C9A0' }}
            >
              This time is reserved specifically for you and is non-refundable. If you need to
              reschedule, contact PGS directly at{' '}
              <a href={`mailto:${SUPPORT}`} className="font-medium underline">
                {SUPPORT}
              </a>
              .
            </div>
          </>
        ) : outcome.status === 'confirmed' ? (
          <>
            <h1 className="font-lora text-3xl font-bold text-[#2C2C2A] leading-snug mb-4">
              Your payment is confirmed
            </h1>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-6">
              Your booking link has been emailed to you — check your inbox. If it hasn&apos;t
              arrived within 15 minutes, email{' '}
              <a href={`mailto:${SUPPORT}`} className="font-medium" style={{ color: '#0F6E56' }}>
                {SUPPORT}
              </a>
              .
            </p>
          </>
        ) : outcome.status === 'pending' ? (
          <>
            <h1 className="font-lora text-3xl font-bold text-[#2C2C2A] leading-snug mb-4">
              Confirming your payment…
            </h1>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-6">
              We&apos;ve received the callback but Razorpay hasn&apos;t marked the payment complete
              yet. Refresh this page in a minute. Either way, your booking link will be emailed to
              you once the payment settles.
            </p>
            <Link href="/work/book-consulting" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
              Back to the booking page →
            </Link>
          </>
        ) : outcome.status === 'unrecognised' || outcome.status === 'error' ? (
          <>
            <h1 className="font-lora text-3xl font-bold text-[#2C2C2A] leading-snug mb-4">
              We&apos;ve got your payment
            </h1>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-6">
              Your payment went through, but we couldn&apos;t match it to a booking automatically.
              Your booking link and GST invoice will be emailed to you shortly. If nothing arrives
              within 15 minutes, email{' '}
              <a href={`mailto:${SUPPORT}`} className="font-medium" style={{ color: '#0F6E56' }}>
                {SUPPORT}
              </a>{' '}
              with your payment reference and it will be sorted straight away.
            </p>
          </>
        ) : (
          <>
            <h1 className="font-lora text-3xl font-bold text-[#2C2C2A] leading-snug mb-4">
              We couldn&apos;t verify this link
            </h1>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-6">
              This confirmation link is missing or invalid. If you&apos;ve just paid, your booking
              link will still arrive by email. Otherwise, start again from the booking page.
            </p>
            <Link href="/work/book-consulting" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
              Back to the booking page →
            </Link>
          </>
        )}
      </section>
      <Footer />
    </div>
  )
}
