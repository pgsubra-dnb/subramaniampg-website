import Link from 'next/link'
import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { CONSULTING_SLOTS, formatDuration } from '@/lib/consultingBooking'
import BookConsultingClient from './BookConsultingClient'

const BASE = 'https://www.subramaniampg.guru'

export const metadata = {
  title: 'A Conversation with PGS — Subramaniam P G',
  description:
    'Book a paid one-to-one conversation with Subramaniam P G on OKRs, execution, strategy, and leadership decisions. 30-minute blocks — 30, 60, or 90 minutes. Pick a length, pay online, and pick a time.',
  alternates: { canonical: `${BASE}/work/book-consulting` },
  openGraph: {
    title: 'A Conversation with PGS | Subramaniam P G',
    description:
      'A focused, paid one-to-one conversation on OKRs, execution, and leadership decisions. 30-minute blocks.',
    url: `${BASE}/work/book-consulting`,
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'A Conversation with PGS',
  description:
    'A paid one-to-one conversation with Subramaniam P G on OKRs, execution, strategy, and leadership decisions. Booked in 30-minute blocks.',
  provider: { '@type': 'Person', name: 'Subramaniam P G', url: BASE },
  areaServed: { '@type': 'Country', name: 'India' },
  url: `${BASE}/work/book-consulting`,
  offers: CONSULTING_SLOTS.map((slot) => ({
    '@type': 'Offer',
    name: `${formatDuration(slot.minutes)} conversation with PGS`,
    price: String(slot.amountInInr),
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
          <Link href="/work" className="hover:text-[#633806]">Work</Link> / A conversation with PGS
        </p>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-2 lg:order-last flex justify-center lg:justify-end">
            <Image
              src="/images/PGS Coach.png"
              alt="Subramaniam P G — Growth Architect and Executive Coach"
              width={280}
              height={280}
              className="rounded-2xl object-cover object-top"
              style={{ width: 240, height: 240 }}
              priority
            />
          </div>

          <div className="lg:col-span-3">
            <p className="text-xs font-medium tracking-widest uppercase text-[#1D9E75] mb-4">
              Paid Consulting
            </p>
            <h1 className="font-lora text-4xl font-bold text-[#2C2C2A] leading-snug mb-6">
              A Conversation with PGS
            </h1>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-4">
              Some questions do not need a full engagement — they need a focused conversation with
              someone who has seen the pattern before. You bring the situation; Subramaniam P G
              brings two decades of implementing OKRs and coaching leadership teams. You leave with
              a clear next step.
            </p>
            <p className="text-sm text-[#5F5E5A] leading-relaxed">
              Booked in 30-minute blocks at <strong>₹1,000 per block</strong> (plus GST). Choose
              30, 60, or 90 minutes below.
            </p>
          </div>
        </div>
      </section>

      {/* Policy — seen before payment */}
      <section className="max-w-5xl mx-auto px-6 pb-6">
        <div
          className="rounded-xl p-5 text-sm leading-relaxed"
          style={{ backgroundColor: '#FAEEDA', color: '#633806', border: '1px solid #E7C9A0' }}
        >
          <strong>Before you book.</strong> This time is reserved specifically for you and is
          non-refundable. If you need to reschedule, contact PGS directly at{' '}
          <a href="mailto:pgs@embiggen.co.in" className="font-medium underline">
            pgs@embiggen.co.in
          </a>
          .
        </div>
      </section>

      {/* Selector */}
      <BookConsultingClient />

      {/* What you can use it for */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          What people bring to these conversations
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
              title: 'Pick a length',
              body: 'Choose 30, 60, or 90 minutes depending on how much ground you need to cover.',
            },
            {
              num: '02',
              title: 'Pay online',
              body: 'You are taken to a secure payment page. The amount shown includes GST.',
            },
            {
              num: '03',
              title: 'Pick a time',
              body: 'Once payment is confirmed you get the link to choose a slot. A calendar invite with the video link follows.',
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
