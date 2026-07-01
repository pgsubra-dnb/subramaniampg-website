import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'OKR Maturity Framework — 5 Levels of Execution | Subramaniam P G',
  description:
    'The five-level OKR Maturity Framework used to diagnose where an organisation stands and design the right OKR implementation path.',
  alternates: { canonical: 'https://www.subramaniampg.guru/work/okr-consulting/framework' },
}

const LEVELS = [
  {
    num: 1,
    name: 'Founder-Dependent Execution',
    bottleneck: 'Decision bottleneck',
    height: 70,
    bg: '#FAEEDA',
    border: '#633806',
    color: '#633806',
    badgeBg: '#FAEEDA',
    badgeText: '#633806',
    pillBg: '#FAEEDA',
    pillText: '#633806',
    looksLike:
      'The founder or senior leader is the engine of the organisation. Decisions, priorities, and direction all flow through one person. High activity, unclear priorities, reactive culture, founder overwhelmed.',
    path: 'Focus on creating clarity around priorities and beginning to distribute decision-making. OKRs are introduced at the leadership layer first, not the whole organisation.',
  },
  {
    num: 2,
    name: 'Functional Silos',
    bottleneck: 'Priority bottleneck',
    height: 100,
    bg: '#FAEEDA',
    border: '#633806',
    color: '#633806',
    badgeBg: '#FAEEDA',
    badgeText: '#633806',
    pillBg: '#FAEEDA',
    pillText: '#633806',
    looksLike:
      'Teams operate within their own lanes. Goals exist but are set and tracked independently by each function. Busy teams, conflicting priorities, low cross-functional collaboration.',
    path: 'Focus on creating shared goals that span functions. Company-level OKRs are set first, before cascading to teams.',
  },
  {
    num: 3,
    name: 'Structured Alignment',
    bottleneck: 'Information bottleneck',
    height: 130,
    bg: '#E1F5EE',
    border: '#1D9E75',
    color: '#1D9E75',
    badgeBg: '#E1F5EE',
    badgeText: '#0F6E56',
    pillBg: '#E1F5EE',
    pillText: '#0F6E56',
    looksLike:
      'Shared understanding of priorities exists. Goal-setting is regular but not yet disciplined. Regular planning cycles, some alignment, inconsistent follow-through, data gaps.',
    path: 'Foundation is in place. OKRs can be implemented across the organisation with a structured cadence, regular reviews, and clear ownership.',
  },
  {
    num: 4,
    name: 'Disciplined Execution',
    bottleneck: 'Accountability bottleneck',
    height: 160,
    bg: '#E1F5EE',
    border: '#1D9E75',
    color: '#1D9E75',
    badgeBg: '#E1F5EE',
    badgeText: '#0F6E56',
    pillBg: '#E1F5EE',
    pillText: '#0F6E56',
    looksLike:
      'Goals are set, tracked, and reviewed. Teams understand their role in the bigger picture. Strong planning, regular reviews, visible progress.',
    path: 'OKRs are already embedded. Focus shifts to better key results, stronger review culture, and connecting OKRs to strategy more tightly.',
  },
  {
    num: 5,
    name: 'Institutionalised Growth',
    bottleneck: 'Culture bottleneck',
    height: 190,
    bg: '#FAEEDA',
    border: '#633806',
    color: '#633806',
    badgeBg: '#2C2C2A',
    badgeText: '#FAEEDA',
    pillBg: '#444441',
    pillText: '#FAEEDA',
    looksLike:
      'Execution is a cultural strength. Goals are ambitious, tracking is rigorous, accountability is shared. High alignment, continuous improvement, scalable culture.',
    path: 'OKRs are a native tool. Focus is on maintaining quality, preventing bureaucratic drift, and evolving the practice as the organisation grows.',
  },
]

export default function FrameworkPage() {
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
          The Leadership Execution Scale
        </p>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-10 pb-16">
        <p className="text-xs font-medium uppercase tracking-widest text-[#1D9E75] mb-4">
          The Leadership Execution Scale
        </p>
        <h1 className="font-lora text-4xl font-bold text-[#2C2C2A] leading-snug mb-6 max-w-2xl">
          Every organisation is at a different stage. Your OKR path depends on where you are.
        </h1>
        <p className="text-base text-[#5F5E5A] leading-relaxed max-w-2xl mb-8">
          Most OKR programmes are designed for organisations that are already structured, aligned,
          and process-driven. Many organisations are not there yet — and that is not a problem. It
          is a starting point. The Leadership Execution Scale is a proprietary framework that maps
          five levels of organisational execution maturity. It identifies where your organisation
          currently operates, what is holding it back, and what the path forward looks like.
        </p>
        <Link
          href="/assessment"
          className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
          style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
        >
          Take the free assessment →
        </Link>
      </section>

      {/* Five Levels */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          The five levels of execution maturity
        </h2>

        {/* Staircase */}
        <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: '#F1EFE8' }}>
          <div className="flex items-end gap-2" style={{ height: '190px' }}>
            {LEVELS.map((level) => (
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

        {/* Legend */}
        <div className="flex gap-6 justify-center text-xs text-[#5F5E5A] mb-8">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#633806' }} />
            Early stage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#1D9E75' }} />
            Mid stage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: '#2C2C2A' }} />
            Mature
          </span>
        </div>

        {/* Level cards */}
        <div className="flex flex-col gap-4">
          {LEVELS.map((level) => (
            <div
              key={level.num}
              className="bg-white border rounded-xl p-5 grid gap-5"
              style={{ borderColor: '#E8E4DC', gridTemplateColumns: '56px 1fr' }}
            >
              {/* Badge */}
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center font-serif text-xl font-medium flex-shrink-0"
                style={{ backgroundColor: level.badgeBg, color: level.badgeText }}
              >
                {level.num}
              </div>

              {/* Content */}
              <div>
                <p className="text-sm font-medium text-[#2C2C2A] mb-1">{level.name}</p>
                <span
                  className="inline-block text-[11px] px-2 py-0.5 rounded mb-2"
                  style={{ backgroundColor: level.pillBg, color: level.pillText }}
                >
                  {level.bottleneck}
                </span>
                <p className="text-xs text-[#5F5E5A] leading-relaxed mb-2">{level.looksLike}</p>
                <div
                  className="border-l-2 pl-3 py-2 rounded-r-md"
                  style={{ borderColor: '#1D9E75', backgroundColor: '#E1F5EE' }}
                >
                  <p
                    className="text-[10px] font-medium uppercase tracking-wide mb-1"
                    style={{ color: '#0F6E56' }}
                  >
                    OKR path from here
                  </p>
                  <p className="text-xs text-[#2C2C2A] leading-relaxed">{level.path}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why This Matters */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-5">
          Knowing your level changes everything
        </h2>
        <div className="rounded-xl p-6 mb-4" style={{ backgroundColor: '#FAEEDA' }}>
          <p className="text-sm text-[#2C2C2A] leading-relaxed">
            A Level 1 organisation and a Level 4 organisation both benefit from OKRs. But the
            path, the pace, and the priorities are completely different. Introducing OKRs without
            understanding execution maturity is like prescribing medication without a diagnosis.
            The framework ensures that every engagement is designed for where you actually are —
            not where the textbook assumes you are.
          </p>
        </div>
        <p className="text-sm text-[#5F5E5A]">
          The first step in every PGS engagement is an assessment. It takes fifteen minutes and
          gives you a clear starting point.
        </p>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#2C2C2A' }}>
          <h2 className="font-lora text-2xl font-bold mb-3" style={{ color: '#FAEEDA' }}>
            Find out where your organisation is
          </h2>
          <p className="text-sm mb-6" style={{ color: '#B4B2A9' }}>
            The self-assessment takes fifteen minutes. You answer ten questions and receive your
            execution maturity level with an explanation of what it means for your OKR journey.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/assessment"
              className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
              style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
            >
              Take the free assessment →
            </Link>
            <a
              href="https://cal.id/pgs/short-discussion"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-6 py-3 rounded font-medium text-sm border"
              style={{ borderColor: '#ffffff', color: '#ffffff' }}
            >
              Book a call to discuss
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
