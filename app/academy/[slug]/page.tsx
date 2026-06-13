import { notFound } from 'next/navigation'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#1D9E75' }}>
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
  </svg>
)

type Lesson = { title: string; duration: string }
type Module = {
  slug: string
  num: string
  category: string
  title: string
  description: string
  duration: string
  learn: string[]
  lessons: Lesson[]
}

const MODULES: Module[] = [
  {
    slug: 'okr-foundations',
    num: '01',
    category: 'OKR CONSULTING',
    title: 'OKR Foundations',
    description:
      'Master the principles and mechanics of effective OKR implementation. Learn how to write great OKRs, run effective check-ins, score honestly, and build the execution rhythm that keeps your organisation focused quarter after quarter.',
    duration: '6 lessons · 90 minutes',
    learn: [
      'The difference between outputs and outcomes and why it matters for goal setting',
      'How to write Objectives that inspire and Key Results that measure progress honestly',
      'How to cascade OKRs from company level to team and individual level',
      'How to run weekly check-ins and quarterly reviews that actually work',
    ],
    lessons: [
      { title: 'What are OKRs and why they matter', duration: '12 min' },
      { title: 'Writing objectives that inspire action', duration: '15 min' },
      { title: 'Defining key results that measure outcomes', duration: '18 min' },
      { title: 'Cascading OKRs across the organisation', duration: '14 min' },
      { title: 'Running effective check-ins and reviews', duration: '16 min' },
      { title: 'Common OKR pitfalls and how to avoid them', duration: '12 min' },
    ],
  },
  {
    slug: 'leadership-ancient-wisdom',
    num: '02',
    category: 'LEADERSHIP',
    title: 'Leadership through Ancient Wisdom',
    description:
      'Draw on the Bhagavad Gita, Arthashastra, and Thirukkural to navigate modern leadership challenges with clarity and purpose. Each lesson connects a timeless principle to a contemporary leadership situation.',
    duration: '6 lessons · 95 minutes',
    learn: [
      'How ancient Indian texts address modern leadership dilemmas with surprising precision',
      'The concept of Dharma applied to ethical decision-making in organisations',
      'Lessons from the Mahabharata on strategy, loyalty, and conflict resolution',
      'How to lead with detachment and purpose simultaneously',
    ],
    lessons: [
      { title: 'Introduction to ancient wisdom traditions in leadership', duration: '14 min' },
      { title: 'Dharma and ethical decision-making', duration: '16 min' },
      { title: 'The Bhagavad Gita on action without attachment', duration: '18 min' },
      { title: 'Arthashastra on strategy and statecraft', duration: '15 min' },
      { title: 'Thirukkural on leadership virtues', duration: '16 min' },
      { title: 'Applying ancient wisdom to modern leadership challenges', duration: '16 min' },
    ],
  },
]

export function generateStaticParams() {
  return MODULES.map((m) => ({ slug: m.slug }))
}

function getModule(slug: string): Module | undefined {
  return MODULES.find((m) => m.slug === slug)
}

export default function ModulePage({ params }: { params: { slug: string } }) {
  const mod = getModule(params.slug)
  if (!mod) notFound()

  const related = MODULES.filter((m) => m.slug !== mod.slug)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Hero ── bg: #2C2C2A ───────────────────────────── */}
      <section style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-0">
          <nav className="flex items-center gap-2 text-sm">
            <a href="/academy" className="transition-colors" style={{ color: '#ffffff60' }}>
              ← Back to Academy
            </a>
          </nav>
        </div>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-16 lg:pt-12 lg:pb-20">
          <div className="max-w-3xl">
            {/* Module number + category */}
            <div className="flex items-center gap-3 mb-5">
              <span
                className="inline-flex items-center justify-center w-10 h-10 rounded-full font-lora font-bold text-base"
                style={{ backgroundColor: '#1D9E75', color: '#ffffff' }}
              >
                {mod.num}
              </span>
              <span className="text-xs font-semibold tracking-[0.18em] uppercase" style={{ color: '#1D9E75' }}>
                {mod.category}
              </span>
            </div>

            <h1 className="font-lora text-4xl sm:text-5xl font-bold text-white leading-[1.12] tracking-tight mb-6">
              {mod.title}
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-8 max-w-2xl">
              {mod.description}
            </p>

            {/* Metadata row */}
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 shrink-0" style={{ color: '#ffffff40' }}>
                  <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-13a.75.75 0 0 0-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 0 0 0-1.5h-3.25V5Z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium" style={{ color: '#ffffff80' }}>{mod.duration}</span>
              </div>
              <span
                className="text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ backgroundColor: '#E1F5EE', color: '#0D6E4E' }}
              >
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── What you will learn ───────────────────────────── */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="section-label mb-4">OUTCOMES</p>
            <h2 className="font-lora text-2xl lg:text-3xl font-bold text-[#2C2C2A] mb-8">
              What you will learn
            </h2>
            <ul className="space-y-5">
              {mod.learn.map((point) => (
                <li key={point} className="flex items-start gap-4">
                  <CheckIcon />
                  <span className="text-[#2C2C2A] text-base leading-relaxed">{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Module content ────────────────────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-3xl">
            <p className="section-label mb-4">CURRICULUM</p>
            <h2 className="font-lora text-2xl lg:text-3xl font-bold text-[#2C2C2A] mb-8">
              What this module covers
            </h2>

            <div className="rounded-2xl overflow-hidden border" style={{ borderColor: '#E8E4DC' }}>
              {mod.lessons.map((lesson, idx) => (
                <div
                  key={lesson.title}
                  className="flex items-center gap-5 px-7 py-5"
                  style={{
                    backgroundColor: idx % 2 === 0 ? '#ffffff' : '#FAF8F5',
                    borderTop: idx > 0 ? '1px solid #E8E4DC' : 'none',
                  }}
                >
                  {/* Lesson number */}
                  <span
                    className="font-lora font-bold text-lg leading-none w-8 shrink-0 select-none"
                    style={{ color: '#63380640' }}
                  >
                    {String(idx + 1).padStart(2, '0')}
                  </span>

                  {/* Lesson title */}
                  <span className="flex-1 text-[#2C2C2A] text-sm font-medium leading-snug">
                    {lesson.title}
                  </span>

                  {/* Duration */}
                  <span className="text-xs font-medium shrink-0" style={{ color: '#888780' }}>
                    {lesson.duration}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Reach out ─────────────────────────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#633806' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-4">
              Prefer a guided learning session?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8 text-lg">
              If you would like to explore this topic with personalised guidance, Subramaniam P G
              offers one to one and group learning sessions tailored to your context.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Get in touch
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      {/* ── Related modules ───────────────────────────────── */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <h2 className="font-lora text-2xl lg:text-3xl font-bold text-[#2C2C2A] mb-8">
            Other modules
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map((rel) => (
              <a
                key={rel.slug}
                href={`/academy/${rel.slug}`}
                className="group flex flex-col gap-4 p-6 rounded-2xl border bg-white hover:shadow-lg transition-all duration-300"
                style={{ borderColor: '#E8E4DC' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center font-lora font-bold text-base shrink-0"
                    style={{ backgroundColor: '#1D9E75', color: '#ffffff' }}
                  >
                    {rel.num}
                  </div>
                  <span className="text-xs font-semibold tracking-wide uppercase" style={{ color: '#1D9E75' }}>
                    {rel.category}
                  </span>
                </div>
                <div>
                  <h3 className="font-lora text-base font-bold text-[#2C2C2A] group-hover:text-[#633806] transition-colors leading-snug mb-2">
                    {rel.title}
                  </h3>
                  <p className="text-xs" style={{ color: '#888780' }}>{rel.duration}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
