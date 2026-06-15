import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

const CheckCircle = () => (
  <div
    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
    style={{ backgroundColor: '#E1F5EE' }}
  >
    <svg viewBox="0 0 20 20" fill="#0F6E56" className="w-3.5 h-3.5">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  </div>
)

const StepDot = () => (
  <div
    className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
    style={{ backgroundColor: '#E1F5EE' }}
  >
    <svg viewBox="0 0 20 20" fill="#0F6E56" className="w-3.5 h-3.5">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z"
        clipRule="evenodd"
      />
    </svg>
  </div>
)

export default function HowWeWorkPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <p className="text-sm text-[#5F5E5A]">
          <Link href="/work/okr-consulting" className="hover:underline">
            OKR Consulting
          </Link>
          <span className="mx-2" style={{ color: '#B4B2A9' }}>›</span>
          How We Work
        </p>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-10 pb-16">
        <p className="text-xs font-medium uppercase tracking-widest text-[#1D9E75] mb-4">
          How We Work
        </p>
        <h1 className="font-lora text-4xl font-bold text-[#2C2C2A] leading-snug mb-6 max-w-2xl">
          A structured engagement, built around your organisation
        </h1>
        <p className="text-base text-[#5F5E5A] leading-relaxed max-w-2xl">
          No two organisations are the same. The challenges of a 30-person company are different
          from those of a 200-person team. Every engagement begins with understanding what you
          already have — most organisations are already tracking something. We start from there,
          not from a blank slate.
        </p>
      </section>

      {/* Three Stages */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-3">
          Three stages. You choose where to start.
        </h2>
        <p className="text-sm text-[#5F5E5A] mb-8">
          Each stage is a separate engagement. Some organisations move through all three. Others
          come directly to implementation or coaching.
        </p>

        {/* Flow strip */}
        <div
          className="grid items-center mb-10"
          style={{ gridTemplateColumns: '1fr 28px 1fr 28px 1fr' }}
        >
          {/* Assess pill */}
          <div
            className="text-center p-3 border rounded-lg bg-white"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div className="flex justify-center mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#633806" strokeWidth="1.8" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 3H7a2 2 0 0 0-2 2v4a6 6 0 0 0 12 0V5a2 2 0 0 0-2-2h-2M9 3a2 2 0 0 1 4 0M9 3h6m-3 13v4m0 0H9m3 0h3" />
              </svg>
            </div>
            <p className="text-xs font-medium text-[#2C2C2A]">Assess</p>
          </div>

          <p className="text-center text-lg" style={{ color: '#B4B2A9' }}>→</p>

          {/* Implement pill */}
          <div
            className="text-center p-3 border rounded-lg bg-white"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div className="flex justify-center mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#0F6E56" strokeWidth="1.8" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.65-4.65 2.822-2.822a1.04 1.04 0 0 1 1.473 1.473L17.07 9.57M14.598 10.52l-1.18-1.181" />
              </svg>
            </div>
            <p className="text-xs font-medium text-[#2C2C2A]">Implement</p>
          </div>

          <p className="text-center text-lg" style={{ color: '#B4B2A9' }}>→</p>

          {/* Coach pill */}
          <div
            className="text-center p-3 border rounded-lg bg-white"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div className="flex justify-center mb-1">
              <svg viewBox="0 0 24 24" fill="none" stroke="#633806" strokeWidth="1.8" width="20" height="20">
                <circle cx="12" cy="12" r="10" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
            </div>
            <p className="text-xs font-medium text-[#2C2C2A]">Coach and mentor</p>
          </div>
        </div>

        {/* ── Stage 1: Assess ── */}
        <div className="mb-10">
          <div
            className="flex items-center gap-3 mb-4 pb-3 border-b"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium flex-shrink-0"
              style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
            >
              1
            </div>
            <div>
              <p className="font-lora text-lg font-bold text-[#2C2C2A]">Assess</p>
              <p className="text-xs text-[#5F5E5A]">Understand before you act</p>
            </div>
          </div>

          <p className="text-sm text-[#5F5E5A] leading-relaxed mb-4">
            Before deciding on an OKR path, it helps to know where you stand. The Assess stage
            gives you that clarity — either through a self-directed diagnostic or a structured
            engagement with PGS.
          </p>

          <div className="grid sm:grid-cols-2 gap-4 mb-3">
            {/* Option A */}
            <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E4DC' }}>
              <p
                className="text-[10px] uppercase tracking-wide font-medium mb-1"
                style={{ color: '#1D9E75' }}
              >
                Option A
              </p>
              <p className="text-sm font-medium text-[#2C2C2A] mb-1">Self-Assessment</p>
              <span
                className="inline-block text-[11px] px-2 py-0.5 rounded mb-3"
                style={{ backgroundColor: '#E1F5EE', color: '#0F6E56' }}
              >
                Free — no commitment
              </span>
              <p className="text-xs text-[#5F5E5A] leading-relaxed mb-4">
                A fifteen-minute diagnostic on the website. Ten questions about how your
                organisation operates. You receive your execution maturity level with an
                explanation of what it means for your OKR journey.
              </p>
              <Link
                href="/assessment"
                className="inline-flex items-center px-5 py-2.5 rounded text-sm font-medium"
                style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
              >
                Take the assessment →
              </Link>
            </div>

            {/* Option B */}
            <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E4DC' }}>
              <p
                className="text-[10px] uppercase tracking-wide font-medium mb-1"
                style={{ color: '#1D9E75' }}
              >
                Option B
              </p>
              <p className="text-sm font-medium text-[#2C2C2A] mb-1">Detailed Audit</p>
              <span
                className="inline-block text-[11px] px-2 py-0.5 rounded mb-3"
                style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
              >
                One-day structured engagement
              </span>
              <p className="text-xs text-[#5F5E5A] leading-relaxed mb-4">
                A structured one-day engagement with PGS. Includes a review of your current
                practices, a hands-on workshop with your leadership team, and a written report
                with recommended actions and proposed commercials.
              </p>
              <a
                href="https://cal.id/pgs/short-discussion"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-5 py-2.5 rounded text-sm font-medium border"
                style={{ borderColor: '#633806', color: '#633806' }}
              >
                Book a call to discuss →
              </a>
            </div>
          </div>

          <p
            className="text-xs text-[#5F5E5A] border rounded p-3"
            style={{ borderColor: '#E8E4DC' }}
          >
            You can do either option, or both, in any order. There is no fixed sequence.
          </p>
        </div>

        {/* ── Stage 2: Implement ── */}
        <div className="mb-10">
          <div
            className="flex items-center gap-3 mb-4 pb-3 border-b"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium flex-shrink-0"
              style={{ backgroundColor: '#E1F5EE', color: '#0F6E56' }}
            >
              2
            </div>
            <div>
              <p className="font-lora text-lg font-bold text-[#2C2C2A]">Implement</p>
              <p className="text-xs text-[#5F5E5A]">Design and run your first OKR cycle</p>
            </div>
          </div>

          <p className="text-sm text-[#5F5E5A] leading-relaxed mb-4">
            The Implementation stage takes your organisation through a complete first OKR cycle
            with expert guidance at every step.
          </p>

          <div className="flex flex-col gap-3 mb-5">
            {[
              'Review what you currently use for planning — OKRs, KPIs, quarterly targets, or informal goal-setting. We start from what exists, not from scratch.',
              'Conduct a hands-on workshop with your team. Participants work through the OKR process with PGS, applying it to real goals in real time.',
              'Work one-on-one with the senior leader to define company-level and leadership-level OKRs for the quarter.',
              'Conduct individual sessions with each team member to define their personal OKRs — ensuring every person has a clear line of sight to the company\'s priorities.',
              'Set up the review and tracking system — through OKR software or structured templates, depending on the organisation\'s preference and scale.',
            ].map((step) => (
              <div key={step} className="flex items-start gap-3">
                <StepDot />
                <p className="text-sm text-[#5F5E5A] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          {/* Outcomes box */}
          <div className="rounded-xl p-4 mb-4" style={{ backgroundColor: '#FAEEDA' }}>
            <p
              className="text-[10px] uppercase tracking-wide font-medium mb-2"
              style={{ color: '#633806' }}
            >
              What you have at the end
            </p>
            <div className="flex flex-col gap-2">
              {[
                'A complete first OKR cycle in place — company, leadership, and individual levels',
                'A team that understands the process and has experienced it firsthand',
                'A review cadence and tracking system ready to run',
              ].map((outcome) => (
                <div key={outcome} className="flex items-start gap-2">
                  <CheckCircle />
                  <p className="text-xs text-[#2C2C2A] leading-relaxed">{outcome}</p>
                </div>
              ))}
            </div>
          </div>

          <a
            href="https://cal.id/pgs/short-discussion"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
            style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
          >
            Book a call to discuss →
          </a>
        </div>

        {/* ── Stage 3: Coach and Mentor ── */}
        <div className="mb-10">
          <div
            className="flex items-center gap-3 mb-4 pb-3 border-b"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-base font-medium flex-shrink-0"
              style={{ backgroundColor: '#2C2C2A', color: '#FAEEDA' }}
            >
              3
            </div>
            <div>
              <p className="font-lora text-lg font-bold text-[#2C2C2A]">Coach and Mentor</p>
              <p className="text-xs text-[#5F5E5A]">Sustain the journey</p>
            </div>
          </div>

          <p className="text-sm text-[#5F5E5A] leading-relaxed mb-4">
            The first OKR cycle is the hardest. The second is where most organisations either
            embed the practice or let it drift. The Coach and Mentor stage exists to make sure the
            practice holds.
          </p>

          <div className="flex flex-col gap-3 mb-5">
            {[
              'Regular review sessions — typically monthly or quarterly — to assess progress, identify what is working, and make adjustments before small issues become patterns.',
              'Course-correction when priorities shift. Business conditions change. The coaching relationship ensures OKRs evolve with the organisation rather than becoming rigid anchors.',
              'Mentoring for leaders building internal capability to run OKRs independently. The goal is not dependency on an external consultant — it is building confidence and skill inside the organisation.',
            ].map((step) => (
              <div key={step} className="flex items-start gap-3">
                <StepDot />
                <p className="text-sm text-[#5F5E5A] leading-relaxed">{step}</p>
              </div>
            ))}
          </div>

          <div className="grid sm:grid-cols-2 gap-3 mb-4">
            <div className="rounded-lg p-4" style={{ backgroundColor: '#F1EFE8' }}>
              <p className="text-sm font-medium text-[#2C2C2A] mb-1">Short-term engagement</p>
              <p className="text-xs text-[#5F5E5A] leading-relaxed">
                One or two quarters of coaching after implementation — to stabilise the practice
                and build confidence.
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ backgroundColor: '#F1EFE8' }}>
              <p className="text-sm font-medium text-[#2C2C2A] mb-1">Ongoing relationship</p>
              <p className="text-xs text-[#5F5E5A] leading-relaxed">
                Multiple cycles over time — for organisations that want a consistent external
                perspective as they scale.
              </p>
            </div>
          </div>

          <a
            href="https://cal.id/pgs/short-discussion"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
            style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
          >
            Book a call to discuss →
          </a>
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-xl p-10 text-center mt-10" style={{ backgroundColor: '#2C2C2A' }}>
          <h2 className="font-lora text-2xl font-bold mb-3" style={{ color: '#FAEEDA' }}>
            Not sure which stage is right for you?
          </h2>
          <p className="text-sm mb-5" style={{ color: '#B4B2A9' }}>
            A short call is the best way to figure that out. Share where you are and what you are
            trying to solve, and we will suggest the most appropriate starting point.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href="https://cal.id/pgs/short-discussion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
              style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
            >
              Book a 30-minute call →
            </a>
          </div>
          <Link
            href="/assessment"
            className="inline-block text-sm mt-3"
            style={{ color: '#9FE1CB' }}
          >
            or take the free assessment first →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
