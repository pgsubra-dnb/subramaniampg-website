import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Coaching Outcomes | Executive Coaching | Subramaniam P G',
  description: 'Real outcomes from real executive coaching engagements. No names. Verified results.',
  alternates: { canonical: 'https://www.subramaniampg.guru/work/executive-coaching/outcomes' },
}

const stories = [
  {
    number: '01',
    title: 'The leader who could not let go',
    context: 'A senior manager had just taken on a larger team and mandate. His team depended on him for every decision. He worked harder than anyone and complained about the workload.',
    revealed: 'He was not delegating because he feared something would go wrong. He carried tasks below his level to feel in control. He found it hard to say no because he saw every request as an opportunity he might miss.',
    workedOn: [
      'Mapping which meetings he was attending and why',
      'Identifying which meetings his team could own',
      'Building a habit of expressing his views in forums where he had previously stayed quiet',
      'Creating a simple system for recognising and appreciating his team',
    ],
    resultLabel: 'What changed',
    result: 'Daily meetings reduced from six or seven to under five. He stopped attending first-level calls where he had no role. Team members reported feeling more trusted. His expressions of appreciation, near zero at the start, became a consistent weekly practice. A follow-up survey with his stakeholders confirmed all of these shifts.',
  },
  {
    number: '02',
    title: 'The results driver who damaged relationships',
    context: 'A GM had doubled revenue since joining. Management believed he had potential to go further. The problem was his style — he pushed hard, communicated harshly, and had high attrition.',
    revealed: 'He was not enabling outcomes in his team — he was achieving outcomes despite them. His communication style was causing team members to shut down rather than step up.',
    workedOn: [
      'Moving from being the person who achieved results to enabling others to achieve them',
      'Pausing before responding in difficult moments',
      'Spending more time setting expectations than correcting mistakes',
      'Building personal rapport beyond transactional conversations',
    ],
    resultLabel: 'What changed',
    result: 'Two of his four direct reports confirmed he had stopped yelling in meetings. His manager reported a significant reduction in conflict escalations. At the final three-way review, his manager said he had become the most responsive leader among his peers.',
  },
  {
    number: '03',
    title: 'The emerging leader stepping into a bigger role',
    context: 'A young leader with high energy was being developed for a senior role. He was giving feedback but it was not landing. He was committed to learning but had no structured plan.',
    revealed: 'His warmth made it hard to give firm direction. His expectations to the team were soft. Accountability was low despite his genuine effort and care.',
    workedOn: [
      'Communicating expectations in specific, time-bound language',
      'Using a structured accountability model to clarify roles',
      'Linking his learning investments to his delivery goals',
      'Building a feedback practice that goes beyond the moment of the conversation',
    ],
    resultLabel: 'What is changing',
    result: 'Early signs include more structured conversations with his team and a clearer personal development plan linked to his role priorities.',
  },
]

export default function OutcomesPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5', color: '#2C2C2A', fontFamily: 'Inter, sans-serif' }}>
    <NavBar />

      {/* Breadcrumb */}
      <div style={{ padding: '0.75rem 2rem', fontSize: '0.85rem', color: '#5F5E5A', maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/work/executive-coaching" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Executive Coaching</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Outcomes</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '2rem 2rem 1.5rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
          Outcomes
        </p>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.25, color: '#2C2C2A', marginBottom: '1.25rem' }}>
          What actually changes when coaching works.
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#5F5E5A', maxWidth: '640px', margin: 0 }}>
          These are real outcomes from real engagements. Names are withheld. The patterns are not.
        </p>
      </section>

      {/* Stories */}
      <section style={{ padding: '2rem 2rem 4rem', maxWidth: '900px', margin: '0 auto' }}>
        {stories.map((story, i) => (
          <div key={i} style={{
            background: '#fff',
            border: '0.5px solid #E8E4DC',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1.75rem',
          }}>
            {/* Card header */}
            <div style={{
              background: '#633806',
              padding: '1.5rem 2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>
                {story.number}
              </span>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1rem, 2vw, 1.2rem)', fontWeight: 600, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                {story.title}
              </h2>
            </div>

            {/* Card body */}
            <div style={{ padding: '1.75rem 2rem' }}>

              {/* Two columns */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '0.5px solid #E8E4DC',
              }}>
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '0.5rem' }}>
                    Context
                  </p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>
                    {story.context}
                  </p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '0.5rem' }}>
                    What the feedback revealed
                  </p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>
                    {story.revealed}
                  </p>
                </div>
              </div>

              {/* Worked on */}
              <div style={{
                marginBottom: '1.5rem',
                paddingBottom: '1.5rem',
                borderBottom: '0.5px solid #E8E4DC',
              }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '0.75rem' }}>
                  What he worked on
                </p>
                {story.workedOn.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
                    <div style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#1D9E75', flexShrink: 0, marginTop: '7px',
                    }} />
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#5F5E5A', margin: 0 }}>
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              {/* Result box */}
              <div style={{
                background: '#F0FAF6',
                borderLeft: '3px solid #1D9E75',
                borderRadius: '0 8px 8px 0',
                padding: '1.25rem 1.5rem',
              }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F6E56', marginBottom: '0.5rem' }}>
                  {story.resultLabel}
                </p>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: '#2C2C2A', margin: 0 }}>
                  {story.result}
                </p>
              </div>

            </div>
          </div>
        ))}
      </section>

      {/* Honest note */}
      <section style={{ background: '#FAEEDA', padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto' }}>
          <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#633806', marginBottom: '1.5rem' }}>
            An Honest Note
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#5F5E5A', marginBottom: '1rem' }}>
            Coaching does not work if the coachee is unwilling to hear uncomfortable feedback. It does not work if the engagement is too short to allow behavioural change to take root. It does not replace therapy for deeper personal challenges.
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#5F5E5A', marginBottom: '1rem' }}>
            Most engagements also go through a slow period. Life happens — new responsibilities, personal events, business pressures. The work continues at a pace that is realistic.
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>
            What coaching can do: give you a structured process, an honest outside perspective, real data about how others experience you, and the accountability to follow through.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ background: '#2C2C2A', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '560px', margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.75rem' }}>
            Ready to explore?
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '1rem', lineHeight: 1.65, marginBottom: '2rem' }}>
            Book a 30-minute discovery call. No commitment required.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="https://cal.id/pgs" target="_blank" style={{
              background: '#633806', color: '#fff', padding: '0.9rem 2rem',
              borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem',
            }}>
              Book a Call
            </Link>
            <Link href="/work/executive-coaching/approach" style={{
              border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', padding: '0.9rem 2rem',
              borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
            }}>
              Read the Approach
            </Link>
          </div>
        </div>
      </section>

    <Footer />
    </div>
  )
}
