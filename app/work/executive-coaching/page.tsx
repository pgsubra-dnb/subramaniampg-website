import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

const BASE = 'https://www.subramaniampg.guru'

export const metadata = {
  title: 'Executive Coaching for Founders & CXOs India | Subramaniam P G',
  description:
    'One-on-one executive coaching for founders and CXOs navigating growth, transition, and complexity. Subramaniam P G coaches senior leaders across India and Asia.',
  alternates: { canonical: `${BASE}/work/executive-coaching` },
  openGraph: {
    title: 'Executive Coaching | Subramaniam P G',
    description: 'One-on-one coaching for founders and CXOs navigating growth, transition, and leadership complexity.',
    url: `${BASE}/work/executive-coaching`,
  },
}

const serviceJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Executive Coaching',
  description:
    'One-on-one executive coaching for founders and CXOs. Subramaniam P G works with senior leaders on thinking, decision-making, and leadership effectiveness.',
  provider: {
    '@type': 'Person',
    name: 'Subramaniam P G',
    url: BASE,
  },
  areaServed: { '@type': 'Country', name: 'India' },
  url: `${BASE}/work/executive-coaching`,
}

export default function ExecutiveCoachingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }} />
      <NavBar />

      {/* Breadcrumb */}
      <div className="max-w-5xl mx-auto px-6 pt-6 pb-2">
        <p className="text-sm text-[#5F5E5A]">Executive Coaching</p>
      </div>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-center">

          {/* Left — 3 of 5 */}
          <div className="lg:col-span-3">
            <p className="text-xs font-medium tracking-widest uppercase text-[#1D9E75] mb-4">
              Executive Coaching
            </p>
            <h1 className="font-lora text-4xl font-bold text-[#2C2C2A] leading-snug mb-2">
              1-on-1 Executive Coaching
            </h1>
            <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>
              Enabling Growth. Purposefully.
            </p>
            <p className="text-base text-[#5F5E5A] leading-relaxed mb-8">
              Leadership at the top can be isolating. The decisions are complex, the stakes are
              high, and the number of people you can speak openly with is small. Executive coaching
              with Subramaniam P G gives founders and CXOs a trusted space to think clearly,
              challenge assumptions, and make better decisions — drawing from ancient wisdom
              traditions and four decades of field experience.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/work/executive-coaching/assessment"
                className="bg-[#633806] text-[#FAEEDA] px-6 py-3 rounded font-medium text-sm"
              >
                Take the readiness assessment →
              </Link>
              <a
                href="https://cal.id/pgs/short-discussion"
                target="_blank"
                rel="noopener noreferrer"
                className="border border-[#633806] text-[#633806] px-6 py-3 rounded font-medium text-sm"
              >
                Book a discovery call
              </a>
            </div>
          </div>

          {/* Right — 2 of 5 */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <div className="bg-[#FAEEDA] rounded-xl p-6">
              <p className="text-xs font-medium text-[#633806] uppercase tracking-wide mb-3">
                Who this is for
              </p>
              <p className="font-lora text-lg text-[#2C2C2A] leading-snug">
                Founders and CXOs navigating growth, transition, and complexity.
              </p>
            </div>
            <div className="bg-[#E1F5EE] rounded-xl p-6">
              <p className="text-xs font-medium text-[#0F6E56] uppercase tracking-wide mb-3">
                Not sure if this is right for you?
              </p>
              <p className="text-sm text-[#2C2C2A] leading-relaxed">
                The readiness assessment takes ten minutes and tells you exactly where coaching
                will have the most impact.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* Sound Familiar */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Does any of this sound familiar?
        </h2>
        <div className="flex flex-col gap-3 mb-5">
          {[
            '"I have a lot of people around me, but very few I can think out loud with."',
            '"I know what needs to happen. I am not sure why it is not happening."',
            '"The higher I go, the less honest feedback I get."',
            '"I am spending all my time in the business and none of it on myself as a leader."',
            '"The decisions I face now are more complex than anything I have dealt with before."',
            '"I feel like I am the bottleneck in my own organisation."',
          ].map((quote) => (
            <div
              key={quote}
              className="border-l-4 px-4 py-3 rounded-r-md text-sm italic text-[#5F5E5A]"
              style={{ borderColor: '#633806', backgroundColor: '#FAEEDA' }}
            >
              {quote}
            </div>
          ))}
        </div>
        <p className="text-sm text-[#5F5E5A]">
          These are not signs of failure. They are signs that you have outgrown the informal
          support structures that worked before. Executive coaching is designed for exactly this
          stage.
        </p>
      </section>

      {/* What coaching addresses */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          What coaching addresses
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              num: '01',
              title: 'Clarity under complexity',
              body: 'When the decisions are consequential and the variables are many, having a structured thinking partner changes the quality of what you decide.',
            },
            {
              num: '02',
              title: 'Blind spots and patterns',
              body: 'The behaviours that got you here may be limiting what comes next. Coaching surfaces what is hard to see from inside the role.',
            },
            {
              num: '03',
              title: 'Leadership as a practice',
              body: 'Coaching builds the habits, structures, and inner resources that make leadership sustainable — not just effective in the short term.',
            },
          ].map((card) => (
            <div
              key={card.num}
              className="bg-white border rounded-xl p-5"
              style={{ borderColor: '#E8E4DC' }}
            >
              <p className="text-3xl font-medium mb-3" style={{ color: '#633806' }}>
                {card.num}
              </p>
              <p className="text-sm font-medium text-[#2C2C2A] mb-2">{card.title}</p>
              <p className="text-sm text-[#5F5E5A] leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Approach snapshot */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-3">
          A structured engagement, not just conversations
        </h2>
        <p className="text-sm text-[#5F5E5A] mb-8 max-w-2xl">
          The engagement runs across four phases — Discovery, Development Planning, Coaching, and
          Conclusion — typically spanning four to six months.
        </p>

        <div
          className="grid items-center mb-8"
          style={{ gridTemplateColumns: '1fr 28px 1fr 28px 1fr 28px 1fr' }}
        >
          {[
            { num: '1', label: 'Discovery', bg: '#FAEEDA', color: '#633806' },
            { num: '2', label: 'Development Planning', bg: '#E1F5EE', color: '#0F6E56' },
            { num: '3', label: 'Coaching', bg: '#EEEDFE', color: '#4F46E5' },
            { num: '4', label: 'Conclusion', bg: '#FAEEDA', color: '#633806' },
          ].map((stage, i, arr) => (
            <>
              <div
                key={stage.num}
                className="text-center p-4 border rounded-lg"
                style={{ backgroundColor: stage.bg, borderColor: stage.color + '40' }}
              >
                <p className="text-lg font-medium mb-1" style={{ color: stage.color }}>
                  {stage.num}
                </p>
                <p className="text-xs font-medium text-[#2C2C2A] leading-tight">{stage.label}</p>
              </div>
              {i < arr.length - 1 && (
                <p key={`arrow-${i}`} className="text-center text-lg" style={{ color: '#B4B2A9' }}>
                  →
                </p>
              )}
            </>
          ))}
        </div>

        <Link
          href="/work/executive-coaching/approach"
          className="text-sm font-medium"
          style={{ color: '#1D9E75' }}
        >
          See how each phase works in detail →
        </Link>
      </section>

      {/* Focus areas */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Areas of focus
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Leadership style and blind spot identification',
            'Decision-making under complexity and uncertainty',
            'Stakeholder management and influence strategies',
            'Transition into new roles or business pivots',
            'Building personal clarity, focus, and executive presence',
            'Accountability structures for personal and professional goals',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: '#1D9E75' }}
              />
              <p className="text-sm text-[#5F5E5A]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Foundations */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          What the coaching draws from
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            'Ancient wisdom traditions including the Bhagavad Gita and Yoga Sutras',
            'Modern coaching frameworks aligned with ICF standards',
            'Psychometric tools including VIA Character Strengths and MBTI',
            'Real-world executive experience across four decades and multiple industries',
          ].map((item) => (
            <div
              key={item}
              className="bg-white border rounded-xl p-5 flex items-start gap-3"
              style={{ borderColor: '#E8E4DC' }}
            >
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: '#633806' }}
              />
              <p className="text-sm text-[#5F5E5A] leading-relaxed">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonial */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          What clients say
        </h2>
        <div className="rounded-xl p-7" style={{ backgroundColor: '#FAEEDA' }}>
          <p className="font-serif text-6xl leading-none mb-2 opacity-40" style={{ color: '#633806' }}>
            &ldquo;
          </p>
          <p className="text-sm text-[#2C2C2A] leading-relaxed italic">
            The coaching sessions gave me a space I did not know I needed. PGS helped me slow
            down enough to see what was actually happening — not just what I thought was happening.
            The clarity I found in those conversations changed how I led my team and how I made
            decisions under pressure.
          </p>
          <p className="text-xs text-[#5F5E5A] font-medium mt-4">
            — A Coachee
          </p>
        </div>
        <Link
          href="/work/executive-coaching/outcomes"
          className="inline-block mt-4 text-sm font-medium"
          style={{ color: '#1D9E75' }}
        >
          See what changes for clients →
        </Link>
      </section>

      {/* Who this is for */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Is this right for you?
        </h2>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            'Founders navigating the complexity of scaling their organisations',
            'CXOs stepping into new roles or handling significant transitions',
            'Senior leaders dealing with high-stakes decisions with limited sounding boards',
            'Professionals seeking to sharpen leadership clarity, influence, and executive presence',
            'Leaders who feel the informal support structures around them are no longer enough',
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <span
                className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                style={{ backgroundColor: '#1D9E75' }}
              />
              <p className="text-sm text-[#5F5E5A]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Before you decide */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-6">
          Not ready to commit? Start here.
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E4DC' }}>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">Free readiness assessment</p>
            <p className="text-xs text-[#5F5E5A] leading-relaxed mb-3">
              Ten questions. Ten minutes. You get a personalised view of where coaching will have
              the most impact in your leadership right now.
            </p>
            <Link
              href="/work/executive-coaching/assessment"
              className="inline-flex items-center px-5 py-2.5 rounded text-sm font-medium"
              style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
            >
              Take the assessment →
            </Link>
          </div>
          <div className="bg-white border rounded-xl p-5" style={{ borderColor: '#E8E4DC' }}>
            <p className="text-sm font-medium text-[#2C2C2A] mb-1">Read about the approach</p>
            <p className="text-xs text-[#5F5E5A] leading-relaxed mb-3">
              Understand the four phases of the coaching engagement — what happens, when it
              happens, and what you leave with at the end.
            </p>
            <Link
              href="/work/executive-coaching/approach"
              className="inline-flex items-center px-5 py-2.5 rounded text-sm font-medium border"
              style={{ borderColor: '#633806', color: '#633806' }}
            >
              See the approach →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-6 pb-16">
        <div className="rounded-xl p-10 text-center" style={{ backgroundColor: '#2C2C2A' }}>
          <h2 className="font-lora text-2xl font-bold mb-3" style={{ color: '#FAEEDA' }}>
            Ready to begin?
          </h2>
          <p className="text-sm mb-5" style={{ color: '#B4B2A9' }}>
            Every engagement starts with a discovery call — a conversation about where you are,
            what you are navigating, and whether this is the right fit.
          </p>
          <Link
            href="/work/book-consulting"
            className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
            style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
          >
            Book a consulting session →
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
