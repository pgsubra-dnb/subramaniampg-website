import Image from 'next/image'
import Link from 'next/link'
import { client } from '@/lib/sanity'

export const metadata = {
  title: 'Find your assessment | Subramaniam P G',
  description: 'Three short self assessments for founders and senior leaders. Answer a few questions and get a personalised result.',
}

async function getSiteSettings() {
  try {
    return await client.fetch(
      `*[_type == "siteSettings"][0]{yearsExperience,booksPublished,leadersCoached}`
    )
  } catch {
    return null
  }
}

const CAL_LINK = 'https://cal.id/pgs/short-discussion'

export default async function StartHerePage() {
  const settings = await getSiteSettings()

  const stats = [
    { value: settings?.yearsExperience || '', label: 'Years experience' },
    { value: settings?.leadersCoached   || '', label: 'Leaders coached' },
    { value: settings?.booksPublished   || '', label: 'Books published' },
  ].filter(s => s.value)

  return (
    <div className="sh-root">
      <style>{`
        .sh-root {
          background: #2E1B05;
          min-height: 100vh;
          color: #FAEEDA;
          font-family: var(--font-inter, Inter, system-ui, sans-serif);
        }
        .sh-root * { box-sizing: border-box; }
        .sh-header {
          border-bottom: 1px solid #5A3812;
          padding: 28px 0;
        }
        .sh-wrap {
          max-width: 1040px;
          margin: 0 auto;
          padding: 0 24px;
        }
        .sh-header-inner {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .sh-brand {
          font-size: 16px;
          font-weight: 600;
          letter-spacing: 0.01em;
          color: #FAEEDA;
          text-decoration: none;
        }
        .sh-brand-accent { color: #F0997B; }
        .sh-nav-link {
          color: #E0C9A6;
          text-decoration: none;
          font-size: 14px;
        }
        .sh-hero {
          padding: 64px 0 56px;
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 48px;
          align-items: center;
        }
        .sh-eyebrow {
          display: inline-block;
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #F0997B;
          background: #4A1B0C;
          padding: 6px 14px;
          border-radius: 100px;
          margin-bottom: 22px;
        }
        .sh-h1 {
          font-family: var(--font-lora, Lora, Georgia, serif);
          font-size: clamp(30px, 4.2vw, 44px);
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: -0.01em;
          margin-bottom: 16px;
          color: #FAEEDA;
        }
        .sh-hero-sub {
          font-size: 17px;
          color: #E0C9A6;
          max-width: 480px;
          margin-bottom: 28px;
        }
        .sh-book-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 14.5px;
          color: #5DCAA5;
          text-decoration: none;
          border-bottom: 1px solid transparent;
          transition: border-color 0.15s;
        }
        .sh-book-link:hover { border-bottom-color: #5DCAA5; }
        .sh-stats {
          display: flex;
          gap: 36px;
          margin-top: 36px;
          flex-wrap: wrap;
        }
        .sh-stat-num {
          font-size: 24px;
          font-weight: 600;
          color: #FAEEDA;
        }
        .sh-stat-label {
          font-size: 13px;
          color: #B89868;
          margin-top: 2px;
        }
        .sh-photo-wrap {
          width: 100%;
          max-width: 320px;
          aspect-ratio: 1/1;
          border-radius: 16px;
          overflow: hidden;
          margin: 0 auto;
          border: 1px solid #5A3812;
          position: relative;
        }
        .sh-photo-caption {
          font-size: 13px;
          color: #B89868;
          margin-top: 12px;
          text-align: center;
        }
        .sh-cards-section { padding: 24px 0 72px; }
        .sh-cards-intro {
          text-align: center;
          font-size: 15px;
          color: #B89868;
          margin-bottom: 36px;
        }
        .sh-cards {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .sh-card {
          background: #3D2408;
          border: 1px solid #5A3812;
          border-radius: 16px;
          padding: 32px 26px;
          display: flex;
          flex-direction: column;
          transition: border-color 0.15s ease, background 0.15s ease;
        }
        .sh-card-okr:hover  { background: #46290A; border-color: #D85A30; }
        .sh-card-strat:hover { background: #46290A; border-color: #1D9E75; }
        .sh-card-coach:hover { background: #46290A; border-color: #BA7517; }
        .sh-card-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 20px;
        }
        .sh-card-title {
          font-size: 19px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #FAEEDA;
        }
        .sh-card-desc {
          font-size: 14.5px;
          color: #E0C9A6;
          margin-bottom: 24px;
          flex-grow: 1;
        }
        .sh-card-meta {
          font-size: 12.5px;
          color: #B89868;
          margin-bottom: 20px;
          padding-top: 16px;
          border-top: 1px solid #5A3812;
        }
        .sh-card-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 12px 20px;
          border-radius: 10px;
          text-decoration: none;
          font-size: 14.5px;
          font-weight: 600;
          border: 1px solid;
          margin-bottom: 12px;
          transition: opacity 0.15s;
        }
        .sh-card-btn:hover { opacity: 0.9; }
        .sh-card-secondary {
          text-align: center;
          font-size: 12.5px;
          color: #B89868;
          text-decoration: none;
          transition: color 0.15s;
        }
        .sh-card-secondary:hover { color: #E0C9A6; }
        .sh-reassure {
          text-align: center;
          margin-top: 40px;
          font-size: 13.5px;
          color: #B89868;
        }
        .sh-footer {
          border-top: 1px solid #5A3812;
          padding: 28px 0;
          text-align: center;
          font-size: 13px;
          color: #B89868;
        }
        .sh-footer a { color: #E0C9A6; text-decoration: none; }
        @media (max-width: 760px) {
          .sh-hero { grid-template-columns: 1fr; text-align: center; padding: 48px 0 40px; }
          .sh-hero-sub { margin-left: auto; margin-right: auto; }
          .sh-stats { justify-content: center; }
          .sh-cards { grid-template-columns: 1fr; }
        }
      `}</style>

      {/* Header */}
      <header className="sh-header">
        <div className="sh-wrap sh-header-inner">
          <Link href="/" className="sh-brand">
            Subramaniam P G <span className="sh-brand-accent">&middot; Growth Architect</span>
          </Link>
          <Link href="/" className="sh-nav-link">subramaniampg.guru</Link>
        </div>
      </header>

      <div className="sh-wrap">
        {/* Hero */}
        <section className="sh-hero">
          <div>
            <span className="sh-eyebrow">Free self assessment, takes 5 minutes</span>
            <h1 className="sh-h1">Find the gap that is slowing you down</h1>
            <p className="sh-hero-sub">
              Three short self assessments for founders and senior leaders. Answer a few questions and get a personalised result by email.
            </p>
            <a href={CAL_LINK} className="sh-book-link">
              Prefer to talk first? Book a short call &rarr;
            </a>
            {stats.length > 0 && (
              <div className="sh-stats">
                {stats.map(s => (
                  <div key={s.label}>
                    <div className="sh-stat-num">{s.value}</div>
                    <div className="sh-stat-label">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="sh-photo-wrap">
              <Image
                src="/images/PGS Coach.png"
                alt="Subramaniam P G, Growth Architect and Executive Coach"
                fill
                style={{ objectFit: 'cover' }}
                sizes="320px"
                priority
              />
            </div>
            <p className="sh-photo-caption">
              Subramaniam P G &middot; Growth Architect, Executive Coach, Author
            </p>
          </div>
        </section>

        {/* Assessment Cards */}
        <section className="sh-cards-section">
          <p className="sh-cards-intro">
            Each assessment takes about 5 minutes. Pick the one that matches what is on your mind.
          </p>

          <div className="sh-cards">
            <div className="sh-card sh-card-okr">
              <div className="sh-card-icon" style={{ background: '#4A1B0C', color: '#F0997B' }}>OKR</div>
              <div className="sh-card-title">OKR Maturity Assessment</div>
              <p className="sh-card-desc">For when your team is busy but results are not matching the effort. Find where goal setting is breaking down.</p>
              <div className="sh-card-meta">Best if: goals are unclear or not cascading through the team</div>
              <Link href="/assessment" className="sh-card-btn" style={{ background: '#D85A30', borderColor: '#D85A30', color: '#2A0E03' }}>
                Take this assessment
              </Link>
              <a href={CAL_LINK} className="sh-card-secondary">Or book a call instead</a>
            </div>

            <div className="sh-card sh-card-strat">
              <div className="sh-card-icon" style={{ background: '#04342C', color: '#5DCAA5' }}>PACE</div>
              <div className="sh-card-title">Strategy Maturity Assessment</div>
              <p className="sh-card-desc">For when strategy looks clear on paper but stalls in execution. Find where alignment is breaking down.</p>
              <div className="sh-card-meta">Best if: leadership team is not moving in the same direction</div>
              <Link href="/work/strategy-consulting/assessment" className="sh-card-btn" style={{ background: '#1D9E75', borderColor: '#1D9E75', color: '#04241B' }}>
                Take this assessment
              </Link>
              <a href={CAL_LINK} className="sh-card-secondary">Or book a call instead</a>
            </div>

            <div className="sh-card sh-card-coach">
              <div className="sh-card-icon" style={{ background: '#412402', color: '#EF9F27' }}>EXEC</div>
              <div className="sh-card-title">Coaching Readiness Assessment</div>
              <p className="sh-card-desc">For when you need a sounding board for decisions only you can make. A private check, not a sales pitch.</p>
              <div className="sh-card-meta">Best if: you want a thinking partner for the hard calls</div>
              <Link href="/work/executive-coaching/assessment" className="sh-card-btn" style={{ background: '#EF9F27', borderColor: '#EF9F27', color: '#2E1B01' }}>
                Take this assessment
              </Link>
              <a href={CAL_LINK} className="sh-card-secondary">Or book a call instead</a>
            </div>
          </div>

          <p className="sh-reassure">
            Not sure which one fits? Book any slot and we will figure it out together in the first five minutes.
          </p>
        </section>
      </div>

      {/* Footer */}
      <footer className="sh-footer">
        <div className="sh-wrap">
          Subramaniam P G &middot; Growth Architect, Executive Coach, Author &middot;{' '}
          <Link href="/">subramaniampg.guru</Link>
        </div>
      </footer>
    </div>
  )
}
