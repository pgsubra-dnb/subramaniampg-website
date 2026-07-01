import Link from 'next/link'
import { client } from '@/lib/sanity'

export const metadata = {
  title: 'Strategy Consulting Outcomes | Subramaniam P G',
  description: 'Real outcomes from real strategy consulting engagements. No names. The patterns are not withheld.',
  alternates: { canonical: 'https://www.subramaniampg.guru/work/strategy-consulting/outcomes' },
}

type CaseStudy = {
  _id: string
  number: string
  title: string
  context: string
  revealed: string
  workedOn: string[]
  resultLabel: string
  result: string
}

const FALLBACK_STORIES: CaseStudy[] = [
  {
    _id: 'fallback-1',
    number: '01',
    title: 'The organisation that did not know what it did not know',
    context: 'A government-linked organisation needed to assess its marketing capability before designing a development intervention. The assumption going in was that the gaps were tactical — skills, tools, execution.',
    revealed: 'The gaps were not tactical. They were structural. There was no shared understanding of what the organisation was trying to achieve with its marketing function. Different leaders had different definitions of success. Without that clarity, any skill-building intervention would have produced activity without direction.',
    workedOn: [
      'A structured gap audit that surfaced misalignment at the leadership level before any training was designed',
      'Establishing a shared definition of what success looked like for the function',
      'Sequencing the intervention — first clarity, then capability, then execution',
      'Building a roadmap that addressed the actual constraint rather than the presenting symptom',
    ],
    resultLabel: 'What changed',
    result: 'The organisation entered the engagement expecting a training needs analysis. It left with a diagnostic that reframed the problem entirely. The roadmap that followed addressed the structural gap first — and the capability work that came after it landed on a foundation that could hold it.',
  },
  {
    _id: 'fallback-2',
    number: '02',
    title: 'The company where goals existed but alignment did not',
    context: 'A fintech company had been setting quarterly OKRs for over a year. The framework was in place. Objectives were written. Key results were defined. On paper, the organisation was running OKRs. In practice, each function was running its own version of them.',
    revealed: 'There were no company-level OKRs. Each function had written its own objectives in isolation. The sales team was optimising for acquisition. The product team was optimising for retention. The operations team was optimising for cost. All reasonable. All pulling in different directions. There was no vertical alignment connecting function-level goals to a shared company direction.',
    workedOn: [
      "Establishing a single company-level annual OKR that every function's objectives had to connect to",
      "Rebuilding each function's OKRs from the top down so vertical alignment was visible and traceable",
      'Designing a quarterly review cadence where function-level progress was visible at the company level in the same conversation',
      'Making cross-functional dependencies visible before they became conflicts',
    ],
    resultLabel: 'What changed',
    result: 'For the first time the leadership team could see whether the company was winning — not just whether each function was hitting its numbers. The annual OKR became the anchor for every quarterly planning conversation. The founder stopped being the person who held the picture of the whole business in their head alone.',
  },
  {
    _id: 'fallback-3',
    number: '03',
    title: 'The institution that was growing faster than its systems',
    context: 'A group of academic institutions had expanded significantly — more campuses, more students, more staff. The operational model that had worked at smaller scale was breaking down. Each campus was running differently. Leadership was stretched. The founder was involved in decisions that should have been resolved at the campus level.',
    revealed: 'There was no shared operating standard across campuses. What looked like an execution problem was actually an alignment problem. Campus heads had different interpretations of what good operations looked like. There was no cadence connecting campus performance to group leadership — which meant problems surfaced late and responses were reactive.',
    workedOn: [
      'Establishing a shared operating standard that defined what each campus was accountable for',
      'Clarifying which decisions sat at campus level and which required group leadership',
      'Building a monthly review cadence that gave group leadership visibility without requiring them to be present in every campus conversation',
      "Separating operational decisions from strategic ones so the founder could lead the group rather than manage its parts",
    ],
    resultLabel: 'What changed',
    result: "Campus heads began operating with more confidence and less escalation. The monthly review became the primary mechanism for surfacing issues that needed group attention. The founder was able to shift from managing operations to leading the group's direction. Expansion decisions became easier because there was now a standard to expand into.",
  },
]

export default async function OutcomesPage() {
  let stories: CaseStudy[] = []

  try {
    const fetched: CaseStudy[] = await client.fetch(
      `*[_type == "caseStudy" && serviceArea == "strategy"] | order(order asc) {
        _id,
        number,
        title,
        context,
        revealed,
        workedOn,
        resultLabel,
        result,
      }`,
      {},
      { next: { revalidate: 3600 } }
    )
    stories = fetched.length > 0 ? fetched : FALLBACK_STORIES
  } catch {
    stories = FALLBACK_STORIES
  }

  return (
    <main style={{ background: '#FAF8F5', color: '#2C2C2A', fontFamily: 'Inter, sans-serif' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A', maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/work/strategy-consulting" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Strategy Consulting</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Outcomes</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '2.5rem 2rem 2rem', maxWidth: '900px', margin: '0 auto' }}>
        <p style={{ fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
          Outcomes
        </p>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.75rem, 3.5vw, 2.75rem)', fontWeight: 700, lineHeight: 1.25, color: '#2C2C2A', marginBottom: '1.25rem' }}>
          What actually changes when strategy is built to be executed.
        </h1>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: '#5F5E5A', maxWidth: '640px', margin: 0 }}>
          These are real patterns from real engagements. Details are withheld. The shifts are not.
        </p>
      </section>

      {/* Stories */}
      <section style={{ padding: '2rem 2rem 4rem', maxWidth: '900px', margin: '0 auto' }}>
        {stories.map((story) => (
          <div key={story._id} style={{
            background: '#fff',
            border: '0.5px solid #E8E4DC',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '1.75rem',
          }}>
            {/* Card header */}
            <div style={{ background: '#633806', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}>{story.number}</span>
              <h2 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1rem, 2vw, 1.2rem)', fontWeight: 600, color: '#fff', lineHeight: 1.3, margin: 0 }}>
                {story.title}
              </h2>
            </div>

            {/* Card body */}
            <div style={{ padding: '1.75rem 2rem' }}>
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem', marginBottom: '1.5rem', paddingBottom: '1.5rem',
                borderBottom: '0.5px solid #E8E4DC',
              }}>
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '0.5rem' }}>Context</p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>{story.context}</p>
                </div>
                <div>
                  <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '0.5rem' }}>What the assessment revealed</p>
                  <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>{story.revealed}</p>
                </div>
              </div>

              <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '0.5px solid #E8E4DC' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#5F5E5A', marginBottom: '0.75rem' }}>What was worked on</p>
                {story.workedOn.map((item, j) => (
                  <div key={j} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start', marginBottom: '0.55rem' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#1D9E75', flexShrink: 0, marginTop: '7px' }} />
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: '#5F5E5A', margin: 0 }}>{item}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#F0FAF6', borderLeft: '3px solid #1D9E75', borderRadius: '0 8px 8px 0', padding: '1.25rem 1.5rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0F6E56', marginBottom: '0.5rem' }}>{story.resultLabel}</p>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.75, color: '#2C2C2A', margin: 0 }}>{story.result}</p>
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
            Strategy work takes longer to show results than most clients expect. The first month is diagnostic. The second and third month is design and early deployment. By month four or five, the rhythm starts to hold. Visible business results — revenue, retention, decision speed — typically appear between month six and twelve.
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#5F5E5A', marginBottom: '1rem' }}>
            What happens faster: the leadership team gets clearer, meetings get better, and the founder starts to feel less like the only person holding everything together.
          </p>
          <p style={{ fontSize: '1rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>
            What does not work: organisations that want a report, leadership teams that are not willing to be honest about where alignment is breaking down, and founders who want the system to change without changing how they lead.
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
            <Link href="/work/strategy-consulting/approach" style={{
              border: '1.5px solid rgba(255,255,255,0.3)', color: '#fff', padding: '0.9rem 2rem',
              borderRadius: '6px', textDecoration: 'none', fontWeight: 600, fontSize: '0.95rem',
            }}>
              Read the Approach
            </Link>
          </div>
        </div>
      </section>

    </main>
  )
}
