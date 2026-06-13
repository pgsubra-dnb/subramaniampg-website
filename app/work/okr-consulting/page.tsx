import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#1D9E75' }}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
)

const Divider = () => (
  <div className="w-full h-px" style={{ backgroundColor: '#E8E4DC' }} />
)

const LEVELS = [
  {
    num: 1,
    name: 'Founder-Dependent Execution',
    description: 'Everything runs through the founder. No system works without their involvement.',
    bottleneck: 'Decision',
    borderColor: '#D3D1C7',
  },
  {
    num: 2,
    name: 'Functional Silos',
    description: 'Teams operate independently. Goals exist but are not connected. No cross-functional alignment.',
    bottleneck: 'Priority',
    borderColor: '#D3D1C7',
  },
  {
    num: 3,
    name: 'Structured Alignment',
    description: 'Leadership team shares priorities. OKRs can be introduced here. Some execution rhythm exists.',
    bottleneck: 'Information',
    highlight: true,
    borderColor: '#1D9E75',
  },
  {
    num: 4,
    name: 'Disciplined Execution',
    description: 'OKRs are embedded. Teams hold each other accountable. Data drives decisions.',
    bottleneck: 'Accountability',
    highlight: true,
    borderColor: '#1D9E75',
  },
  {
    num: 5,
    name: 'Institutionalised Growth',
    description: 'Execution is a competitive advantage. The system runs without the founder in the room.',
    bottleneck: 'Culture',
    borderColor: '#633806',
  },
]

const PHASES = [
  {
    num: 1,
    name: 'Diagnose',
    description: 'Understand current goals, alignment gaps, and leadership readiness using the Leadership Execution Scale',
  },
  {
    num: 2,
    name: 'Design',
    description: 'Co-create the OKR architecture with the leadership team',
  },
  {
    num: 3,
    name: 'Cascade',
    description: 'Roll out across departments and teams with clarity on ownership',
  },
  {
    num: 4,
    name: 'Rhythm',
    description: 'Establish check-in cadence, scoring discipline, and quarterly review rituals',
  },
  {
    num: 5,
    name: 'Sustain',
    description: 'Quarterly health checks and coaching to keep the system working over time',
  },
]

const INCLUDED = [
  'Leadership Execution Scale diagnostic with the leadership team',
  'OKR design workshops for leadership teams',
  'Cascade planning across departments and teams',
  'Check-in cadence and scoring rhythm design',
  'RACI clarity for goal ownership and accountability',
  'Quarterly review facilitation',
  'OKR health assessment for existing implementations',
  'Coaching support for OKR champions',
]

const WHO_FOR = [
  'Leadership teams launching OKRs for the first time',
  'Organisations where a previous OKR implementation has stalled or failed',
  'Companies scaling rapidly and needing better alignment across teams',
  'Founders who want strategy to connect to daily execution',
]

export default function OkrConsultingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Breadcrumb ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[#5F5E5A]">
          <a href="/" className="hover:text-[#633806] transition-colors">Home</a>
          <span className="text-[#2C2C2A]/30">/</span>
          <a href="/work" className="hover:text-[#633806] transition-colors">Work</a>
          <span className="text-[#2C2C2A]/30">/</span>
          <span className="text-[#2C2C2A] font-medium">OKR Consulting</span>
        </nav>
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-16 lg:pt-14 lg:pb-20 text-center">
        <p className="section-label mb-6">OKR CONSULTING</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
          Align your organisation around what matters most
        </h1>
        <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Growth by Design, Not by Chance.</p>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl mx-auto mb-10">
          OKR consulting that goes beyond the framework — building the execution discipline and
          leadership accountability that turns strategy into measurable outcomes.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#633806] text-white font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
          >
            Let&apos;s discuss this
            <ArrowIcon />
          </a>
          <a
            href="/work"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2C2C2A]/20 text-[#5F5E5A] font-medium rounded-lg hover:border-[#633806] hover:text-[#633806] transition-colors"
          >
            ← All services
          </a>
        </div>
      </section>

      <Divider />

      {/* ── Leadership Execution Scale ────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-4">
            <p className="section-label mb-4">DIAGNOSTIC</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-6">
              Where does your organisation stand?
            </h2>
          </div>
          <p className="text-[#5F5E5A] leading-relaxed max-w-3xl mx-auto text-center mb-12">
            Before implementing OKRs it is critical to understand where your organisation is on the
            execution maturity curve. The Leadership Execution Scale is a proprietary diagnostic
            framework to assess organisational execution maturity across five levels. OKRs are a
            Level 3 to 4 mechanism. Introducing them at Level 1 or 2 is one of the primary reasons
            OKR implementations fail.
          </p>

          {/* Growth Staircase */}
          <div className="max-w-3xl mx-auto mb-3 overflow-x-auto">
            <div className="flex items-end gap-1.5" style={{ minWidth: '540px' }}>
              {LEVELS.map((level, i) => {
                const heightPx = 160 + i * 40;
                return (
                  <div
                    key={level.num}
                    className="flex flex-col p-4 rounded-t-2xl"
                    style={{
                      flex: '1 1 0',
                      minWidth: '96px',
                      height: `${heightPx}px`,
                      backgroundColor: level.highlight ? '#E3F5EF' : '#FAF8F5',
                      border: level.highlight
                        ? '2px solid #1D9E75'
                        : '1px solid #E8E4DC',
                      borderBottom: 'none',
                    }}
                  >
                    <span
                      className="font-lora font-bold leading-none mb-2 block"
                      style={{ color: '#633806', fontSize: '2rem' }}
                    >
                      {level.num}
                    </span>
                    <span
                      className="font-bold text-xs leading-snug block"
                      style={{ color: '#2C2C2A' }}
                    >
                      {level.name}
                    </span>
                    <span
                      className="mt-auto pt-3 text-xs font-medium block"
                      style={{ color: '#1D9E75' }}
                    >
                      {level.bottleneck} Bottleneck
                    </span>
                  </div>
                );
              })}
            </div>
            <div style={{ height: '2px', backgroundColor: '#E8E4DC' }} />
          </div>
          <p
            className="max-w-3xl mx-auto text-center text-sm font-medium mb-10"
            style={{ color: '#5F5E5A' }}
          >
            OKRs are most effective at Level 3 and Level 4.
          </p>

          {/* Assessment CTA box */}
          <div
            className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 p-7 rounded-2xl border"
            style={{ backgroundColor: '#ffffff', borderColor: '#E8E4DC' }}
          >
            <p className="text-[#2C2C2A] font-medium leading-relaxed">
              Take the Leadership Execution Scale assessment — 10 questions, instant personalised report.
            </p>
            <a
              href="/assessment"
              className="shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-[#633806] text-white text-sm font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
            >
              Take the assessment
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* ── Why OKRs fail ─────────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-4">CONTEXT</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-6">
              The real problem with OKRs
            </h2>
            <p className="text-[#5F5E5A] leading-relaxed text-lg">
              Most organisations treat OKRs as a goal-setting exercise. They install the framework,
              run a workshop, and expect alignment to follow. It rarely does. OKRs fail when they
              are disconnected from strategy, when leadership does not model them, when the cadence
              breaks down after the first quarter, or when teams see them as a compliance activity
              rather than a thinking tool. Subramaniam P G has spent two decades diagnosing these
              failure patterns and designing OKR implementations that actually stick.
            </p>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Five phase approach ───────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="section-label mb-4">APPROACH</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              How we work
            </h2>
          </div>

          {/* Vertical stepped layout */}
          <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden border" style={{ borderColor: '#E8E4DC' }}>
            {PHASES.map((phase, idx) => (
              <div
                key={phase.num}
                className="flex gap-8 px-8 py-8"
                style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#FAF8F5' }}
              >
                {/* Number + vertical connector */}
                <div className="flex flex-col items-center shrink-0 w-14">
                  <span
                    className="font-lora font-bold leading-none select-none"
                    style={{ fontSize: '3rem', color: '#633806', lineHeight: 1 }}
                  >
                    {phase.num}
                  </span>
                  {idx < PHASES.length - 1 && (
                    <div
                      className="flex-1 w-px mt-4"
                      style={{ backgroundColor: '#E8E4DC', minHeight: '1.5rem' }}
                    />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pt-1">
                  <h3 className="font-lora text-xl font-bold text-[#2C2C2A] mb-3">
                    {phase.name}
                  </h3>
                  <p className="text-[#5F5E5A] text-base leading-relaxed">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What is included ──────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="section-label mb-4">SCOPE</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              What is included
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {INCLUDED.map((item) => (
              <div key={item} className="flex items-start gap-3 p-5 rounded-xl border" style={{ borderColor: '#E8E4DC' }}>
                <CheckIcon />
                <span className="text-[#2C2C2A] text-sm leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Who this is for ───────────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="section-label mb-4">FIT</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              Who this is for
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {WHO_FOR.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border"
                style={{ borderColor: '#E8E4DC' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: '#FAEEDA' }}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: '#633806' }}>
                    <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5Z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-[#2C2C2A] text-sm leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#633806' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to align your organisation?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Every OKR engagement begins with a diagnostic conversation.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Let&apos;s discuss this
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
