import type { Metadata } from 'next'
import Link from 'next/link'
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
    <div className="gad-root">
      <style>{`
        .gad-root {
          background: #2E1B05;
          min-height: 100vh;
          color: #FAEEDA;
          font-family: var(--font-inter, Inter, system-ui, sans-serif);
        }
        .gad-root * { box-sizing: border-box; }
        .gad-wrap { max-width: 1040px; margin: 0 auto; padding: 0 24px; }
        .gad-header { border-bottom: 1px solid #5A3812; padding: 28px 0; }
        .gad-brand { font-size: 16px; font-weight: 600; color: #FAEEDA; text-decoration: none; }
        .gad-brand span { color: #F0997B; }
        .gad-main { padding: 56px 0 72px; text-align: center; }
        .gad-h1 { font-size: 40px; line-height: 1.15; font-weight: 700; margin: 0 0 12px; }
        .gad-sub { font-size: 18px; color: #E0C9A6; margin: 0 0 36px; }
        .gad-player {
          width: 100%; max-width: 960px; margin: 0 auto;
          aspect-ratio: 16 / 9; background: #000;
          border: 1px solid #5A3812; border-radius: 12px; overflow: hidden;
        }
        .gad-actions { display: flex; flex-wrap: wrap; gap: 14px; justify-content: center; margin-top: 36px; }
        .gad-btn {
          display: inline-block; padding: 14px 28px; border-radius: 10px;
          font-size: 16px; font-weight: 600; text-decoration: none;
          border: 1px solid transparent;
        }
        .gad-btn:hover { opacity: 0.9; }
        .gad-btn-primary { background: #D85A30; border-color: #D85A30; color: #2A0E03; }
        .gad-btn-secondary { background: transparent; border-color: #8A5A22; color: #FAEEDA; }
        @media (max-width: 600px) {
          .gad-h1 { font-size: 30px; }
          .gad-main { padding: 36px 0 56px; }
          .gad-btn { width: 100%; text-align: center; }
        }
      `}</style>

      <header className="gad-header">
        <div className="gad-wrap">
          <Link href="/" className="gad-brand">
            Subramaniam <span>P G</span>
          </Link>
        </div>
      </header>

      <main className="gad-main">
        <div className="gad-wrap">
          <h1 className="gad-h1">{TITLE}</h1>
          <p className="gad-sub">{DESCRIPTION}</p>

          <div className="gad-player">
            <DemoPlayer src={src} />
          </div>

          <div className="gad-actions">
            <a href={tryHref} className="gad-btn gad-btn-primary">
              Try Goal Ally free
            </a>
            <a href={CAL_LINK} className="gad-btn gad-btn-secondary" target="_blank" rel="noopener noreferrer">
              Talk to us
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
