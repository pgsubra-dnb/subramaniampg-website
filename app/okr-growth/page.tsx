import Image from 'next/image'
import Link from 'next/link'
import StickyMobileCTA from '@/components/StickyMobileCTA'

const BASE = 'https://www.subramaniampg.guru'

export const metadata = {
  title: 'OKR-Led Execution System for Founders and CXOs | Subramaniam P G',
  description:
    'Faster, predictable revenue growth using an OKR-led execution system. Take the 2-minute OKR Health Check and see where your team actually stands.',
  alternates: { canonical: `${BASE}/okr-growth` },
  openGraph: {
    title: 'OKR-Led Execution System | Subramaniam P G',
    description:
      'Tried OKRs before and watched them fizzle out by week three? That is not an OKR problem. It is an execution problem.',
    url: `${BASE}/okr-growth`,
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'OKR Execution Coaching',
  description:
    'OKR-led execution coaching for founders and CXOs. Subramaniam P G designs and embeds OKR systems, then stays through the review cadence that determines whether they survive the quarter.',
  provider: {
    '@type': 'Person',
    name: 'Subramaniam P G',
    url: BASE,
  },
  areaServed: { '@type': 'Country', name: 'India' },
  url: `${BASE}/okr-growth`,
}

const PROBLEMS = [
  'OKRs get set, then forgotten. Quarterly goals are written in January and not looked at again until the quarter is over. By then it is too late to fix anything.',
  'Reviews do not happen, or they waste everyone’s time. Without a real review cadence, small problems quietly turn into missed quarters. You find out when it is already too late.',
  'Leadership is not actually aligned. Meetings turn into debates about priorities. Execution slows down. You end up pulling the team in different directions instead of one.',
]

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center w-full sm:w-auto px-8 py-4 rounded font-medium text-sm"
      style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
    >
      {children}
    </Link>
  )
}

function SecondaryLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-medium"
      style={{ color: '#1D9E75' }}
    >
      {children}
    </a>
  )
}

export default function OkrGrowthPage() {
  return (
    <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: '#FAF8F5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      {/* 1. Hero */}
      <section className="px-6 py-24 sm:py-20" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="relative z-10 max-w-[640px] mx-auto text-center">
          <Image
            src="/images/embiggen-logo.png"
            alt="Embiggen"
            width={995}
            height={282}
            priority
            className="mx-auto mb-8 h-auto w-[200px] sm:w-[240px]"
          />
          <h1 className="font-lora text-3xl sm:text-4xl font-bold leading-snug mb-6" style={{ color: '#2C2C2A' }}>
            I help founders and CXOs achieve faster, predictable revenue growth using an
            OKR-led execution system.
          </h1>
          <p className="text-base leading-relaxed mb-10" style={{ color: '#5F5E5A' }}>
            Tried OKRs before and watched them fizzle out by week three? That is not an OKR
            problem. It is an execution problem. Here is how we fix it.
          </p>
          <div className="flex flex-col items-center gap-4">
            <PrimaryButton href="/tools/okr-health-check">
              Take the 2-Minute OKR Health Check
            </PrimaryButton>
            <SecondaryLink href="https://cal.id/pgs/short-discussion">
              Or book a 15-minute call
            </SecondaryLink>
          </div>
        </div>
      </section>

      {/* 2. Problem */}
      <section className="px-6 py-20 sm:py-16" style={{ backgroundColor: '#FAEEDA' }}>
        <div className="relative z-10 max-w-[640px] mx-auto">
          <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>
            If any of this sounds familiar, you are not alone.
          </p>
          <div className="flex flex-col gap-4">
            {PROBLEMS.map((text) => (
              <div
                key={text}
                className="border-l-4 pl-5 py-1 text-sm leading-relaxed"
                style={{ borderColor: '#1D9E75', color: '#2C2C2A' }}
              >
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. The shift */}
      <section className="px-6 py-20 sm:py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="relative z-10 max-w-[640px] mx-auto">
          <h2 className="font-lora text-2xl font-bold mb-6" style={{ color: '#2C2C2A' }}>
            An OKR-led execution system, not another OKR template
          </h2>
          <p className="text-base leading-relaxed" style={{ color: '#5F5E5A' }}>
            Most OKR engagements stop at writing the goals. This one does not. We start with a
            diagnostic of how your team currently plans, run a hands-on workshop to set company
            and leadership OKRs together, then work one-on-one with each leader so individual
            goals connect to the bigger picture. The system stays alive through a structured
            review cadence, not a folder that gets opened once a quarter.
          </p>
        </div>
      </section>

      {/* 4. About */}
      <section className="px-6 py-20 sm:py-16" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="relative z-10 max-w-[640px] mx-auto text-center">
          <Image
            src="/images/PGS Coach.png"
            alt="Subramaniam P G"
            width={140}
            height={140}
            className="rounded-full object-cover object-top mx-auto mb-6"
            style={{ width: 140, height: 140 }}
          />
          <h2 className="font-lora text-xl font-bold mb-3" style={{ color: '#2C2C2A' }}>
            Subramaniam P G
          </h2>
          <p className="text-base leading-relaxed mb-6" style={{ color: '#5F5E5A' }}>
            Subramaniam P G helps founders and CXOs build OKR systems that survive contact with
            a real, busy quarter, not just a planning offsite.
          </p>
          <a
            href="https://linkedin.com/in/pgsubra"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium px-5 py-2.5 rounded border"
            style={{ borderColor: '#633806', color: '#633806' }}
          >
            Connect on LinkedIn
          </a>
        </div>
      </section>

      {/* 5. Proof */}
      <section className="px-6 py-20 sm:py-16" style={{ backgroundColor: '#FAEEDA' }}>
        <div className="relative z-10 max-w-[640px] mx-auto">
          <div style={{ borderRadius: '10px', overflow: 'hidden', background: '#000' }}>
            <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src="https://www.youtube.com/embed/-Sw2t-illdc?rel=0&modestbranding=1"
                title="Jaijash Tatia testimonial"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
          <p className="text-sm font-medium mt-4" style={{ color: '#2C2C2A' }}>
            Jaijash Tatia, Stucred
          </p>
          <p className="text-sm leading-relaxed mt-1" style={{ color: '#5F5E5A' }}>
            Jaijash&apos;s team went from unclear goals to everyone knowing how their work moved
            the bigger picture.
          </p>
        </div>
      </section>

      {/* 6. The offer */}
      <section className="px-6 py-20 sm:py-16" style={{ backgroundColor: '#FFFFFF' }}>
        <div className="relative z-10 max-w-[640px] mx-auto text-center">
          <h2 className="font-lora text-2xl font-bold mb-4" style={{ color: '#2C2C2A' }}>
            Will your OKRs actually survive this quarter?
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#5F5E5A' }}>
            Answer 8 questions. Get a score and a plain-English read on where your OKRs stand,
            in about 2 minutes.
          </p>
          <PrimaryButton href="/tools/okr-health-check">Get My Score</PrimaryButton>
          <p className="text-xs mt-4" style={{ color: '#5F5E5A' }}>
            We will also send a short breakdown and, if it makes sense, offer a 15-minute call
            to talk it through.
          </p>
        </div>
      </section>

      {/* 7. How we work */}
      <section className="px-6 py-20 sm:py-16" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="relative z-10 max-w-[640px] mx-auto">
          <h2 className="font-lora text-2xl font-bold mb-6" style={{ color: '#2C2C2A' }}>
            Not a consultant who trains once and disappears
          </h2>
          <p className="text-base leading-relaxed mb-8" style={{ color: '#5F5E5A' }}>
            I stay through the part that actually determines whether OKRs work: the review
            cadence. Some clients work with me for ongoing quarterly reviews. Others run one or
            two cycles with me and then continue independently. Either way, the goal is a system
            your team can run, not a dependency on me.
          </p>
          <div className="rounded-xl p-6" style={{ backgroundColor: '#FAEEDA' }}>
            <p className="text-sm leading-relaxed" style={{ color: '#2C2C2A' }}>
              I will run your review cadence with you for the full quarter. If we miss more than
              one scheduled review without a valid reason, that review month is free.
            </p>
          </div>
        </div>
      </section>

      {/* 8. Final CTA */}
      <section id="final-cta" className="px-6 py-24 sm:py-20" style={{ backgroundColor: '#FAEEDA' }}>
        <div className="relative z-10 max-w-[640px] mx-auto text-center">
          <div className="flex flex-col items-center gap-4">
            <PrimaryButton href="/tools/okr-health-check">
              Take the 2-Minute OKR Health Check
            </PrimaryButton>
            <SecondaryLink href="https://cal.id/pgs/short-discussion">
              Or book a 15-minute call
            </SecondaryLink>
          </div>
        </div>
      </section>

      <StickyMobileCTA />
    </div>
  )
}
