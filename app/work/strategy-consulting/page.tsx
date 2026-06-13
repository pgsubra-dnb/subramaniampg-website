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

const DIMENSIONS = [
  {
    num: 1,
    name: 'Direction',
    color: '#FAEEDA',
    textColor: '#633806',
    subs: [
      {
        code: '1a',
        name: 'Leadership and Purpose',
        desc: 'Direction, behaviours, governance',
        ref: 'Baldrige: Leadership / EFQM: Direction',
      },
      {
        code: '1b',
        name: 'Strategic Direction',
        desc: 'Plan, positioning, priorities',
        ref: 'Baldrige: Strategy / EFQM: Strategy',
      },
      {
        code: '1c',
        name: 'Customer and Stakeholder Focus',
        desc: 'Insight, value, engagement',
        ref: 'Baldrige: Customers / EFQM: Stakeholders',
      },
    ],
  },
  {
    num: 2,
    name: 'Execution',
    color: '#E1F5EE',
    textColor: '#0D6E4E',
    subs: [
      {
        code: '2a',
        name: 'People and Culture',
        desc: 'Talent, roles, capability, culture',
        ref: 'Baldrige: Workforce / EFQM: Culture',
      },
      {
        code: '2b',
        name: 'Operating Rhythm and Processes',
        desc: 'Annual, quarterly, monthly, weekly cadence',
        ref: 'Baldrige: Operations / EFQM: Performance',
      },
      {
        code: '2c',
        name: 'Measurement and Learning',
        desc: 'KPIs, dashboards, organisational learning',
        ref: 'Baldrige: Measurement / EFQM: Measurement',
      },
    ],
  },
  {
    num: 3,
    name: 'Results',
    color: '#EEEDFE',
    textColor: '#4F46E5',
    subs: [
      {
        code: '3a',
        name: 'Business Results',
        desc: 'Financial performance, growth, sustainability',
        ref: '',
      },
      {
        code: '3b',
        name: 'People Results',
        desc: 'Workforce engagement, capability, retention',
        ref: '',
      },
      {
        code: '3c',
        name: 'Customer Results',
        desc: 'Customer satisfaction, loyalty, stakeholder confidence',
        ref: '',
      },
      {
        code: '3d',
        name: 'Operational Results',
        desc: 'Process efficiency, quality, innovation',
        ref: '',
      },
    ],
  },
]

const RHYTHM = [
  {
    name: 'Annual alignment',
    desc: 'One to two day offsite with the full leadership team. Sets direction, priorities, strategic moves, and accountability structure for the year.',
  },
  {
    name: 'Quarterly review',
    desc: 'Half day working session. Reviews what was achieved, adjusts priorities, and resets the next 90 day plan.',
  },
  {
    name: 'Monthly pulse',
    desc: 'Shorter working session. Tracks execution, removes blockers, and adjusts where needed.',
  },
  {
    name: 'Operating rhythm design',
    desc: 'Help the team build their own weekly and fortnightly meeting cadence that keeps everyone aligned.',
  },
]

const WHAT_WE_WORK_ON = [
  'Defining your core customer, brand promise, and competitive differentiation',
  'Building a one-page strategic plan the leadership team can execute from',
  'Connecting strategy to daily work through OKRs and KPIs',
  'Designing the leadership team meeting and review rhythm',
  'Identifying and removing the top constraints to growth',
  'Succession planning and organisational structure for the next stage',
  'Building a culture of accountability and continuous improvement',
]

const WHO_FOR = [
  'Founder-led companies scaling from 50 to 500 people',
  'Family businesses professionalising their leadership structure',
  'Leadership teams that feel misaligned or stuck in execution',
  'Organisations preparing for a significant growth phase or transition',
]

export default function StrategyConsultingPage() {
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
          <span className="text-[#2C2C2A] font-medium">Strategy Consulting</span>
        </nav>
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-16 lg:pt-14 lg:pb-20 text-center">
        <p className="section-label mb-6">STRATEGY CONSULTING</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
          From vision to execution — closing the gap
        </h1>
        <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Helping Leaders Grow. Helping Organisations Grow.</p>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl mx-auto mb-10">
          Helping leadership teams build strategic clarity, alignment, and the operating rhythm
          to turn plans into results.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/contact"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#633806] text-white font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
          >
            Let&apos;s talk strategy
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

      {/* ── The problem ───────────────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl mx-auto">
            <p className="section-label mb-4">THE PROBLEM</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-6 leading-[1.15]">
              Most leadership teams are not short on ambition. They are short on alignment.
            </h2>
            <p className="text-[#5F5E5A] leading-relaxed text-lg">
              They have a vision. They have annual goals. But when you ask different members of the
              leadership team what the top three priorities are this quarter, you get five different
              answers. Strategy consulting with Subramaniam P G addresses the fundamental dimensions
              that every growing organisation must get right — drawing from the Growth Excellence
              Framework, a synthesis of the Malcolm Baldrige National Quality Award criteria, the
              EFQM Excellence Model, and leading strategy execution research.
            </p>
          </div>
        </div>
      </section>

      {/* ── Growth Excellence Framework ───────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-4">
            <p className="section-label mb-4">FRAMEWORK</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-3">
              The Growth Excellence Framework
            </h2>
            <p className="text-[#5F5E5A] max-w-2xl mx-auto leading-relaxed mb-2">
              A proprietary synthesis of Malcolm Baldrige, EFQM, and leading strategy execution research
            </p>
            <p className="text-xs text-[#5F5E5A]/60 max-w-2xl mx-auto leading-relaxed mb-12">
              The Growth Excellence Framework draws inspiration from the Malcolm Baldrige National Quality
              Award criteria, the EFQM Excellence Model, and leading strategy execution research.
            </p>
          </div>

          <div className="space-y-6">
            {DIMENSIONS.map((dim) => (
              <div key={dim.num} className="rounded-2xl overflow-hidden border" style={{ borderColor: '#E8E4DC' }}>

                {/* Dimension header — large number + prominent name */}
                <div
                  className="flex items-center gap-5 px-8 py-6"
                  style={{ backgroundColor: dim.color }}
                >
                  <span
                    className="font-lora font-bold leading-none select-none shrink-0"
                    style={{ fontSize: '3.5rem', color: dim.textColor, opacity: 0.2, lineHeight: 1 }}
                  >
                    {dim.num}
                  </span>
                  <div>
                    <p
                      className="text-xs font-bold tracking-[0.15em] uppercase mb-0.5"
                      style={{ color: dim.textColor, opacity: 0.6 }}
                    >
                      Dimension {dim.num}
                    </p>
                    <h3 className="font-lora text-2xl font-bold" style={{ color: dim.textColor }}>
                      {dim.name}
                    </h3>
                  </div>
                </div>

                {/* Sub-dimensions as table rows */}
                <div className="bg-white">
                  {dim.subs.map((sub, subIdx) => (
                    <div
                      key={sub.code}
                      className="flex items-start gap-6 px-8 py-5"
                      style={{ borderTop: subIdx > 0 ? '1px solid #E8E4DC' : 'none' }}
                    >
                      {/* Code column */}
                      <div className="w-10 shrink-0 pt-0.5">
                        <span className="text-sm font-bold uppercase" style={{ color: dim.textColor }}>
                          {sub.code.toUpperCase()}
                        </span>
                      </div>
                      {/* Name + description */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[#2C2C2A] text-base leading-snug mb-1">
                          {sub.name}
                        </p>
                        <p className="text-[#5F5E5A] text-sm leading-relaxed">{sub.desc}</p>
                      </div>
                      {/* Baldrige / EFQM reference */}
                      <div className="w-52 shrink-0 text-right hidden sm:block">
                        {sub.ref && (
                          <p className="text-xs leading-relaxed" style={{ color: '#5F5E5A99' }}>
                            {sub.ref}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            ))}
          </div>

          <p className="text-center text-sm text-[#5F5E5A]/60 italic mt-8 max-w-2xl mx-auto leading-relaxed">
            Results inform Direction, creating a continuous improvement loop at the heart of the framework.
          </p>
        </div>
      </section>

      <Divider />

      {/* ── Engagement rhythm ─────────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-4">
            <p className="section-label mb-4">HOW IT WORKS</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-6">
              How the work happens
            </h2>
          </div>
          <p className="text-[#5F5E5A] leading-relaxed max-w-3xl mx-auto text-center mb-12">
            The work happens in focused working sessions with your leadership team. The output is not
            a presentation or a report. It is a living plan your team owns and acts on.
          </p>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {RHYTHM.map((item, idx) => (
              <div
                key={item.name}
                className="p-7 rounded-2xl bg-white border"
                style={{ borderColor: '#E8E4DC' }}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="font-lora text-4xl font-bold leading-none select-none shrink-0"
                    style={{ color: '#63380618' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-semibold text-[#2C2C2A] mb-2">{item.name}</h3>
                    <p className="text-[#5F5E5A] text-sm leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What we work on ───────────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="section-label mb-4">SCOPE</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              What we work on
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {WHAT_WE_WORK_ON.map((item) => (
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
              Ready to align your team around what matters most?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Start with a conversation about where you are and where you want to go.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Let&apos;s talk strategy
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
