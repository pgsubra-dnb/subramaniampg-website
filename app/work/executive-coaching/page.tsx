import Image from 'next/image'
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

const WHO_FOR = [
  'Founders navigating the complexity of scaling their organisations',
  'CXOs stepping into new roles or handling significant transitions',
  'Senior leaders dealing with high-stakes decisions with limited sounding boards',
  'Professionals seeking to sharpen leadership clarity, influence, and executive presence',
]

const PHASES = [
  {
    num: 1,
    name: 'Discovery',
    color: '#FAEEDA',
    textColor: '#633806',
    badge: null,
    activities: [
      '2 sessions with Coachee (1 to 1.5 hrs each)',
      '1 session with Manager or Sponsor (1 to 1.5 hrs)',
      '360 feedback from 10 to 15 respondents at 45 minutes each',
      'VIA online psychometric assessment',
    ],
  },
  {
    num: 2,
    name: 'Development Planning',
    color: '#E1F5EE',
    textColor: '#0D6E4E',
    badge: null,
    activities: [
      '2 sessions with Coachee to plan development areas (1 to 1.5 hrs each)',
      '1 joint session with Sponsor or Manager to firm up goals (30 to 45 minutes)',
    ],
  },
  {
    num: 3,
    name: 'Coaching',
    color: '#EEEDFE',
    textColor: '#4F46E5',
    badge: '12 to 16 weeks',
    activities: [
      'Weekly touch base sessions (30 minutes each)',
      'Extended sessions as needed for major changes',
      'Intermediate update reviews with Sponsor when required',
    ],
  },
  {
    num: 4,
    name: 'Conclusion',
    color: '#FAEEDA',
    textColor: '#633806',
    badge: null,
    activities: [
      '2 sessions with Coachee (1 to 1.5 hrs each)',
      'Closing 360 feedback from 50% of original respondents (30 minutes each, Manager mandatory)',
      'Concluding session with Manager and / or Sponsor (1 hour)',
    ],
  },
]

const FOCUS_AREAS = [
  'Leadership style and blind spot identification',
  'Decision-making under complexity and uncertainty',
  'Stakeholder management and influence strategies',
  'Transition into new roles or business pivots',
  'Building personal clarity, focus, and executive presence',
  'Accountability structures for personal and professional goals',
]

const FOUNDATIONS = [
  'Ancient wisdom traditions including the Bhagavad Gita and Yoga Sutras',
  'Modern coaching frameworks aligned with ICF standards',
  'Psychometric tools including VIA Character Strengths and MBTI',
  'Real-world executive experience across four decades and multiple industries',
]

export default function ExecutiveCoachingPage() {
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
          <span className="text-[#2C2C2A] font-medium">Executive Coaching</span>
        </nav>
      </div>

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-16 lg:pt-14 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-10 items-center">

          {/* Left — text */}
          <div>
            {/* Mobile photo */}
            <div className="mb-8 lg:hidden">
              <Image
                src="/images/PGS in Video call.png"
                alt="Subramaniam P G — Executive Coach in a coaching session"
                width={900}
                height={598}
                className="rounded-2xl w-full h-auto"
                priority
              />
            </div>
            <p className="section-label mb-6">EXECUTIVE COACHING</p>
            <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
              1-1 Executive Coaching
            </h1>
            <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Enabling Growth. Purposefully.</p>
            <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-xl mb-10">
              A trusted thinking partner for founders and CXOs navigating growth, transition, and complexity.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="https://cal.id/pgs/short-discussion"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#633806] text-white font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
              >
                Book a discovery call
                <ArrowIcon />
              </a>
              <a
                href="/work"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-[#2C2C2A]/20 text-[#5F5E5A] font-medium rounded-lg hover:border-[#633806] hover:text-[#633806] transition-colors"
              >
                ← All services
              </a>
            </div>
          </div>

          {/* Right — photo (desktop) */}
          <div className="hidden lg:flex justify-end">
            <Image
              src="/images/PGS in Video call.png"
              alt="Subramaniam P G — Executive Coach in a coaching session"
              width={900}
              height={598}
              className="rounded-2xl w-[420px] h-auto"
              priority
            />
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

      <Divider />

      {/* ── Development Journey ───────────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="section-label mb-4">PROCESS</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              Your development journey
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-6">
            {PHASES.map((phase) => (
              <div
                key={phase.num}
                className="rounded-2xl overflow-hidden border"
                style={{ borderColor: '#E8E4DC' }}
              >
                {/* Phase header */}
                <div
                  className="flex items-center justify-between px-7 py-4"
                  style={{ backgroundColor: phase.color }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="font-lora text-3xl font-bold leading-none select-none opacity-40"
                      style={{ color: phase.textColor }}
                    >
                      {String(phase.num).padStart(2, '0')}
                    </span>
                    <h3
                      className="font-lora text-lg font-bold"
                      style={{ color: phase.textColor }}
                    >
                      {phase.name}
                    </h3>
                  </div>
                  {phase.badge && (
                    <span
                      className="text-xs font-semibold px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: phase.textColor + '18', color: phase.textColor }}
                    >
                      {phase.badge}
                    </span>
                  )}
                </div>
                {/* Activities */}
                <div className="px-7 py-6 bg-white">
                  <ul className="space-y-3">
                    {phase.activities.map((activity) => (
                      <li key={activity} className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-[#5F5E5A] text-base leading-relaxed">{activity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Areas of focus ────────────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="section-label mb-4">SCOPE</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              Areas of focus
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
            {FOCUS_AREAS.map((area, idx) => (
              <div
                key={area}
                className="flex items-start gap-4 p-6 rounded-2xl bg-white border"
                style={{ borderColor: '#E8E4DC' }}
              >
                <span
                  className="font-lora text-2xl font-bold leading-none shrink-0 select-none"
                  style={{ color: '#63380620' }}
                >
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <p className="text-[#2C2C2A] text-sm leading-relaxed">{area}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Coaching draws from ───────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#1D9E75' }}>
              FOUNDATIONS
            </p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white">
              The coaching draws from
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
            {FOUNDATIONS.map((item) => (
              <div
                key={item}
                className="flex items-start gap-4 p-6 rounded-2xl"
                style={{ backgroundColor: '#ffffff0d', border: '1px solid #ffffff14' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                  style={{ backgroundColor: '#63380630' }}
                >
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4" style={{ color: '#FAEEDA' }}>
                    <path fillRule="evenodd" d="M10 2a.75.75 0 0 1 .75.75v.258a33.186 33.186 0 0 1 6.668.83.75.75 0 0 1-.336 1.461 31.28 31.28 0 0 0-1.103-.232l1.702 7.545a.75.75 0 0 1-.387.832A4.981 4.981 0 0 1 15 14c-.825 0-1.606-.2-2.294-.556a.75.75 0 0 1-.387-.832l1.77-7.849a31.743 31.743 0 0 0-3.339-.254v11.505a20.01 20.01 0 0 1 3.78.501.75.75 0 1 1-.339 1.462A18.51 18.51 0 0 0 10 17.5c-1.442 0-2.845.165-4.191.477a.75.75 0 0 1-.338-1.462 20.01 20.01 0 0 1 3.779-.501V4.509a31.742 31.742 0 0 0-3.339.254l1.77 7.85a.75.75 0 0 1-.387.83A4.98 4.98 0 0 1 5 14a4.98 4.98 0 0 1-2.294-.556.75.75 0 0 1-.387-.832L4.02 5.067c-.37.071-.733.149-1.103.232a.75.75 0 0 1-.336-1.462 33.186 33.186 0 0 1 6.668-.829V2.75A.75.75 0 0 1 10 2Z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-white/80 text-sm leading-relaxed">{item}</p>
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
              Ready to begin your development journey?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Every engagement starts with a simple conversation.
            </p>
            <a
              href="https://cal.id/pgs/short-discussion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Book a discovery call
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
