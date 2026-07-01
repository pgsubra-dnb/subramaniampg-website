import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { client } from '@/lib/sanity'

export const metadata = {
  title: 'Case Studies | Subramaniam P G',
  description: 'A selection of engagements across executive coaching, strategy consulting, and OKR implementation. All details are anonymised.',
  alternates: { canonical: 'https://www.subramaniampg.guru/case-studies' },
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

const Divider = () => (
  <div className="w-full h-px" style={{ backgroundColor: '#E8E4DC' }} />
)

export default async function CaseStudiesPage() {
  let caseStudies: CaseStudy[] = []

  try {
    const fetched: CaseStudy[] = await client.fetch(
      `*[_type == "caseStudy"] | order(order asc) {
        _id,
        number,
        title,
        context,
        revealed,
        workedOn,
        resultLabel,
        result
      }`,
      {},
      { next: { revalidate: 3600 } }
    )
    caseStudies = fetched
  } catch {
    caseStudies = []
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20">
        <p className="section-label mb-6">Case Studies</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-4">
          Case Studies
        </h1>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl">
          A selection of engagements across executive coaching, strategy consulting, and OKR implementation. All details are anonymised.
        </p>
      </section>

      <Divider />

      {/* Case study cards */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 1.5rem' }}>
          {caseStudies.length === 0 ? (
            <p className="text-[#5F5E5A] text-lg">Case studies coming soon.</p>
          ) : (
            caseStudies.map((story) => (
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
            ))
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to explore?
            </h2>
            <p className="text-white/60 leading-relaxed mb-8">
              Book a 30-minute discovery call. No commitment required.
            </p>
            <a
              href="https://cal.id/pgs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-lg text-white font-medium hover:opacity-90 transition-opacity"
              style={{ backgroundColor: '#633806' }}
            >
              Book a Call
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
