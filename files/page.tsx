import Link from 'next/link'

export const metadata = {
  title: 'Executive Coaching | Subramaniam P G',
  description:
    'Structured executive coaching for leaders who have outgrown their current style. Assessment-based, goal-anchored, outcome-verified.',
}

const painQuotes = [
  {
    text: 'My team delivers when I am involved. The moment I step back, things fall apart. I do not know if the problem is them or me.',
  },
  {
    text: 'I keep getting feedback that I need to be more empathetic. I do not even know what that means in practice.',
  },
  {
    text: 'I am producing results. My manager says I have potential for the next level. But something is blocking me and I cannot name it.',
  },
]

const problems = [
  {
    number: '01',
    title: 'Doing instead of enabling',
    body: 'You are still the most capable person in the room. Your team waits for you before they move. You are a bottleneck disguised as a high performer.',
  },
  {
    number: '02',
    title: 'Results without relationships',
    body: 'The numbers are good. The trust is not. Team members deliver but do not stay. Peers work around you rather than with you.',
  },
  {
    number: '03',
    title: 'The style that got you here',
    body: 'High standards, direct communication, personal accountability — what made you effective as an individual contributor starts working against you as a leader.',
  },
]

const steps = [
  {
    label: 'Step 1',
    title: 'Understand the real picture',
    body: '360-degree feedback from your manager, peers, and team. A strengths assessment. A clear view of how others experience you — not how you think they do.',
  },
  {
    label: 'Step 2',
    title: 'Set goals in your own words',
    body: 'No imposed frameworks. You decide what you want to change and what success looks like. Goals are written in your language and tracked through the engagement.',
  },
  {
    label: 'Step 3',
    title: 'Track and verify the change',
    body: 'A follow-up with your stakeholders at the end of the engagement confirms what has shifted. Outcomes are not assumed. They are corroborated.',
  },
]

const outcomes = [
  {
    title: 'From doer to enabler',
    body: 'A senior manager stepping into a larger role reduced his daily meeting load from six or seven meetings to under five. He started delegating routine calls to his team. His team members reported feeling more trusted and autonomous.',
  },
  {
    title: 'From harsh to heard',
    body: 'A high-performing GM was told his results were strong but his style was damaging. By the end of the engagement, his manager reported a significant reduction in conflict escalations. Two direct reports confirmed he had stopped yelling in meetings. His manager described him as the most responsive leader among his peers.',
  },
  {
    title: 'From reactive to intentional',
    body: 'An emerging leader was giving feedback but not following through. He learned to set expectations using measurable outcomes and build accountability systems that did not depend on his constant presence.',
  },
]

const differentiators = [
  {
    title: 'Assessment-first',
    body: 'Every engagement starts with data — VIA Character Survey and 360-degree feedback — so the work is grounded in reality, not assumptions.',
  },
  {
    title: 'Goal-anchored',
    body: 'Goals are written in your words, not extracted from a coaching model. The engagement follows your priorities.',
  },
  {
    title: 'Outcome-verified',
    body: 'Progress is corroborated with stakeholders, not self-reported. You will know what changed. So will the people around you.',
  },
]

export default function ExecutiveCoachingPage() {
  return (
    <main style={{ background: '#FAF8F5', color: '#2C2C2A', fontFamily: 'Inter, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Executive Coaching</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '4rem 2rem 3rem', maxWidth: '860px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
          Executive Coaching
        </p>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 700, lineHeight: 1.2, color: '#2C2C2A', marginBottom: '1.5rem' }}>
          Most leaders plateau not because they lack skill.<br />They plateau because their style stops working.
        </h1>
        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#5F5E5A', maxWidth: '680px', marginBottom: '2rem' }}>
          You got here by doing more, deciding faster, and holding higher standards than everyone around you. At some point, that same approach starts costing you — in team attrition, in missed promotions, in relationships that feel transactional. Coaching helps you see what you cannot see on your own and change what is not working.
        </p>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <Link href="https://cal.id/pgs" target="_blank" style={{
            background: '#633806', color: '#fff', padding: '0.85rem 1.75rem',
            borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem'
          }}>
            Book a Discovery Call
          </Link>
          <Link href="/work/executive-coaching/approach" style={{
            border: '1.5px solid #633806', color: '#633806', padding: '0.85rem 1.75rem',
            borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem'
          }}>
            See How It Works
          </Link>
        </div>
      </section>

      {/* Sound Familiar */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            What Leaders Say Before They Start
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {painQuotes.map((q, i) => (
              <div key={i} style={{
                borderLeft: '4px solid #633806', background: '#fff',
                padding: '1.5rem', borderRadius: '0 8px 8px 0'
              }}>
                <p style={{ fontSize: '1rem', lineHeight: 1.65, color: '#2C2C2A', margin: 0, fontStyle: 'italic' }}>
                  &ldquo;{q.text}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What Gets in the Way */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            The Patterns That Stall Leaders
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
            {problems.map((p) => (
              <div key={p.number} style={{
                background: '#fff', border: '1px solid #E8E4DC',
                borderRadius: '8px', padding: '2rem'
              }}>
                <p style={{ fontSize: '2rem', fontFamily: 'Lora, serif', fontWeight: 700, color: '#FAEEDA', margin: '0 0 1rem' }}>{p.number}</p>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.15rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{p.title}</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: '#5F5E5A', margin: 0 }}>{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '0.75rem' }}>
            How It Works
          </p>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2C2C2A', marginBottom: '0.75rem' }}>
            Not generic sessions. Not open-ended conversation.
          </h2>
          <p style={{ fontSize: '1rem', color: '#5F5E5A', marginBottom: '2.5rem', lineHeight: 1.65 }}>
            A structured engagement with a clear goal, real data, and measurable outcomes.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {steps.map((s, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <div style={{ background: '#fff', borderRadius: '8px', padding: '1.75rem', height: '100%' }}>
                  <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.5rem' }}>{s.label}</p>
                  <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{s.title}</h3>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: '#5F5E5A', margin: 0 }}>{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Outcomes */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '0.75rem' }}>
            Outcomes From Real Engagements
          </p>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.75rem', fontWeight: 700, color: '#2C2C2A', marginBottom: '2rem' }}>
            No names. Real results.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {outcomes.map((o, i) => (
              <div key={i} style={{
                border: '1px solid #E8E4DC', borderLeft: '4px solid #1D9E75',
                background: '#fff', borderRadius: '0 8px 8px 0', padding: '1.75rem'
              }}>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{o.title}</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{o.body}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem' }}>
            <Link href="/work/executive-coaching/outcomes" style={{ color: '#633806', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none' }}>
              Read the full engagement stories →
            </Link>
          </div>
        </div>
      </section>

      {/* What Makes This Different */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '2rem' }}>
            Not Coaching As Usual
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {differentiators.map((d, i) => (
              <div key={i} style={{ background: '#fff', borderRadius: '8px', padding: '1.75rem' }}>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 0.75rem' }}>{d.title}</h3>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.65, color: '#5F5E5A', margin: 0 }}>{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who This Is For */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem' }}>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1rem' }}>
              Right For You If
            </p>
            {[
              'You are a high performer being considered for the next level',
              'You have received feedback you struggle to act on',
              'Your team delivers results but does not feel motivated',
              'You are stepping into a larger role and want to get ahead of the transition',
              'You want an honest outside perspective, not a supportive listener',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#1D9E75', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>—</span>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#5F5E5A', margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
          <div>
            <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '1rem' }}>
              Not the Right Fit If
            </p>
            {[
              'You are looking for someone to validate your existing approach',
              'You want therapy, mentoring, or strategic advice',
              'You are not willing to hear feedback that challenges your self-image',
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.85rem', alignItems: 'flex-start' }}>
                <span style={{ color: '#5F5E5A', fontWeight: 700, marginTop: '2px', flexShrink: 0 }}>—</span>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#5F5E5A', margin: 0 }}>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Assessment CTA */}
      <section style={{ background: '#1D9E75', padding: '3rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
            Not sure if coaching is what you need?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '1.75rem' }}>
            Take a 10-question assessment. It will tell you whether coaching, mentoring, or structured learning is the right fit for your situation right now.
          </p>
          <Link href="/work/executive-coaching/assessment" style={{
            background: '#fff', color: '#1D9E75', padding: '0.9rem 2rem',
            borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem'
          }}>
            Take the Assessment
          </Link>
        </div>
      </section>

      {/* Dark CTA */}
      <section style={{ background: '#2C2C2A', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '860px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '2rem' }}>
            Ready to start?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
            <div style={{ background: '#3a3a38', borderRadius: '8px', padding: '1.75rem' }}>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.75rem' }}>Read about the approach</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Understand the structure, tools, and timeline before you decide.
              </p>
              <Link href="/work/executive-coaching/approach" style={{ color: '#1D9E75', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                See the approach →
              </Link>
            </div>
            <div style={{ background: '#3a3a38', borderRadius: '8px', padding: '1.75rem' }}>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.75rem' }}>See what clients change</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                Real outcomes from real engagements. No names.
              </p>
              <Link href="/work/executive-coaching/outcomes" style={{ color: '#1D9E75', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                Read the outcomes →
              </Link>
            </div>
            <div style={{ background: '#3a3a38', borderRadius: '8px', padding: '1.75rem' }}>
              <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 0.75rem' }}>Book a discovery call</h3>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                30 minutes. No commitment required.
              </p>
              <Link href="https://cal.id/pgs" target="_blank" style={{ color: '#1D9E75', fontWeight: 600, fontSize: '0.9rem', textDecoration: 'none' }}>
                Book a call →
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  )
}
