import type { Metadata } from 'next'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import DemoPlayer from './DemoPlayer'

const TITLE = 'Goal Ally demo'
const DESCRIPTION = 'See how Goal Ally reviews a goal.'
const CAL_LINK = 'https://cal.id/pgs/short-discussion'
const APP_LINK = 'https://app.subramaniampg.guru/goal-ally'

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/goal-ally-demo' },
  openGraph: {
    type: 'website',
    url: '/goal-ally-demo',
    title: `${TITLE} | Subramaniam P G`,
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${TITLE} | Subramaniam P G`,
    description: DESCRIPTION,
  },
}

// Letters, numbers and dashes only, 1 to 30 characters; otherwise 'direct'.
function cleanSrc(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value
  return v && /^[A-Za-z0-9-]{1,30}$/.test(v) ? v : 'direct'
}

export default function GoalAllyDemoPage({
  searchParams,
}: {
  searchParams: { src?: string | string[] }
}) {
  const src = cleanSrc(searchParams?.src)
  const tryHref = `${APP_LINK}?src=${encodeURIComponent(src)}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <main className="max-w-5xl mx-auto px-6 pt-12 pb-20 text-center">
        <p className="text-xs font-medium tracking-widest uppercase text-[#633806] mb-4">
          Goal Ally
        </p>
        <h1 className="font-lora text-4xl sm:text-5xl font-bold text-[#2C2C2A] leading-snug mb-3">
          {TITLE}
        </h1>
        <p className="text-lg text-[#4A4944] mb-10">{DESCRIPTION}</p>

        <div
          className="w-full max-w-[960px] mx-auto bg-white rounded-xl p-2 sm:p-3 border"
          style={{ borderColor: '#E8E4DC', boxShadow: '0 4px 24px rgba(44,44,42,0.08)' }}
        >
          <div className="rounded-lg overflow-hidden bg-black" style={{ aspectRatio: '16 / 9' }}>
            <DemoPlayer src={src} />
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3 mt-10">
          <a
            href={tryHref}
            className="bg-[#633806] text-[#FAEEDA] px-6 py-3 rounded font-medium text-sm"
          >
            Try Goal Ally free
          </a>
          <a
            href={CAL_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="border border-[#633806] text-[#633806] px-6 py-3 rounded font-medium text-sm"
          >
            Talk to us
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
