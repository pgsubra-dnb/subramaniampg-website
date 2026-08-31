import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

const BASE = 'https://www.subramaniampg.guru'

export const metadata = {
  title: 'OKR Consulting India — Align Your Team Around What Matters | Subramaniam P G',
  description:
    'OKR consulting for founders and leadership teams in India. Subramaniam P G helps organisations implement OKRs that stick — creating clarity, alignment, and accountability. Based in Chennai.',
  alternates: { canonical: `${BASE}/work/okr-consulting` },
  openGraph: {
    title: 'OKR Consulting India | Subramaniam P G',
    description: 'OKR consulting for founders and leadership teams. Build the execution system your strategy deserves.',
    url: `${BASE}/work/okr-consulting`,
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'OKR Consulting',
  description:
    'OKR consulting for founders, CXOs, and leadership teams. Subramaniam P G designs and embeds OKR systems that create clarity, alignment, and accountability across organisations.',
  provider: {
    '@type': 'Person',
    name: 'Subramaniam P G',
    url: BASE,
  },
  areaServed: { '@type': 'Country', name: 'India' },
  url: `${BASE}/work/okr-consulting`,
}

export default function OkrConsultingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <NavBar />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <p className="text-sm text-[#5F5E5A]">OKR Consulting</p>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">

          {/* Left column — 3 of 5 */}
          <div className="lg:col-span-3">
            <p className="text-xs font-medium tracking-widest uppercase text-[#1D9E75] mb-4">OKR Consulting</p>
            <h1 className="font-lora text-4xl font-bold text-[#2C2C2A] leading-snug mb-6">
              Your team is working hard. Is everyone working on the right things?
            </h1>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-8">
              Most organisations have goals. Few have alignment. OKRs, when implemented well, close that gap — creating clarity on what matters, why it matters, and how every person&apos;s work connects to the bigger picture. When implemented poorly, they become one more thing your team has to fill in and forget. The difference is not the framework. It is how it is introduced, understood, and embedded into your specific organisation.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/assessment" className="bg-[#633806] text-[#FAEEDA] px-6 py-3 rounded font-medium text-sm">
                Take the free assessment →
              </Link>
              <a href="https://cal.id/pgs/short-discussion" target="_blank" rel="noopener noreferrer" className="border border-[#633806] text-[#633806] px-6 py-3 rounded font-medium text-sm">
                Book a call
              </a>
            </div>
          </div>

          {/* Right column — 2 of 5 */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-[#FAEEDA] rounded-xl p-6">
              <p className="text-xs font-medium text-[#633806] uppercase tracking-wide mb-3">The core question</p>
              <p className="font-lora text-lg text-[#2C2C2A] leading-snug">Do your people know what matters most this quarter — and why?</p>
            </div>
            <div className="bg-[#E1F5EE] rounded-xl p-6">
              <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-wide mb-3">Where to start</p>
              <p className="text-sm text-[#2C2C2A] leading-relaxed">Take the free 15-minute assessment to find out where your organisation stands before investing in any programme.</p>
            </div>
          </div>

        </div>
      </section>

      {/* Sound Familiar */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Does any of this sound familiar?
        </h2>
        <div className="flex flex-col gap-3 mb-5">
          {[
            '"We set our OKRs in January and looked at them again in March — to close them out."',
            '"Our OKRs are just our task list rewritten in a different format."',
            '"Leadership announced OKRs. Nobody explained how to write them or why."',
            '"We have twelve objectives and forty key results. Nobody knows what to focus on."',
            '"We tied OKRs to performance reviews. Now everyone plays it safe."',
            '"We tried this last year. It did not work. We are not sure we want to try again."',
          ].map((quote) => (
            <div
              key={quote}
              className="border-l-4 px-4 py-3 rounded-r-md text-sm italic text-[#5F5E5A]"
              style={{ borderColor: '#633806', backgroundColor: '#FAEEDA' }}
            >
              {quote}
            </div>
          ))}
        </div>
        <p className="text-sm text-[#5F5E5A]">
          These are not signs that OKRs do not work. They are signs that the implementation was
          not designed for your organisation.
        </p>
      </section>

      {/* The Problem */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          The problem is rarely the framework
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              num: '01',
              title: 'Not ready in the right way',
              body: 'Every organisation is at a different stage of execution maturity. A good OKR implementation starts by understanding where you are — then designs the path from there.',
            },
            {
              num: '02',
              title: 'Approach not customised',
              body: 'Generic OKR training applies the same process to every organisation regardless of size, industry, or existing practices. That is why it rarely sticks beyond the first quarter.',
            },
            {
              num: '03',
              title: 'Rollout stopped too soon',
              body: 'Without structured review, coaching, and course-correction, even well-written OKRs drift into irrelevance within weeks.',
            },
          ].map((card) => (
            <div
              key={card.num}
              className="bg-white border rounded-xl p-5"
              style={{ borderColor: '#E8E4DC' }}
            >
              <p className="text-3xl font-medium mb-3" style={{ color: '#633806' }}>
                {card.num}
              </p>
              <p className="text-sm font-medium text-[#2C2C2A] mb-2">{card.title}</p>
              <p className="text-sm text-[#5F5E5A] leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Solutions */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Here is how we address each of those problems
        </h2>
        <div className="flex flex-col gap-4 mb-5">
          {/* Row 1 */}
          <div
            className="bg-white border rounded-xl p-5 grid gap-5"
            style={{ borderColor: '#E8E4DC', gridTemplateColumns: '180px 1fr' }}
          >
            <div
              className="text-xs font-medium p-2 rounded self-start"
              style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
            >
              Organisation not ready in the right way
            </div>
            <div>
              <p className="text-sm text-[#5F5E5A] leading-relaxed mb-2">
                Before any OKR programme begins, we assess where your organisation currently
                stands. This is a design step — not a gatekeeping step. Understanding your
                execution maturity tells us what to address first and how to sequence the work.
              </p>
              <Link href="/assessment" className="text-sm font-medium" style={{ color: '#1D9E75' }}>
                Take the free assessment →
              </Link>
            </div>
          </div>

          {/* Row 2 */}
          <div
            className="bg-white border rounded-xl p-5 grid gap-5"
            style={{ borderColor: '#E8E4DC', gridTemplateColumns: '180px 1fr' }}
          >
            <div
              className="text-xs font-medium p-2 rounded self-start"
              style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
            >
              Approach not customised
            </div>
            <div>
              <p className="text-sm text-[#5F5E5A] leading-relaxed">
                Every engagement begins with a review of what your organisation already has. The
                OKR programme is then designed around that reality — not borrowed from a generic
                playbook.
              </p>
            </div>
          </div>

          {/* Row 3 */}
          <div
            className="bg-white border rounded-xl p-5 grid gap-5"
            style={{ borderColor: '#E8E4DC', gridTemplateColumns: '180px 1fr' }}
          >
            <div
              className="text-xs font-medium p-2 rounded self-start"
              style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
            >
              Rollout stopped too soon
            </div>
            <div>
              <p className="text-sm text-[#5F5E5A] leading-relaxed mb-2">
                Every engagement includes a structured review cadence and, where needed, ongoing
                coaching across quarters. The goal is an organisation that runs OKRs well on its
                own.
              </p>
              <Link
                href="/work/okr-consulting/how-we-work"
                className="text-sm font-medium"
                style={{ color: '#1D9E75' }}
              >
                See how the full engagement works →
              </Link>
            </div>
          </div>
        </div>

        {/* Info box */}
        <div
          className="border rounded-lg p-4 text-sm text-[#5F5E5A]"
          style={{ borderColor: '#1D9E75', backgroundColor: '#E1F5EE' }}
        >
          Underpinning all of this is a proprietary model that maps where your organisation is
          today and what the path forward looks like.{' '}
          <Link href="/work/okr-consulting/framework" className="font-medium" style={{ color: '#0F6E56' }}>
            Explore the Leadership Execution Scale →
          </Link>
        </div>
      </section>

      {/* Framework Snapshot */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-4">
          Start by knowing where you are
        </h2>
        <p className="text-sm text-[#5F5E5A] leading-relaxed max-w-2xl mb-6">
          The Leadership Execution Scale maps five levels — from founder-dependent execution to
          institutionalised growth. Each level has its own challenges, bottlenecks, and readiness
          markers. Knowing your level determines how we implement OKRs — what to address first,
          what to build next, and how to sequence the work.
        </p>

        {/* Staircase */}
        <div className="rounded-xl p-6 mb-3" style={{ backgroundColor: '#F1EFE8' }}>
          <div className="flex items-end gap-2" style={{ height: '200px' }}>
            {[
              { num: 1, name: 'Founder-Dependent Execution', bottleneck: 'Decision bottleneck', height: 80, bg: '#FAEEDA', border: '#633806', color: '#633806' },
              { num: 2, name: 'Functional Silos', bottleneck: 'Priority bottleneck', height: 110, bg: '#FAEEDA', border: '#633806', color: '#633806' },
              { num: 3, name: 'Structured Alignment', bottleneck: 'Information bottleneck', height: 140, bg: '#E1F5EE', border: '#1D9E75', color: '#1D9E75' },
              { num: 4, name: 'Disciplined Execution', bottleneck: 'Accountability bottleneck', height: 170, bg: '#E1F5EE', border: '#1D9E75', color: '#1D9E75' },
              { num: 5, name: 'Institutionalised Growth', bottleneck: 'Culture bottleneck', height: 200, bg: '#FAEEDA', border: '#633806', color: '#633806' },
            ].map((level) => (
              <div
                key={level.num}
                className="flex-1 rounded-t-lg flex flex-col justify-start pt-2 px-2 border"
                style={{ height: `${level.height}px`, backgroundColor: level.bg, borderColor: level.border }}
              >
                <p className="text-xl font-medium leading-none" style={{ color: level.color }}>
                  {level.num}
                </p>
                <p className="text-[10px] font-medium text-[#2C2C2A] mt-1 leading-tight">
                  {level.name}
                </p>
                <p className="text-[9px] text-[#5F5E5A] mt-1 leading-tight">{level.bottleneck}</p>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-[#5F5E5A] text-center mt-3 mb-4">
          The assessment tells you your level. The engagement is designed around it.
        </p>
        <Link
          href="/work/okr-consulting/framework"
          className="text-sm font-medium"
          style={{ color: '#1D9E75' }}
        >
          Explore the full framework →
        </Link>
      </section>

      {/* How We Work Snapshot */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-8">
          A structured path, designed around you
        </h2>

        <div
          className="grid items-center mb-8"
          style={{ gridTemplateColumns: '1fr 32px 1fr 32px 1fr' }}
        >
          {/* Card 1 — Assess */}
          <div className="bg-white border rounded-xl p-5 text-center" style={{ borderColor: '#E8E4DC' }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#FAEEDA' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#633806" strokeWidth="1.8" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H7a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-2M9 3a2 2 0 0 1 4 0M9 3h6m-3 13v4m0 0H9m3 0h3" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">Assess</p>
            <p className="text-[11px] text-[#5F5E5A] leading-snug">
              Understand where your organisation stands before deciding the path forward
            </p>
          </div>

          <p className="text-xl text-center" style={{ color: '#B4B2A9' }}>→</p>

          {/* Card 2 — Implement */}
          <div className="bg-white border rounded-xl p-5 text-center" style={{ borderColor: '#E8E4DC' }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#E1F5EE' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.65-4.65 2.822-2.822a1.04 1.04 0 0 1 1.473 1.473L17.07 9.57M14.598 10.52l-1.18-1.181" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">Implement</p>
            <p className="text-[11px] text-[#5F5E5A] leading-snug">
              Design and run your first OKR cycle with expert guidance throughout
            </p>
          </div>

          <p className="text-xl text-center" style={{ color: '#B4B2A9' }}>→</p>

          {/* Card 3 — Coach and Mentor */}
          <div className="bg-white border rounded-xl p-5 text-center" style={{ borderColor: '#E8E4DC' }}>
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
              style={{ backgroundColor: '#FAEEDA' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="#633806" strokeWidth="1.8" className="w-5 h-5">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">Coach and mentor</p>
            <p className="text-[11px] text-[#5F5E5A] leading-snug">
              Sustain the practice, adjust as the organisation evolves, build internal capability
            </p>
          </div>
        </div>

        <p className="text-sm text-[#5F5E5A] mb-3">
          Each stage is a separate engagement. You choose where to start.
        </p>
        <Link
          href="/work/okr-consulting/how-we-work"
          className="text-sm font-medium"
          style={{ color: '#1D9E75' }}
        >
          See how each stage works in detail →
        </Link>
      </section>

      {/* Testimonial */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          What changes when OKRs are implemented well
        </h2>
        <div className="rounded-xl p-7" style={{ backgroundColor: '#FAEEDA' }}>
          <p className="font-serif text-6xl leading-none mb-2 opacity-40" style={{ color: '#633806' }}>
            &ldquo;
          </p>
          <p className="text-sm text-[#2C2C2A] leading-relaxed italic">
            From the beginning, he helped bring a lot of clarity and alignment to our goals.
            Everyone on the team finally understood how their individual work tied into the bigger
            picture. His advice was not just theory or jargon — it was practical, actionable, and
            easy to implement.
          </p>
          <p className="text-sm text-[#2C2C2A] leading-relaxed italic mt-3">
            PGS took the time to understand our business and customise his approach to fit our
            specific needs — which made all the difference. We have actually seen results. There
            has been a noticeable shift in focus and collaboration across teams.
          </p>
          <p className="text-xs text-[#5F5E5A] font-medium mt-4">
            — Founder / CEO, FinTech Company, India
          </p>
          <a
            href="https://www.youtube.com/shorts/-Sw2t-illdc"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium mt-3"
            style={{ color: '#1D9E75' }}
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M6.3 2.841A1.5 1.5 0 0 0 4 4.11v11.78a1.5 1.5 0 0 0 2.3 1.269l9.344-5.89a1.5 1.5 0 0 0 0-2.538L6.3 2.84Z" />
            </svg>
            Watch the video →
          </a>
        </div>
      </section>

      {/* Who This Is For */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Is this right for you?
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Founders and CEOs who want their teams aligned around clear priorities',
            'Organisations that have tried OKRs before and want to understand what went wrong',
            'Companies introducing OKRs for the first time and want to do it correctly',
            'Teams where strategy and execution feel disconnected',
            'Leaders whose goals are set at the start of the quarter and forgotten by the end',
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

      {/* Before You Decide */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Not ready to commit? Start here.
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {/* Card 1 */}
          <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E4DC' }}>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">Free self-assessment</p>
            <p className="text-xs text-[#5F5E5A] leading-relaxed mb-3">
              Takes fifteen minutes. No commitment. You get your organisation&apos;s execution
              maturity level with a clear explanation of what it means for your OKR journey.
            </p>
            <Link
              href="/assessment"
              className="inline-flex items-center px-5 py-2.5 rounded text-sm font-medium"
              style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
            >
              Take the assessment →
            </Link>
          </div>

          {/* Card 2 */}
          <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E4DC' }}>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">Free resources</p>
            <p className="text-xs text-[#5F5E5A] leading-relaxed mb-3">
              Guides on goal-setting, OKR design, and execution planning — for teams in research
              mode before committing to a programme.
            </p>
            <Link
              href="/resources"
              className="inline-flex items-center px-5 py-2.5 rounded text-sm font-medium border"
              style={{ borderColor: '#633806', color: '#633806' }}
            >
              Browse resources →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#2C2C2A' }}>
          <h2 className="font-lora text-2xl font-bold mb-3" style={{ color: '#FAEEDA' }}>
            Ready to talk?
          </h2>
          <p className="text-sm mb-5" style={{ color: '#B4B2A9' }}>
            If you have a sense of what you need and want to explore how we can work together, a
            short call is the best next step.
          </p>
          <Link
            href="/work/book-consulting"
            className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
            style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
          >
            Book a conversation with PGS →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
