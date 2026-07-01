import Link from 'next/link'

const BASE = 'https://www.subramaniampg.guru'

export const metadata = {
  title: 'Strategy Consulting India | PACE Growth Architecture | Subramaniam P G',
  description:
    'Strategy consulting for founder-led and family businesses in India. The PACE Growth Architecture Framework — Planning, Alignment, Cadence, and Execution.',
  alternates: { canonical: `${BASE}/work/strategy-consulting` },
  openGraph: {
    title: 'Strategy Consulting | Subramaniam P G',
    description: 'The PACE Growth Architecture Framework. Strategy consulting for founder-led businesses across India.',
    url: `${BASE}/work/strategy-consulting`,
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Strategy Consulting',
  description:
    'Strategy consulting using the PACE Growth Architecture Framework — Planning, Alignment, Cadence, and Execution. For founder-led and family businesses.',
  provider: {
    '@type': 'Person',
    name: 'Subramaniam P G',
    url: BASE,
  },
  areaServed: { '@type': 'Country', name: 'India' },
  url: `${BASE}/work/strategy-consulting`,
}

const painQuotes = [
  { text: 'I ask my leadership team what our top three priorities are and I get five different answers.' },
  { text: 'We spend two days on a strategy offsite and by month two nothing has changed.' },
  { text: 'Everything still comes back to me. I cannot step back without things falling apart.' },
  { text: 'The consultant gave us a beautiful deck. It is sitting in a folder.' },
]

const problems = [
  {
    number: '01',
    title: 'The plan that never moves',
    body: 'Strategy lives in a document. The leadership team references it in January and forgets it by March. There is no rhythm connecting the plan to what people do on Monday morning.',
  },
  {
    number: '02',
    title: 'Alignment that is only skin deep',
    body: 'Everyone agreed in the room. But agreement is not alignment. When each leader goes back to their function, they prioritise differently. The gaps compound quietly until they show up as missed targets and lost people.',
  },
  {
    number: '03',
    title: 'The founder who cannot step back',
    body: 'The organisation runs on one person\'s judgment and energy. This is not a leadership failure — it is a structural one. Until the strategy, the rhythm, and the accountability are built into the system, stepping back is not possible.',
  },
]

const pillars = [
  {
    letter: 'P',
    title: 'Planning',
    body: 'A living direction — where the business is going, what winning looks like in 12 to 36 months, and the three to five things that must be true for that to happen. Not a deck. A working document the founder and leadership team own.',
  },
  {
    letter: 'A',
    title: 'Alignment',
    body: 'The leadership team pointed in the same direction — not just in the meeting but in what each leader prioritises when no one is watching. Surfaces the gaps between what was decided and what is actually happening, and closes them.',
  },
  {
    letter: 'C',
    title: 'Cadence',
    body: 'A meeting rhythm embedded into how the organisation operates — weekly, monthly, quarterly — that connects daily work to strategic direction. Fewer meetings, better meetings, each with a clear purpose and a clear output.',
  },
  {
    letter: 'E',
    title: 'Execution',
    body: 'Decisions become actions. Actions have owners. Owners have accountability. Progress is visible without micromanagement. This is where most organisations break down — and where the engagement stays, not just advises.',
  },
]

const levels = [
  {
    number: 'L1',
    title: 'Reactive Organisation',
    body: 'No planning beyond next month. Founder decides everything daily. The business responds to what arrives, not what it chose.',
  },
  {
    number: 'L2',
    title: 'Intuitive Direction',
    body: 'Founder knows where the business is going but it lives in their head. The team operates on assumption. Alignment is accidental.',
  },
  {
    number: 'L3',
    title: 'Structured Intent',
    body: 'An annual plan exists. The team knows the goals. But execution breaks down by quarter two and the plan lives in a document nobody has opened since January.',
  },
  {
    number: 'L4',
    title: 'Aligned Execution',
    body: 'Strategy is shared. Leadership team owns their part. A review cadence exists but depends on the founder\'s energy to maintain.',
  },
  {
    number: 'L5',
    title: 'Growth Rhythm',
    body: 'Strategy, execution, and review are embedded in how the organisation operates week to week. The founder is working on the business, not in it.',
  },
]

const differentiators = [
  {
    title: 'Tailored, not templated',
    body: 'Every business gets a bespoke approach. The PACE framework is the thinking tool. What gets built from it is specific to your business, your leadership team, and your stage of growth.',
  },
  {
    title: 'Embedded, not advisory',
    body: 'The work does not end with a plan. The engagement stays through deployment — present in the review cadence, visible in the accountability structures, reachable when execution hits resistance.',
  },
  {
    title: 'Outcome-oriented',
    body: 'The measure of success is not a document or a workshop. It is whether the organisation is executing against its direction six months later. That is the standard the engagement is held to.',
  },
]

const crossRefs = [
  {
    title: 'When OKRs come in',
    body: 'OKRs are a Level 3 and above mechanism. Once your strategy is clear and your leadership team is broadly aligned, OKRs give you the focus and accountability structure to execute consistently.',
    link: '/work/okr-consulting',
    linkLabel: 'OKR Consulting',
  },
  {
    title: 'When coaching comes in',
    body: 'Sometimes the constraint is not the system — it is the person leading it. When the founder or a key leader is the bottleneck, executive coaching works alongside the strategy engagement.',
    link: '/work/executive-coaching',
    linkLabel: 'Executive Coaching',
  },
  {
    title: 'Where to start',
    body: 'Not sure which applies to your situation? The PACE Maturity Assessment takes ten minutes and gives you a clear starting point.',
    link: '/work/strategy-consulting/assessment',
    linkLabel: 'Take the Assessment',
  },
]

export default function StrategyConsultingPage() {
  return (
    <main style={{ background: '#FAF8F5', color: '#2C2C2A', fontFamily: 'Inter, sans-serif' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />

      {/* Breadcrumb */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A', maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Strategy Consulting</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '2.5rem 2rem 3rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
          Strategy Consulting
        </p>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.75rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.2, color: '#2C2C2A', marginBottom: '1.5rem', maxWidth: '720px' }}>
          Most organisations do not have a strategy problem. They have an execution problem.
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.75, color: '#5F5E5A', maxWidth: '640px', marginBottom: '2rem' }}>
          The plan exists. The leadership team nodded in the meeting. And by February, nothing has moved. The gap between what was decided and what actually happens is where growth dies. The Growth Architecture Framework — PACE — is built to close that gap.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="https://cal.id/pgs" target="_blank" style={{
            background: '#633806', color: '#fff', padding: '0.85rem 1.75rem',
            borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
          }}>
            Book a Discovery Call
          </Link>
          <Link href="/work/strategy-consulting/assessment" style={{
            border: '1.5px solid #633806', color: '#633806', padding: '0.85rem 1.75rem',
            borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
          }}>
            Take the PACE Assessment
          </Link>
        </div>
      </section>

      {/* Sound Familiar */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            What Founders Say
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            {painQuotes.map((q, i) => (
              <div key={i} style={{ borderLeft: '4px solid #633806', background: '#fff', padding: '1.5rem', borderRadius: '0 8px 8px 0' }}>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#2C2C2A', margin: 0, fontStyle: 'italic' }}>
                  &ldquo;{q.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Real Problem */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            What Gets in the Way
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {problems.map((p) => (
              <div key={p.number} style={{ background: '#fff', border: '1px solid #E8E4DC', borderRadius: '8px', padding: '2rem' }}>
                <p style={{ fontFamily: 'Lora, serif', fontSize: '2.5rem', fontWeight: 700, color: '#FAEEDA', margin: '0 0 1rem', lineHeight: 1 }}>{p.number}</p>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{p.title}</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PACE Framework */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '0.75rem' }}>
            The Growth Architecture Framework
          </p>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#2C2C2A', marginBottom: '0.75rem' }}>
            PACE is not a template. It is a tailored operating system for your business.
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#5F5E5A', marginBottom: '2.5rem', maxWidth: '640px' }}>
            What works for a 500-person technology company does not work for an 80-person family business. PACE starts with understanding your business, your sector, your leadership team, and your constraints — then builds a system that fits.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
            {pillars.map((p) => (
              <div key={p.letter} style={{ background: '#fff', borderRadius: '8px', padding: '1.75rem' }}>
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%',
                  background: '#633806', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'Lora, serif', fontWeight: 700, fontSize: '1.1rem',
                  marginBottom: '1rem',
                }}>
                  {p.letter}
                </div>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.6rem' }}>{p.title}</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Five Maturity Levels */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '0.75rem' }}>
            Five Levels of Strategy Maturity
          </p>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, color: '#2C2C2A', marginBottom: '0.75rem' }}>
            Where are you on the strategy maturity curve?
          </h2>
          <p style={{ fontSize: '1rem', lineHeight: 1.7, color: '#5F5E5A', marginBottom: '2.5rem', maxWidth: '640px' }}>
            Most organisations sit somewhere between having no shared direction and having a fully embedded growth rhythm. Understanding where you are is the starting point for knowing what to build next.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            {levels.map((l, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E8E4DC', borderRadius: '8px', padding: '1.5rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', color: '#633806', textTransform: 'uppercase', marginBottom: '0.5rem' }}>{l.number}</p>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '0.95rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.6rem' }}>{l.title}</h3>
                <p style={{ fontSize: '0.85rem', lineHeight: 1.65, color: '#5F5E5A', margin: 0 }}>{l.body}</p>
              </div>
            ))}
          </div>
          <Link href="/work/strategy-consulting/assessment" style={{
            display: 'inline-block', background: '#633806', color: '#fff',
            padding: '0.85rem 1.75rem', borderRadius: '6px',
            textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
          }}>
            Take the PACE Assessment
          </Link>
        </div>
      </section>

      {/* Who This Is For */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            Built For
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.15rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 1rem' }}>Founder-led companies</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>
                You built this business on your instincts and your energy. Now it has outgrown that. The team is capable but the system is not there yet. You need a way to lead the business that does not require you to be everywhere.
              </p>
            </div>
            <div style={{ background: '#fff', borderRadius: '8px', padding: '2rem' }}>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.15rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 1rem' }}>Family businesses in transition</h3>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>
                A second generation stepping in. An external leader brought in to professionalise. A business that has grown faster than its structures. These transitions expose every gap in strategy, alignment, and accountability — and they require a different kind of sensitivity to navigate.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* What Makes This Different */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            Not Consulting As Usual
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {differentiators.map((d, i) => (
              <div key={i} style={{ background: '#fff', border: '1px solid #E8E4DC', borderRadius: '8px', padding: '1.75rem' }}>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{d.title}</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cross Reference */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            Strategy, OKRs, and Coaching Work Together
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {crossRefs.map((c, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '1.75rem' }}>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{c.title}</h3>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: '#5F5E5A', marginBottom: '1.25rem' }}>{c.body}</p>
                <Link href={c.link} style={{ color: '#633806', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                  {c.linkLabel} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dark CTA */}
      <section style={{ background: '#2C2C2A', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '2rem' }}>
            Ready to start?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
            {[
              { title: 'Take the PACE Assessment', body: 'Find your maturity level and your most important next step.', link: '/work/strategy-consulting/assessment', label: 'Start the assessment' },
              { title: 'Read about the approach', body: 'Understand how the work unfolds before you decide.', link: '/work/strategy-consulting/approach', label: 'See the approach' },
              { title: 'Book a discovery call', body: '30 minutes. No commitment required.', link: 'https://cal.id/pgs', label: 'Book a call', external: true },
            ].map((c, i) => (
              <div key={i} style={{ background: '#3a3a38', borderRadius: '8px', padding: '1.75rem' }}>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: '0 0 0.6rem' }}>{c.title}</h3>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: '1.25rem' }}>{c.body}</p>
                <Link href={c.link} target={c.external ? '_blank' : undefined} style={{ color: '#1D9E75', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                  {c.label} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

    </main>
  )
}
