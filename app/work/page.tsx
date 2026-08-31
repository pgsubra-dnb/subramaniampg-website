import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import TestimonialsCarousel from '@/components/TestimonialsCarousel'

export const metadata = {
  title: 'Work with Subramaniam P G — OKR Consulting, Executive Coaching & Strategy',
  description:
    'Three focused engagements: OKR consulting, executive coaching, and strategy consulting. Subramaniam P G works with founders, CXOs, and leadership teams across India and Asia.',
  alternates: { canonical: 'https://www.subramaniampg.guru/work' },
  openGraph: {
    title: 'Work with Subramaniam P G',
    description: 'OKR consulting, executive coaching, and strategy for founders and CXOs.',
    url: 'https://www.subramaniampg.guru/work',
  },
}

const SERVICES = [
  {
    bg: '#FAF8F5' as const,
    eyebrow: 'OKR CONSULTING',
    learnMoreHref: '/work/okr-consulting',
    heading: 'Align your organisation around what matters most',
    description:
      'Most organisations have goals. Very few have alignment. OKR consulting with Subramaniam P G goes beyond installing a framework — it builds the execution discipline, leadership accountability, and operating rhythm that turns strategy into measurable outcomes. Drawing on two decades of OKR implementation experience across industries, Subramaniam P G works with leadership teams to design OKR cycles that stick, cascade meaningfully, and drive real results.',
    included: [
      'OKR design workshops for leadership teams',
      'Cascade planning across departments and teams',
      'Check-in cadence and scoring rhythm design',
      'RACI clarity for accountability',
      'Quarterly review facilitation',
      'OKR health assessment for existing implementations',
    ],
  },
  {
    bg: '#ffffff' as const,
    eyebrow: 'EXECUTIVE COACHING',
    learnMoreHref: '/work/executive-coaching',
    heading: 'A thinking partner for the hardest decisions',
    description:
      'Leadership at the top can be isolating. The decisions are complex, the stakes are high, and the number of people you can speak openly with is small. Executive coaching with Subramaniam P G gives founders and CXOs a trusted space to think clearly, challenge assumptions, and make better decisions. Drawing from ancient wisdom traditions and modern coaching frameworks, Subramaniam P G helps leaders develop the inner clarity that drives outer results.',
    included: [
      'One on one coaching engagements for founders and CXOs',
      'Leadership style and blind spot assessment',
      'Decision-making frameworks under complexity',
      'Stakeholder management and influence strategies',
      'Transition coaching for new roles or business pivots',
      'Ongoing accountability and reflection sessions',
    ],
  },
  {
    bg: '#FAF8F5' as const,
    eyebrow: 'STRATEGY CONSULTING',
    learnMoreHref: '/work/strategy-consulting',
    heading: 'From vision to execution — closing the gap',
    description:
      'Strategy without execution is just a plan. Execution without strategy is just activity. Subramaniam P G works with leadership teams to build strategic clarity — a shared understanding of where you are going, why it matters, and how you will get there. Facilitated over focused working sessions, the output is not a deck but a living plan your team actually owns and acts on.',
    included: [
      'Strategy facilitation for leadership teams',
      'Annual planning and goal-setting workshops',
      'Business model and growth strategy reviews',
      'Competitive positioning and differentiation work',
      'Execution roadmap with clear accountability',
      'Follow-through sessions to maintain momentum',
    ],
  },
]

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#1D9E75' }}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

const Divider = () => (
  <div className="w-full h-px" style={{ backgroundColor: '#E8E4DC' }} />
)

export default function WorkPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Hero ── bg: #FAF8F5 ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20 text-center">
        <p className="section-label mb-6">HOW I CAN HELP</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-6">
          Work with Subramaniam P G
        </h1>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl mx-auto mb-4">
          Three focused engagements — each grounded in four decades of field experience
          with organisations across India and Asia.
        </p>
        <p className="text-sm italic" style={{ color: '#1D9E75' }}>Growth by Design, Not by Chance.</p>
      </section>

      <Divider />

      {/* ── Service Sections ─────────────────────────────── */}
      {SERVICES.map((service, idx) => (
        <section key={service.eyebrow} style={{ backgroundColor: service.bg }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-start">

              {/* Left — headings */}
              <div className="lg:sticky lg:top-24">
                <p className="section-label mb-4">{service.eyebrow}</p>
                <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] leading-[1.15] mb-6">
                  {service.heading}
                </h2>
                <p className="text-[#5F5E5A] leading-relaxed mb-8">
                  {service.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start flex-wrap">
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#633806] text-white text-sm font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
                  >
                    Let&apos;s discuss this
                    <ArrowIcon />
                  </a>
                  <a
                    href={service.learnMoreHref}
                    className="inline-flex items-center gap-1.5 py-3.5 text-sm font-semibold text-[#633806] hover:gap-2.5 transition-all"
                  >
                    Learn more
                    <ArrowIcon />
                  </a>
                </div>
              </div>

              {/* Right — included list */}
              <div
                className="rounded-2xl p-8 lg:p-10 border"
                style={{
                  backgroundColor: service.bg === '#FAF8F5' ? '#ffffff' : '#FAF8F5',
                  borderColor: '#E8E4DC',
                }}
              >
                <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#5F5E5A]/60 mb-6">
                  What is included
                </p>
                <ul className="space-y-4">
                  {service.included.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <CheckIcon />
                      <span className="text-[#2C2C2A] text-sm leading-relaxed">{item}</span>
                    </li>
                  ))}
                </ul>

                {/* Divider + number accent */}
                <div className="mt-8 pt-8 border-t flex items-center gap-3" style={{ borderColor: '#E8E4DC' }}>
                  <span
                    className="font-lora text-5xl font-bold leading-none select-none"
                    style={{ color: '#63380614' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="text-xs font-semibold tracking-[0.15em] uppercase text-[#5F5E5A]/40">
                    {service.eyebrow.split(' ').slice(0, 2).join(' ')}
                  </span>
                </div>
              </div>

            </div>
          </div>
          {idx < SERVICES.length - 1 && <Divider />}
        </section>
      ))}

      {/* ── Testimonials Carousel ── bg: #2C2C2A ─────────── */}
      <section style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: '#1D9E75' }}>
              In Their Words
            </p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white">
              What leaders say
            </h2>
          </div>

          <TestimonialsCarousel />
        </div>
      </section>

      {/* ── CTA ── bg: #633806 ───────────────────────────── */}
      <section style={{ backgroundColor: '#633806' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 lg:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to start a conversation?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Every engagement begins with a simple call.
            </p>
            <Link
              href="/work/book-consulting"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Book a consulting session
              <ArrowIcon />
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
