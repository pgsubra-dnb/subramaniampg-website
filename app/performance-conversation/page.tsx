import type { Metadata } from 'next'
import Image from 'next/image'
import { CURRENT_EPISODE as ep, SERIES_NAME } from '@/lib/webinarEpisodes'
import RegisterForm from './RegisterForm'

const TITLE = `${SERIES_NAME} | Episode ${ep.number}`
const DESC = `${ep.title} A free live session on ${ep.dateLabel}, 11:00 AM IST.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESC,
  alternates: { canonical: '/performance-conversation' },
  openGraph: {
    title: `${SERIES_NAME} | Episode ${ep.number}: ${ep.title}`,
    description: DESC,
    url: '/performance-conversation',
    type: 'website',
    images: [{ url: '/webinar/og-ep1.jpg', width: 1280, height: 720, alt: ep.title }],
  },
  twitter: { card: 'summary_large_image', images: ['/webinar/og-ep1.jpg'] },
}

function calendarUrl() {
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${SERIES_NAME} | Episode ${ep.number}`,
    dates: `${ep.startUtc}/${ep.endUtc}`,
    details: `${ep.title} Join live on LinkedIn: ${ep.links.linkedin}`,
    location: ep.links.linkedin,
  })
  return `https://calendar.google.com/calendar/render?${p.toString()}`
}

export default function PerformanceConversationPage({
  searchParams,
}: {
  searchParams: { src?: string }
}) {
  const src = (searchParams.src ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)

  return (
    <div className="pc-root">
      <style>{`
        .pc-root { background:#1F3A5F; color:#fff; min-height:100vh; font-family:var(--font-inter, Inter, system-ui, sans-serif); }
        .pc-root * { box-sizing:border-box; }
        .pc-root .pc-h1, .pc-root .pc-h2 { color:#fff; }
        .pc-root .pc-card-title { color:#1F3A5F; }
        .pc-wrap { max-width:1080px; margin:0 auto; padding:0 20px; }
        .pc-top { display:flex; align-items:center; gap:14px; padding:28px 0 8px; border-top:8px solid #C8860A; }
        .pc-label-top { color:#E09E2E; font-size:13px; letter-spacing:.12em; font-weight:600; text-transform:uppercase; }
        .pc-hero { display:grid; grid-template-columns:1.1fr .9fr; gap:40px; padding:36px 0 56px; align-items:start; }
        .pc-h1 { font-family:var(--font-lora, Georgia, serif); font-weight:700; font-size:clamp(34px,5vw,56px); line-height:1.15; margin:12px 0 18px; }
        .pc-bar { width:96px; height:6px; background:#E09E2E; margin-bottom:22px; }
        .pc-sub { font-size:19px; line-height:1.5; color:#DEE7F2; margin:0 0 22px; }
        .pc-when { display:inline-block; background:#E09E2E; color:#1F3A5F; font-weight:700; padding:12px 20px; border-radius:999px; font-size:16px; }
        .pc-cal { display:block; margin-top:14px; color:#DEE7F2; font-size:14px; text-decoration:underline; }
        .pc-card { background:#fff; color:#1F3A5F; border-radius:20px; padding:28px; position:relative; box-shadow:0 10px 30px rgba(0,0,0,.25); }
        .pc-card-title { font-family:var(--font-lora, Georgia, serif); font-size:26px; margin:0 0 16px; }
        .pc-card-text { font-size:16px; line-height:1.5; margin:0 0 18px; }
        .pc-label { display:block; font-size:14px; font-weight:600; margin:14px 0 6px; }
        .pc-input { width:100%; border:1px solid #B8C4D6; border-radius:10px; padding:12px 14px; font-size:16px; color:#1F3A5F; }
        .pc-input:focus { outline:3px solid #E09E2E; outline-offset:1px; }
        .pc-btn { display:block; width:100%; text-align:center; margin-top:20px; background:#C8860A; color:#fff; font-weight:700; font-size:17px; padding:14px 18px; border:0; border-radius:999px; cursor:pointer; text-decoration:none; }
        .pc-btn:hover { background:#A56F08; }
        .pc-btn:disabled { opacity:.6; cursor:wait; }
        .pc-note { font-size:14px; line-height:1.45; color:#4A5D78; margin:14px 0 0; }
        .pc-error { color:#B3261E; font-size:14px; margin:14px 0 0; }
        .pc-alt { display:flex; gap:16px; justify-content:center; margin-top:16px; flex-wrap:wrap; }
        .pc-alt a { color:#1F3A5F; font-weight:600; font-size:15px; }
        .pc-section { padding:48px 0; border-top:1px solid rgba(255,255,255,.15); }
        .pc-h2 { font-family:var(--font-lora, Georgia, serif); font-size:clamp(26px,3.4vw,34px); margin:0 0 22px; }
        .pc-list { list-style:none; margin:0; padding:0; display:grid; gap:12px; }
        .pc-list li { background:rgba(255,255,255,.08); border-left:5px solid #E09E2E; border-radius:10px; padding:16px 18px; font-size:18px; line-height:1.45; }
        .pc-live { margin-top:16px; border:2px solid #E09E2E; color:#E09E2E; border-radius:12px; padding:14px 18px; font-weight:600; }
        .pc-host { font-size:18px; line-height:1.6; color:#DEE7F2; max-width:720px; }
        .pc-logos { display:flex; gap:14px; flex-wrap:wrap; align-items:center; justify-content:center; padding:28px 0 48px; }
        @media (max-width:820px) { .pc-hero { grid-template-columns:1fr; gap:28px; } }
      `}</style>

      <div className="pc-wrap">
        <div className="pc-top">
          <Image src="/webinar/embiggen-white.png" alt="Embiggen" width={176} height={50} style={{ height: 50, width: 'auto' }} priority />
          <span className="pc-label-top">{SERIES_NAME} | Episode {ep.number}</span>
        </div>

        <header className="pc-hero">
          <div>
            <h1 className="pc-h1">{ep.title}</h1>
            <div className="pc-bar" />
            <p className="pc-sub">{ep.subtitle}</p>
            <span className="pc-when">{ep.dateLabel} | {ep.timeLabel}</span>
            <a className="pc-cal" href={calendarUrl()} target="_blank" rel="noopener noreferrer">Add to Google Calendar</a>
          </div>
          <RegisterForm src={src || 'direct'} />
        </header>

        <section className="pc-section">
          <h2 className="pc-h2">In this free session you will learn</h2>
          <ul className="pc-list">
            {ep.learn.map((l) => <li key={l}>{l}</li>)}
          </ul>
          <p className="pc-live">{ep.liveOnly}</p>
        </section>

        <section className="pc-section">
          <h2 className="pc-h2">About your host</h2>
          <p className="pc-host">
            Subramaniam P G is a Growth Architect and Executive Coach at Embiggen Consulting LLP. He works with
            founders and CXOs on goals and execution. He is the author of seven books on leadership, execution and OKRs.
          </p>
        </section>

        <div className="pc-logos">
          <Image src="/webinar/okr-ally-chip.png" alt="OKR Ally" width={210} height={64} style={{ height: 52, width: 'auto' }} />
          <Image src="/webinar/goal-ally-chip.png" alt="Goal Ally" width={210} height={64} style={{ height: 52, width: 'auto' }} />
          <Image src="/webinar/nextkadam-chip.png" alt="NextKadam" width={260} height={64} style={{ height: 52, width: 'auto' }} />
        </div>
      </div>
    </div>
  )
}
