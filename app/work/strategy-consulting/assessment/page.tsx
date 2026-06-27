'use client'

import { useState } from 'react'
import Link from 'next/link'

const questions = [
  {
    q: 'How does your organisation decide its priorities for the year?',
    opts: [
      ['We have a formal planning process and the leadership team is involved', 5],
      ['The founder sets the direction and communicates it to the team', 3],
      ['We have a rough sense of direction but it is not formally documented', 2],
      ['We respond to what the market or customers bring us', 1],
    ],
  },
  {
    q: 'If you asked each member of your leadership team to name the top three priorities right now, what would happen?',
    opts: [
      ['They would give very similar answers', 5],
      ['There would be some overlap but also significant differences', 3],
      ['Each person would give a different answer', 2],
      ['We do not have a leadership team with that kind of shared visibility', 1],
    ],
  },
  {
    q: 'How does your annual plan connect to what people do week to week?',
    opts: [
      ['Through a formal cadence of weekly, monthly, and quarterly reviews', 5],
      ['Through regular check-ins but without a consistent structure', 4],
      ['It mostly does not — the plan and daily work feel disconnected', 2],
      ['We do not have a formal annual plan', 1],
    ],
  },
  {
    q: 'When an initiative is agreed in a leadership meeting, what typically happens next?',
    opts: [
      ['It is assigned to an owner with a deadline and reviewed in the next meeting', 5],
      ['It gets started but follow-through is inconsistent', 3],
      ['It depends on whether the founder follows up personally', 2],
      ['It often loses momentum within a few weeks', 1],
    ],
  },
  {
    q: 'How involved is the founder or CEO in day-to-day operational decisions?',
    opts: [
      ['Minimally — the leadership team handles operations independently', 5],
      ['Moderately — the founder is consulted on important decisions', 4],
      ['Significantly — most decisions come back to the founder', 2],
      ['Almost entirely — the founder makes most decisions personally', 1],
    ],
  },
  {
    q: 'How would you describe your organisation\'s meeting rhythm?',
    opts: [
      ['Structured — we have clear weekly, monthly, and quarterly meetings with defined purposes', 5],
      ['Partial — we have some regular meetings but they vary in quality and output', 3],
      ['Ad hoc — we meet when something needs to be discussed', 2],
      ['Reactive — most meetings happen in response to a problem or crisis', 1],
    ],
  },
  {
    q: 'When you miss a target or a key result, what typically happens?',
    opts: [
      ['We review what happened, understand the cause, and adjust our plan', 5],
      ['The founder addresses it directly with the relevant person', 3],
      ['It is acknowledged but rarely leads to a structured response', 2],
      ['Targets are set but rarely tracked closely enough to notice misses early', 1],
    ],
  },
  {
    q: 'How would you describe your leadership team\'s ownership of strategy?',
    opts: [
      ['They own their piece of the plan and hold themselves and each other accountable', 5],
      ['They are aware of the strategy but see execution as the founder\'s responsibility', 3],
      ['Strategy is seen as a leadership team activity but execution is siloed by function', 2],
      ['Strategy is primarily the founder\'s domain', 1],
    ],
  },
  {
    q: 'How does your organisation handle competing priorities?',
    opts: [
      ['Through a clear framework that the leadership team uses to make trade-offs', 5],
      ['The founder makes the call when priorities conflict', 3],
      ['It is handled case by case, often creating confusion', 2],
      ['We try to do everything and bandwidth becomes the explanation for what does not happen', 1],
    ],
  },
  {
    q: 'How confident are you that your organisation will be executing against the same strategic direction six months from now?',
    opts: [
      ['Very confident — we have the rhythm and accountability structures in place', 5],
      ['Fairly confident — but it depends on the founder staying closely involved', 3],
      ['Not very confident — execution tends to drift after the first quarter', 2],
      ['Not confident at all — we struggle to maintain direction beyond a few weeks', 1],
    ],
  },
]

const results: Record<number, {
  badge: string
  badgeBg: string
  badgeColor: string
  cardBg: string
  cardBorder: string
  headline: string
  body: string
  detail: string
  cta: string
  ctaHref: string
  secondary: string
  secondaryHref: string
}> = {
  1: {
    badge: 'Level 1 — Reactive Organisation',
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
    cardBg: '#F5F4F2',
    cardBorder: '#B4B2A9',
    headline: 'Your organisation is running on the founder\'s energy. That is not a sustainable growth model.',
    body: 'Right now, strategy lives in one person\'s head and execution depends on one person\'s presence. This is not a failure — it is a stage. But it has a ceiling, and you are probably already feeling it.',
    detail: 'The work at this level is foundational. Before any framework or system can be introduced, the first layer of shared direction and independent execution needs to be built. This is where the PACE engagement starts — not with OKRs or quarterly reviews, but with the structural work that makes everything else possible.',
    cta: 'Book a discovery call',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Read the approach',
    secondaryHref: '/work/strategy-consulting/approach',
  },
  2: {
    badge: 'Level 2 — Intuitive Direction',
    badgeBg: '#FAEEDA',
    badgeColor: '#633806',
    cardBg: '#FDF6EE',
    cardBorder: '#633806',
    headline: 'You know where you are going. Your team is guessing.',
    body: 'The direction exists — in your head. The team is capable and willing, but they are operating on inference and assumption. When you are in the room, things align. When you are not, they drift.',
    detail: 'The work at this level is externalising your direction into something the team can operate from independently. This includes the first documented plan, the first accountability structures, and the beginning of a meeting cadence.',
    cta: 'Book a discovery call',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Read the approach',
    secondaryHref: '/work/strategy-consulting/approach',
  },
  3: {
    badge: 'Level 3 — Structured Intent',
    badgeBg: '#E1F5EE',
    badgeColor: '#085041',
    cardBg: '#F0FAF6',
    cardBorder: '#1D9E75',
    headline: 'You have a plan. It is not moving.',
    body: 'The plan exists. The team knows the goals. But execution breaks down by quarter two. The plan lives in a document. Priorities multiply. Bandwidth becomes the explanation for everything that did not happen.',
    detail: 'This is where OKRs become a useful tool — not as a standalone system, but as part of a broader execution rhythm. The work at this level converts a static plan into a living operating cadence.',
    cta: 'Book a discovery call',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Read about OKR Consulting',
    secondaryHref: '/work/okr-consulting',
  },
  4: {
    badge: 'Level 4 — Aligned Execution',
    badgeBg: '#E1F5EE',
    badgeColor: '#085041',
    cardBg: '#F0FAF6',
    cardBorder: '#1D9E75',
    headline: 'You are executing. You cannot yet sustain it.',
    body: 'The leadership team broadly knows the direction and owns their piece of it. Execution is happening. But the cadence depends on the founder\'s energy to maintain, and accountability still has soft spots.',
    detail: 'The work at this level strengthens the cadence so it does not depend on you to hold it. If leadership behaviour is the limiting factor, coaching may be introduced alongside the strategy work.',
    cta: 'Book a discovery call',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Read about Executive Coaching',
    secondaryHref: '/work/executive-coaching',
  },
  5: {
    badge: 'Level 5 — Growth Rhythm',
    badgeBg: '#E1F5EE',
    badgeColor: '#085041',
    cardBg: '#F0FAF6',
    cardBorder: '#1D9E75',
    headline: 'You have built something most organisations never achieve.',
    body: 'Strategy, execution, and review are embedded in how your organisation operates. The founder is working on the business. The leadership team owns the plan. The rhythm absorbs new people and new challenges.',
    detail: 'The work at this level is sustaining and scaling what you have built — ensuring that growth does not dilute the execution culture that got you here.',
    cta: 'Book a discovery call',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Read the approach',
    secondaryHref: '/work/strategy-consulting/approach',
  },
}

type Stage = 'gate' | 'questions' | 'result'

export default function PaceAssessmentPage() {
  const [stage, setStage] = useState<Stage>('gate')
  const [gate, setGate] = useState({ name: '', email: '', org: '', role: '' })
  const [gateError, setGateError] = useState('')
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === questions.length
  const progress = Math.round((answeredCount / questions.length) * 100)

  function handleGate(e: React.FormEvent) {
    e.preventDefault()
    if (!gate.name.trim() || !gate.email.trim()) {
      setGateError('Name and email are required.')
      return
    }
    setGateError('')
    setStage('questions')
  }

  function handleSelect(qIndex: number, optIndex: number) {
    setAnswers(prev => ({ ...prev, [qIndex]: optIndex }))
  }

  function calcLevel(ans: Record<number, number>): number {
    const total = Object.keys(ans).reduce((sum, k) => {
      const score = questions[Number(k)].opts[ans[Number(k)]][1] as number
      return sum + score
    }, 0)
    const avg = total / questions.length
    if (avg <= 1.5) return 1
    if (avg <= 2.5) return 2
    if (avg <= 3.5) return 3
    if (avg <= 4.5) return 4
    return 5
  }

  async function handleSubmit() {
    if (!allAnswered || submitting) return
    setSubmitting(true)
    const level = calcLevel(answers)
    setResult(level)
    setStage('result')
    try {
      await fetch('/api/pace-assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: gate.name,
          email: gate.email,
          organisation: gate.org,
          role: gate.role,
          level,
          answers: Object.fromEntries(
            questions.map((q, i) => [`q${i + 1}`, answers[i] !== undefined ? q.opts[answers[i]][0] : ''])
          ),
        }),
      })
    } catch {
      // silent fail
    } finally {
      setSubmitting(false)
    }
  }

  const res = result ? results[result] : null

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.9rem',
    border: '1.5px solid #E8E4DC', borderRadius: '6px',
    background: '#fff', color: '#2C2C2A', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'Inter, sans-serif',
  }

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#2C2C2A' }}>

      {/* Breadcrumb */}
      <div style={{ padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A', borderBottom: '1px solid #E8E4DC', maxWidth: '900px', margin: '0 auto' }}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/work/strategy-consulting" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Strategy Consulting</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>PACE Assessment</span>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '3rem 2rem 5rem' }}>

        {/* GATE */}
        {stage === 'gate' && (
          <>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '0.85rem' }}>
              PACE Maturity Assessment
            </p>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, lineHeight: 1.3, color: '#2C2C2A', marginBottom: '0.85rem' }}>
              Where is your organisation on the strategy maturity curve?
            </h1>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#5F5E5A', marginBottom: '2rem' }}>
              Ten questions. About five minutes. You will find out which of five maturity levels describes your organisation right now — and what the most important next step is. Your responses are saved so PGS can follow up if helpful.
            </p>
            <form onSubmit={handleGate}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#2C2C2A', marginBottom: '0.35rem' }}>
                  Name <span style={{ color: '#633806' }}>*</span>
                </label>
                <input style={inputStyle} type="text" placeholder="Your full name" value={gate.name} onChange={e => setGate({ ...gate, name: e.target.value })} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#2C2C2A', marginBottom: '0.35rem' }}>
                  Email <span style={{ color: '#633806' }}>*</span>
                </label>
                <input style={inputStyle} type="email" placeholder="your@email.com" value={gate.email} onChange={e => setGate({ ...gate, email: e.target.value })} />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 400, color: '#888', marginBottom: '0.35rem' }}>
                  Organisation <span style={{ fontSize: '0.78rem' }}>(optional)</span>
                </label>
                <input style={inputStyle} type="text" placeholder="Where you work" value={gate.org} onChange={e => setGate({ ...gate, org: e.target.value })} />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 400, color: '#888', marginBottom: '0.35rem' }}>
                  Your role <span style={{ fontSize: '0.78rem' }}>(optional)</span>
                </label>
                <input style={inputStyle} type="text" placeholder="Founder, CEO, COO..." value={gate.role} onChange={e => setGate({ ...gate, role: e.target.value })} />
              </div>
              {gateError && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: '0.75rem' }}>{gateError}</p>}
              <button type="submit" style={{
                background: '#633806', color: '#fff', width: '100%', padding: '0.85rem',
                border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', fontFamily: 'Inter, sans-serif',
              }}>
                Start the Assessment
              </button>
              <p style={{ fontSize: '0.78rem', color: '#5F5E5A', textAlign: 'center', marginTop: '0.85rem' }}>
                Your information is shared only with PGS and is not used for any other purpose.
              </p>
            </form>
          </>
        )}

        {/* QUESTIONS */}
        {stage === 'questions' && (
          <>
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: '#5F5E5A' }}>{answeredCount} of {questions.length} answered</span>
                <span style={{ fontSize: '0.8rem', color: '#5F5E5A' }}>{progress}%</span>
              </div>
              <div style={{ height: '3px', background: '#E8E4DC', borderRadius: '2px' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: '#1D9E75', borderRadius: '2px', transition: 'width 0.3s' }} />
              </div>
            </div>

            {questions.map((question, qIndex) => (
              <div key={qIndex} style={{ marginBottom: '2.5rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#633806', marginBottom: '0.5rem' }}>
                  Question {qIndex + 1}
                </p>
                <h3 style={{ fontFamily: 'Lora, serif', fontSize: '1.05rem', fontWeight: 700, color: '#2C2C2A', lineHeight: 1.4, marginBottom: '1rem' }}>
                  {question.q}
                </h3>
                <div>
                  {question.opts.map((opt, optIndex) => {
                    const isSelected = answers[qIndex] === optIndex
                    return (
                      <div
                        key={optIndex}
                        onClick={() => handleSelect(qIndex, optIndex)}
                        style={{
                          background: isSelected ? '#F0FAF6' : '#fff',
                          border: `1.5px solid ${isSelected ? '#1D9E75' : '#E8E4DC'}`,
                          borderRadius: '8px', padding: '0.9rem 1rem',
                          fontSize: '0.9rem', color: '#2C2C2A', cursor: 'pointer',
                          marginBottom: '0.6rem', lineHeight: 1.55,
                          display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                          transition: 'border-color 0.15s, background 0.15s',
                        }}
                      >
                        <div style={{
                          width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0,
                          border: `2px solid ${isSelected ? '#1D9E75' : '#D0CEC8'}`,
                          marginTop: '1px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'border-color 0.15s',
                        }}>
                          {isSelected && <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1D9E75' }} />}
                        </div>
                        <span>{opt[0]}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to top, #FAF8F5 80%, transparent)', paddingTop: '1.5rem', paddingBottom: '1rem' }}>
              <button
                onClick={handleSubmit}
                disabled={!allAnswered || submitting}
                style={{
                  background: allAnswered ? '#633806' : '#D0CEC8',
                  color: '#fff', width: '100%', padding: '0.9rem',
                  border: 'none', borderRadius: '6px', fontWeight: 700,
                  fontSize: '0.95rem', cursor: allAnswered ? 'pointer' : 'not-allowed',
                  fontFamily: 'Inter, sans-serif', transition: 'background 0.2s',
                }}
              >
                {submitting ? 'Processing...' : allAnswered ? 'See My Result' : `Answer all ${questions.length} questions to continue`}
              </button>
            </div>
          </>
        )}

        {/* RESULT */}
        {stage === 'result' && res && (
          <>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#1D9E75', marginBottom: '1rem' }}>
              Your Result
            </p>
            <span style={{
              display: 'inline-block', background: res.badgeBg, color: res.badgeColor,
              padding: '0.35rem 1rem', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: '1.25rem',
            }}>
              {res.badge}
            </span>
            <h1 style={{ fontFamily: 'Lora, serif', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, lineHeight: 1.3, color: '#2C2C2A', marginBottom: '1.25rem' }}>
              {res.headline}
            </h1>
            <div style={{ background: res.cardBg, border: `1.5px solid ${res.cardBorder}`, borderRadius: '12px', padding: '1.75rem', marginBottom: '1.75rem' }}>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#2C2C2A', marginBottom: '1rem' }}>{res.body}</p>
              <p style={{ fontSize: '0.95rem', lineHeight: 1.75, color: '#5F5E5A', margin: 0 }}>{res.detail}</p>
            </div>
            <Link href={res.ctaHref} target={res.ctaHref.startsWith('http') ? '_blank' : undefined} style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              background: '#633806', color: '#fff', padding: '0.9rem',
              borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem',
            }}>
              {res.cta}
            </Link>
            <Link href={res.secondaryHref} style={{
              display: 'block', textAlign: 'center', textDecoration: 'none',
              border: '1.5px solid #633806', color: '#633806', padding: '0.85rem',
              borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem',
            }}>
              {res.secondary}
            </Link>
            <p style={{ fontSize: '0.78rem', color: '#5F5E5A', textAlign: 'center', marginTop: '1.25rem' }}>
              Your responses have been saved. PGS may reach out if there is something worth discussing.
            </p>
          </>
        )}

      </div>
    </main>
  )
}
