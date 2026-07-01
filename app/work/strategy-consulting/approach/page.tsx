import Link from 'next/link'

export const metadata = {
  title: 'The PACE Approach | Strategy Consulting | Subramaniam P G',
  description:
    'How the Growth Architecture Framework — PACE — is deployed. A tailored, embedded engagement that stays through execution, not just planning.',
  alternates: { canonical: 'https://www.subramaniampg.guru/work/strategy-consulting/approach' },
}

const stages = [
  {
    number: '01',
    title: 'Business Understanding',
    body: 'Before any framework is applied, PGS invests time understanding the business — its history, its market, its competitive landscape, its financials, and the dynamics of its leadership team. This is not a standard intake form. It is a genuine diagnostic.',
  },
  {
    number: '02',
    title: 'Leadership Team Assessment',
    body: 'The PACE Maturity Assessment is run with the leadership team — sometimes individually, sometimes collectively. The gaps between how different leaders see the same organisation surface here. These gaps are data.',
  },
  {
    number: '03',
    title: 'Direction Setting',
    body: 'A working session with the founder and leadership team to establish shared direction — where the business is going, what winning looks like, and the three to five things that must be true for that to happen. This becomes the anchor document.',
  },
  {
    number: '04',
    title: 'PACE Design',
    body: 'Planning, Alignment, Cadence, and Execution structures are designed for the specific organisation. This includes the meeting rhythm, the accountability model, the review format, and the living plan document. Nothing generic. Everything tailored.',
  },
  {
    number: '05',
    title: 'Deployment',
    body: 'The system is embedded into how the organisation operates. PGS is present in the early review cycles — not just to observe but to hold the process, surface resistance, and adjust what is not working.',
  },
  {
    number: '06',
    title: 'Sustained Rhythm',
    body: 'Once the cadence is running and the leadership team owns it, the engagement shifts to a lighter-touch sustaining mode. PGS remains available for quarterly reviews and course corrections as the business grows.',
  },
]

const outputs = [
  {
    title: 'A living direction document',
    body: 'Not a strategy deck. A working document — one or two pages — that answers where you are going, what winning looks like, and what the leadership team is accountable for this quarter.',
  },
  {
    title: 'A meeting cadence',
    body: 'Weekly, monthly, and quarterly rhythms designed for your organisation. Each meeting has a clear purpose, a clear format, and a clear output. The cadence connects daily work to strategic direction.',
  },
  {
    title: 'An accountability model',
    body: 'Ownership is clear. Progress is visible. Slippage is caught early — not at the end of the quarter when it is too late. Built into the rhythm, not added on top of it.',
  },
  {
    title: 'A leadership team that owns the plan',
    body: 'The most important output is not a document. It is a leadership team that understands the direction, owns their piece of it, and can hold each other accountable without the founder in the room.',
  },
]

const stats = [
  { label: 'Typical engagement length', value: '6 to 12 months' },
  { label: 'Working sessions', value: 'Monthly to fortnightly' },
  { label: 'Review cadence', value: 'Weekly, monthly, quarterly' },
  { label: 'Primary output', value: 'Living plan and embedded rhythm' },
]

export default function ApproachPage() {
  return (
    <main style={{ background: '#FAF8F5', color: '#2C2C2A', fontFamily: 'Inter, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A', maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/work/strategy-consulting" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Strategy Consulting</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Approach</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '2.5rem 2rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
          The Approach
        </p>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.25, color: '#2C2C2A', marginBottom: '1.25rem' }}>
          A living system, not a consulting report.
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#5F5E5A', maxWidth: '640px', margin: 0 }}>
          The work begins with understanding — your business, your market, your leadership team, and your constraints. What gets built from that understanding is specific to you. What stays the same across every engagement is the commitment to stay through deployment.
        </p>
      </section>

      {/* What This Is Not */}
      <section style={{ background: '#FAEEDA', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1.5rem' }}>
            What This Is Not
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {[
              { label: 'Not a strategy report', body: 'PGS does not deliver a document and walk out. The output of every engagement is a working system the organisation operates from — not a presentation that sits in a folder.' },
              { label: 'Not a fixed framework', body: 'PACE is a thinking tool, not a template. What gets built from it is tailored to the specific business, sector, leadership team, and stage. What worked for a manufacturing company in Chennai will not be copied and pasted onto a technology startup in Bangalore.' },
              { label: 'Not a short engagement', body: 'Strategy maturity is not built in a workshop. It is built over months of working sessions, review cadences, and accountability conversations. Engagements are designed to run long enough for change to take root.' },
            ].map((item, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem' }}>
                <p style={{ fontWeight: 700, color: '#633806', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{item.label}</p>
                <p style={{ fontSize: '0.9rem', color: '#5F5E5A', lineHeight: 1.65, margin: 0 }}>{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Six Stages */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            How an Engagement Unfolds
          </p>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {stages.map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: '2rem', paddingBottom: '2.5rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                  <div style={{
                    width: '40px', height: '40px', borderRadius: '50%',
                    background: '#633806', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '0.85rem',
                  }}>
                    {s.number}
                  </div>
                  {i < stages.length - 1 && (
                    <div style={{ width: '2px', flexGrow: 1, background: '#E8E4DC', marginTop: '0.5rem' }} />
                  )}
                </div>
                <div style={{ paddingTop: '0.5rem' }}>
                  <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.5rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outputs */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            What You Have at the End
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {outputs.map((o, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '1.75rem' }}>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{o.title}</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{o.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Family Business Track */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ background: '#fff', border: '1px solid #E8E4DC', borderRadius: '8px', padding: '2.5rem' }}>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1rem' }}>
              For Family Businesses
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#5F5E5A', marginBottom: '1rem' }}>
              Family businesses in transition face a specific set of challenges that go beyond strategy and execution. Founder authority, generational dynamics, and the complexity of separating ownership from management require a different kind of sensitivity.
            </p>
            <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>
              PGS has worked extensively with family businesses — helping them professionalise without losing what made them strong, navigate succession without fracturing relationships, and build structures that work for the next generation of leadership. The PACE framework applies. The approach is adapted.
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1.5rem' }}>
            What to Expect
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#5F5E5A', marginBottom: '0.4rem' }}>{s.label}</p>
                <p style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: 0 }}>{s.value}</p>
              </div>
            ))}
          </div>
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

    </main>
  )
}
