import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { CONSULTING_SLOTS, formatDuration } from '@/lib/consultingBooking'
import BookConsultingClient from './BookConsultingClient'

const BASE = 'https://www.subramaniampg.guru'

export const metadata = {
  title: 'Book a Consulting Session — Subramaniam P G',
  description:
    'Book dedicated advisory time with Subramaniam P G. Sessions run in 30-minute blocks at ₹1,000 per block — 30, 60, or 90 minutes. Pick a duration and a time, pay online, and get a calendar invite.',
  alternates: { canonical: `${BASE}/work/book-consulting` },
  openGraph: {
    title: 'Book a Consulting Session | Subramaniam P G',
    description:
      'Dedicated advisory time on OKRs, execution, and leadership decisions. 30-minute blocks at ₹1,000.',
    url: `${BASE}/work/book-consulting`,
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Paid Consulting Session',
  description:
    'A dedicated one-to-one consulting session with Subramaniam P G on OKRs, execution, strategy, and leadership decisions. Booked in 30-minute blocks.',
  provider: { '@type': 'Person', name: 'Subramaniam P G', url: BASE },
  areaServed: { '@type': 'Country', name: 'India' },
  url: `${BASE}/work/book-consulting`,
  offers: CONSULTING_SLOTS.map((slot) => ({
    '@type': 'Offer',
    name: `${formatDuration(slot.minutes)} consulting session`,
    price: String(slot.priceInr),
    priceCurrency: 'INR',
    url: `${BASE}/work/book-consulting`,
  })),
}

export default function BookConsultingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <NavBar />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <p className="text-sm text-[#5F5E5A]">
          <Link href="/work" className="hover:text-[#633806]">Work</Link> / Book a consulting session
        </p>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <p className="text-xs font-medium tracking-widest uppercase text-[#1D9E75] mb-4">
          Paid Consulting
        </p>
        <h1 className="font-lora text-4xl font-bold text-[#2C2C2A] leading-snug mb-6 max-w-3xl">
          Dedicated time to think through the problem in front of you
        </h1>
        <p className="text-base text-[#5F5E5A] leading-relaxed max-w-2xl mb-4">
          Some questions do not need a full engagement — they need a focused conversation with
          someone who has seen the pattern before. This is paid advisory time with Subramaniam P G:
          you bring the situation, he brings two decades of implementing OKRs and coaching
          leadership teams, and you leave with a clear next step.
        </p>
        <p className="text-sm text-[#5F5E5A] leading-relaxed max-w-2xl">
          Sessions are booked in 30-minute blocks at <strong>₹1,000 per block</strong>. Choose
          30, 60, or 90 minutes below.
        </p>
      </section>

      {/* Selector */}
      <BookConsultingClient />

      {/* What you can use it for */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          What people bring to these sessions
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'A set of draft OKRs you want pressure-tested before the quarter starts',
            'An OKR rollout that has stalled, and a decision about how to restart it',
            'A hard leadership or org-design call where you need a sounding board',
            'A strategy or growth plan you want challenged before you commit to it',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: '#1D9E75' }}
              />
              <p className="text-sm text-[#5F5E5A]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-8">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              num: '01',
              title: 'Pick a duration',
              body: 'Choose 30, 60, or 90 minutes depending on how much ground you need to cover.',
            },
            {
              num: '02',
              title: 'Choose a time and pay',
              body: 'The booking page shows available slots. Payment is collected online before the slot is confirmed.',
            },
            {
              num: '03',
              title: 'Get the invite',
              body: 'A calendar invite with the video link arrives immediately. Send any context ahead of the call.',
            },
          ].map((card) => (
            <div key={card.num} className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E4DC' }}>
              <p className="text-3xl font-medium mb-3" style={{ color: '#633806' }}>{card.num}</p>
              <p className="text-sm font-medium text-[#2C2C2A] mb-2">{card.title}</p>
              <p className="text-sm text-[#5F5E5A] leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Rescheduling */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div
          className="border rounded-lg p-4 text-sm text-[#5F5E5A] max-w-2xl"
          style={{ borderColor: '#1D9E75', backgroundColor: '#E1F5EE' }}
        >
          <strong className="text-[#0F6E56]">Rescheduling.</strong> You can reschedule from the
          link in your confirmation email. For any other change, email{' '}
          <a href="mailto:pgs@embiggen.co.in" className="font-medium text-[#0F6E56]">
            pgs@embiggen.co.in
          </a>
          .
        </div>
      </section>

      {/* Longer engagements */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-3">
          Looking for a longer engagement?
        </h2>
        <p className="text-sm text-[#5F5E5A] leading-relaxed max-w-2xl mb-4">
          If you already know you need a full OKR implementation, coaching relationship, or
          strategy programme, start with the relevant service page.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/work/okr-consulting" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
            OKR consulting →
          </Link>
          <Link href="/work/executive-coaching" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
            Executive coaching →
          </Link>
          <Link href="/work/strategy-consulting" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
            Strategy consulting →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
