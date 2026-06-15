import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'The Coaching Approach | Executive Coaching | Subramaniam P G',
  description:
    'Structured, assessment-based executive coaching. 360-degree feedback, co-created goals, and outcome-verified results over six to eight months.',
}

const stages = [
  {
    number: '01',
    title: 'Discovery',
    body: 'A 60-minute conversation to understand your context, your role, and what you want from the engagement. No commitment required at this stage.',
  },
  {
    number: '02',
    title: 'Assessment',
    body: 'VIA Character Survey to map your top strengths. 360-degree feedback from up to 15 stakeholders — your manager, peers, direct reports, and where relevant, family. This gives you data, not opinions.',
  },
  {
    number: '03',
    title: 'Goal Setting',
    body: 'A joint session to review assessment findings and define two to three development goals in your own words. Goals are specific, time-bound, and tied to observable behaviour.',
  },
  {
    number: '04',
    title: 'Coaching Sessions',
    body: 'Eight to twelve one-on-one sessions over six to eight months. Each session builds on the last. Between sessions, you work on agreed actions and report back.',
  },
  {
    number: '05',
    title: 'Verification',
    body: 'A short follow-up survey with your stakeholders corroborates what has changed. You receive a summary. Your sponsor, if any, receives a high-level view. All session details remain confidential.',
  },
]

export default function ApproachPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5', color: '#2C2C2A', fontFamily: 'Inter, sans-serif' }}>
    <NavBar />

      {/* Breadcrumb */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A', maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/work/executive-coaching" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Executive Coaching</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Approach</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '2.5rem 2rem 2rem', maxWidth: '860px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
          The Coaching Approach
        </p>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.25, color: '#2C2C2A', marginBottom: '1.25rem' }}>
          Structured. Data-grounded. Outcome-verified.
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#5F5E5A', maxWidth: '640px', margin: 0 }}>
          Most coaching fails because it is too open-ended. No baseline data, no clear goals, no way to know if anything changed. This engagement is built differently.
        </p>
      </section>

      {/* What this is not */}
      <section style={{ background: '#FAEEDA', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1.5rem' }}>
            What This Is Not
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Not mentoring', body: 'PGS will not tell you what to do based on his experience.' },
              { label: 'Not consulting', body: 'There is no report with recommendations.' },
              { label: 'Not therapy', body: 'Past events are explored only when relevant to present behaviour.' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem' }}>
                <p style={{ fontWeight: 700, color: '#633806', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{item.label}</p>
                <p style={{ fontSize: '0.95rem', color: '#5F5E5A', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: '#5F5E5A', lineHeight: 1.65 }}>
            It is a coaching relationship — a structured set of conversations with a clear focus, real data, and goals you define.
          </p>
        </div>
      </section>

      {/* Five stages */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            How an Engagement Unfolds
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {stages.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '2rem', paddingBottom: '2.5rem', position: 'relative' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#633806', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0,
                  }}>
                    {s.number}
                  </div>
                  {i < stages.length - 1 && (
                    <div style={{ width: '2px', flexGrow: 1, background: '#E8E4DC', marginTop: '0.5rem' }} />
                  )}
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                  <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.15rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.5rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            What Gets Used
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>VIA Character Survey</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: '#5F5E5A', margin: 0 }}>
                Identifies your top character strengths — the behaviours that come most naturally to you. Used to understand both what is working and what may be overused.
              </p>
            </div>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>360-Degree Feedback</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: '#5F5E5A', margin: 0 }}>
                Structured conversations with 10 to 15 people in your professional and personal life. Synthesised into themes, not shared verbatim. You see patterns, not gossip.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Confidentiality */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <div style={{ background: '#fff', border: '1px solid #E8E4DC', borderRadius: '8px', padding: '2.5rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1rem' }}>
              What Stays Private
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>
              All coaching conversations are confidential. If there is a sponsor — your organisation is paying for the engagement — progress updates are agreed with you before they are shared. Nothing leaves the room without your knowledge.
            </p>
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1.5rem' }}>
            What to Expect
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Duration', value: '6 to 8 months' },
              { label: 'Sessions', value: '8 to 12 sessions' },
              { label: 'Session length', value: '60 to 90 minutes' },
              { label: 'Cadence', value: 'Fortnightly or monthly' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5F5E5A', marginBottom: '0.4rem' }}>{item.label}</p>
                <p style={{ fontFamily: 'Lora, serif', fontSize: '1.2rem', fontWeight: 700, color: '#2C2C2A', margin: 0 }}>{item.value}</p>
              </div>
            ))}
          </div>
          <p style={{ marginTop: '1.5rem', fontSize: '0.95rem', color: '#5F5E5A', lineHeight: 1.65 }}>
            Engagements are structured to work around your schedule. Investment details are discussed during the discovery conversation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#2C2C2A', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
            Ready to start?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            Book a 30-minute discovery call. No commitment required.
          </p>
          <Link href="https://cal.id/pgs" target="_blank" style={{
            background: '#633806', color: '#fff', padding: '0.9rem 2rem',
            borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
          }}>
            Book a Call
          </Link>
        </div>
      </section>

    <Footer />
    </div>
  )
}
