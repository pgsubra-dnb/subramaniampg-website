import Link from 'next/link'

export const metadata = {
  title: 'Coaching Outcomes | Executive Coaching | Subramaniam P G',
  description:
    'Real outcomes from real executive coaching engagements. No names. Verified results.',
}

const stories = [
  {
    title: 'The leader who could not let go',
    context:
      'A senior manager had just taken on a larger team and a larger mandate. He was known as a domain expert. His team depended on him for every decision. He worked harder than anyone and complained about the workload.',
    revealed:
      'He was not delegating because he feared that if he did, something would go wrong and he would be held responsible. He carried tasks below his level to feel in control. He found it hard to say no because he saw every request as an opportunity he might miss.',
    workedOn: [
      'Mapping which meetings he was attending and why',
      'Identifying which meetings his team could own',
      'Building a habit of expressing his views in forums where he had previously stayed quiet',
      'Creating a simple system for recognising and appreciating his team',
    ],
    changed:
      'Daily meetings reduced from six or seven to under five. He stopped attending first-level calls where he had no role. Team members reported feeling more trusted. His expressions of appreciation, near zero at the start, became a consistent weekly practice. A follow-up survey with his stakeholders confirmed all of these shifts.',
  },
  {
    title: 'The results driver who damaged relationships',
    context:
      'A general manager had doubled revenue since joining his company. His management believed he had the potential to go further. The problem was his style — he pushed his team hard, communicated harshly, and had high attrition.',
    revealed:
      'His initial assumption was that his team lacked discipline. The real picture was different. He was not enabling outcomes in his team. He was achieving outcomes despite them. His communication style was causing team members to shut down rather than step up.',
    workedOn: [
      'Moving from being the person who achieved results to being the person who enabled others to achieve results',
      'Pausing before responding in difficult moments',
      'Spending more time setting expectations than correcting mistakes',
      'Building personal rapport beyond transactional conversations',
    ],
    changed:
      'Two of his four direct reports confirmed he had stopped yelling in meetings. His manager reported a significant reduction in conflict escalations. At the final three-way review, his manager said he had become the most responsive leader among his peers. He left the engagement with a plan to build personal rapport with his team — something he had never considered before.',
  },
  {
    title: 'The emerging leader stepping into a bigger role',
    context:
      'A young leader with high energy and a strong work ethic was being developed for a senior role. He was giving feedback to his team but the feedback was not landing. He was committed to learning but had no structured plan.',
    revealed:
      'His top strengths — warmth and care for others — were assets in some situations and liabilities in others. He found it hard to give clear, firm direction because he did not want to disappoint people. His expectations to his team were soft. Accountability was low.',
    workedOn: [
      'Communicating expectations in specific, time-bound language',
      'Using a structured accountability model to clarify roles',
      'Linking his learning investments to his delivery goals',
      'Building a feedback practice that went beyond the moment of the conversation',
    ],
    changed:
      'This engagement was in progress at the time of writing. Early signs included more structured conversations with his team and a clearer personal development plan linked to his role priorities.',
    inProgress: true,
  },
]

export default function OutcomesPage() {
  return (
    <main style={{ background: '#FAF8F5', color: '#2C2C2A', fontFamily: 'Inter, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/work/executive-coaching" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Executive Coaching</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Outcomes</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '4rem 2rem 3rem', maxWidth: '860px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
          Outcomes
        </p>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.25, color: '#2C2C2A', marginBottom: '1.25rem' }}>
          What actually changes when coaching works.
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#5F5E5A', maxWidth: '640px' }}>
          These are real outcomes from real engagements. Names are withheld. The patterns are not.
        </p>
      </section>

      {/* Stories */}
      <section style={{ padding: '2rem 2rem 4rem', maxWidth: '860px', margin: '0 auto' }}>
        {stories.map((story, i) => (
          <div key={i} style={{
            background: '#fff', border: '1px solid #E8E4DC',
            borderRadius: '8px', padding: '2.5rem', marginBottom: '2rem'
          }}>
            {story.inProgress && (
              <span style={{
                display: 'inline-block', background: '#FAEEDA', color: '#633806',
                fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.08em',
                textTransform: 'uppercase', padding: '0.25rem 0.75rem',
                borderRadius: '20px', marginBottom: '1rem'
              }}>
                In Progress
              </span>
            )}
            <h2 style={{ fontFamily: 'Lora, serif', fontSize: '1.35rem', fontWeight: 700, color: '#2C2C2A', margin: '0 0 2rem' }}>
              {story.title}
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#633806', marginBottom: '0.5rem' }}>Context</p>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{story.context}</p>
              </div>
              <div>
                <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#633806', marginBottom: '0.5rem' }}>What the feedback revealed</p>
                <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#5F5E5A', margin: 0 }}>{story.revealed}</p>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#633806', marginBottom: '0.75rem' }}>What he worked on</p>
              {story.workedOn.map((item, j) => (
                <div key={j} style={{ display: 'flex', gap: '0.75rem', marginBottom: '0.5rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#1D9E75', fontWeight: 700, flexShrink: 0, marginTop: '2px' }}>—</span>
                  <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: '#5F5E5A', margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>

            <div style={{
              background: '#F5FBF8', border: '1px solid #1D9E75',
              borderRadius: '6px', padding: '1.5rem'
            }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#1D9E75', marginBottom: '0.5rem' }}>
                {story.inProgress ? 'What is changing' : 'What changed'}
              </p>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#2C2C2A', margin: 0 }}>{story.changed}</p>
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
              borderRadius: '6px', textDecoration: 'none', fontWeight: 700, fontSize: '0.95rem'
            }}>
              Book a Call
            </Link>
            <Link href="/work/executive-coaching/approach" style={{
              border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', padding: '0.9rem 2rem',
              borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem'
            }}>
              Read the Approach
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
