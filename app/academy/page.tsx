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

const AVAILABLE_MODULES = [
  {
    num: 1,
    slug: 'okr-foundations',
    title: 'OKR Foundations',
    description:
      'Master the principles and mechanics of effective OKR implementation. Learn how to write great OKRs, run effective check-ins, score honestly, and build the execution rhythm that keeps your organisation focused quarter after quarter.',
    learn: [
      'The difference between outputs and outcomes and why it matters',
      'How to write Objectives that inspire and Key Results that measure',
      'How to cascade OKRs from company to team to individual',
      'How to run weekly check-ins and quarterly reviews that actually work',
    ],
  },
  {
    num: 2,
    slug: 'leadership-ancient-wisdom',
    title: 'Leadership through Ancient Wisdom',
    description:
      'Draw on the Bhagavad Gita, Arthashastra, and Thirukkural to navigate modern leadership challenges with clarity and purpose. Each lesson connects a timeless principle to a contemporary leadership situation.',
    learn: [
      'How ancient Indian texts address modern leadership dilemmas',
      'The concept of Dharma applied to ethical decision-making',
      'Lessons from the Mahabharata on strategy, loyalty, and conflict',
      'How to lead with detachment and purpose simultaneously',
    ],
  },
]

const COMING_SOON_MODULES = [
  {
    num: 3,
    title: 'Executive Coaching Essentials',
    quarter: 'Q3 2026',
    description:
      'Core frameworks and conversation skills for leaders who want to coach their teams more effectively. Build the listening, questioning, and feedback skills that unlock performance in others.',
  },
  {
    num: 4,
    title: 'Strategy for Growth',
    quarter: 'Q4 2026',
    description:
      'Apply the Growth Excellence Framework to your own organisation. A structured programme for leadership teams to build strategic clarity, execution discipline, and a culture of continuous improvement.',
  },
]

const HOW_IT_WORKS = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
      </svg>
    ),
    heading: 'Self-paced learning',
    body: 'Access modules on your own schedule. No deadlines, no cohorts. Learn when it suits you.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z" />
      </svg>
    ),
    heading: 'Practical application',
    body: 'Every module includes reflection exercises, frameworks, and tools you can apply immediately in your work.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
      </svg>
    ),
    heading: 'Growing library',
    body: 'New modules added every quarter. Enrol once and access all future content in your subscription.',
  },
]

export default function AcademyPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20 text-center">
        <p className="section-label mb-6">ACADEMY</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
          Structured learning for leaders and teams
        </h1>
        <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Learning that drives growth.</p>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl mx-auto mb-10">
          Practical modules combining ancient wisdom with modern leadership practice — learn at your own pace.
        </p>
        <a
          href="#modules"
          className="inline-flex items-center gap-2 px-8 py-4 bg-[#633806] text-white font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
        >
          Explore available modules
          <ArrowIcon />
        </a>
      </section>

      <Divider />

      {/* ── Available modules ─────────────────────────────── */}
      <section id="modules" className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="section-label mb-4">MODULES</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              Our Programmes
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {AVAILABLE_MODULES.map((mod) => (
              <div
                key={mod.num}
                className="flex flex-col p-8 rounded-2xl border"
                style={{ borderColor: '#E8E4DC' }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-lora font-bold text-lg shrink-0"
                    style={{ backgroundColor: '#1D9E75', color: '#ffffff' }}
                  >
                    {mod.num}
                  </div>
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: '#E1F5EE', color: '#0D6E4E' }}
                  >
                    Coming Soon
                  </span>
                </div>

                <h3 className="font-lora text-xl font-bold text-[#2C2C2A] mb-3">
                  {mod.title}
                </h3>
                <p className="text-[#5F5E5A] text-sm leading-relaxed mb-6">
                  {mod.description}
                </p>

                {/* What you will learn */}
                <div className="mb-8 flex-1">
                  <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#5F5E5A]/60 mb-4">
                    What you will learn
                  </p>
                  <ul className="space-y-3">
                    {mod.learn.map((point) => (
                      <li key={point} className="flex items-start gap-3">
                        <CheckIcon />
                        <span className="text-[#2C2C2A] text-sm leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <a
                  href={`/academy/${mod.slug}`}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-white text-sm font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
                  style={{ backgroundColor: '#633806' }}
                >
                  Coming Soon
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Coming soon ───────────────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="section-label mb-4">COMING SOON</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              Upcoming Programmes
            </h2>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {COMING_SOON_MODULES.map((mod) => (
              <div
                key={mod.num}
                className="flex flex-col p-8 rounded-2xl border"
                style={{ backgroundColor: '#ffffff', borderColor: '#E8E4DC' }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-lora font-bold text-lg shrink-0"
                    style={{ backgroundColor: '#E8E4DC', color: '#888780' }}
                  >
                    {mod.num}
                  </div>
                  <span
                    className="text-xs font-semibold px-3 py-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
                  >
                    Coming Soon
                  </span>
                </div>

                <h3 className="font-lora text-xl font-bold text-[#2C2C2A] mb-3">
                  {mod.title}
                </h3>
                <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1">
                  {mod.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How the Academy works ─────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase mb-4" style={{ color: '#1D9E75' }}>
              THE EXPERIENCE
            </p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white">
              How it works
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.heading}
                className="flex flex-col p-8 rounded-2xl"
                style={{ backgroundColor: '#ffffff0d', border: '1px solid #ffffff14' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 shrink-0"
                  style={{ backgroundColor: '#63380620', color: '#FAEEDA' }}
                >
                  {item.icon}
                </div>
                <h3 className="font-lora text-lg font-bold text-white mb-3">{item.heading}</h3>
                <p className="text-white/70 text-sm leading-relaxed">{item.body}</p>
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
              Start your learning journey
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Practical wisdom for the challenges you face today.
            </p>
            <a
              href="#modules"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Explore available modules
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
