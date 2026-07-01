'use client'

import { useState } from 'react'
import Link from 'next/link'

const questions = [
  {
    q: 'What best describes what you are looking for right now?',
    opts: [
      ['I want to change a specific behaviour or habit that is holding me back', 'C'],
      ['I want advice from someone who has done what I am trying to do', 'M'],
      ['I want to learn a new skill or framework', 'T'],
      ['Something feels off but I cannot quite name it yet', 'N'],
    ],
  },
  {
    q: 'How clear are you on what you want to change?',
    opts: [
      ['Very clear — I can describe the gap and what good looks like', 'C'],
      ['Fairly clear — I know the area but not the specific change', 'M'],
      ['Not very clear — I need help figuring out what the real issue is', 'N'],
      ['I am under too much pressure right now to think about this', 'N'],
    ],
  },
  {
    q: 'How have you responded to feedback in the past?',
    opts: [
      ['I take it seriously and act on it, even when it is uncomfortable', 'C'],
      ['I find it useful when it comes from someone I respect', 'M'],
      ['I prefer feedback tied to specific skills I can improve', 'T'],
      ['I tend to get defensive when it challenges my self-image', 'N'],
    ],
  },
  {
    q: 'What does your work situation look like right now?',
    opts: [
      ['Stable enough to reflect and invest in my own development', 'C'],
      ['In transition — new role, new team, or significant change', 'M'],
      ['Under significant pressure — survival mode more than growth mode', 'N'],
      ['Unclear — things are shifting and I am not sure where I stand', 'N'],
    ],
  },
  {
    q: 'What do you think is the primary source of your challenge?',
    opts: [
      ['How I behave or communicate with others', 'C'],
      ['Lack of experience or exposure in a new area', 'M'],
      ['Missing knowledge or a specific skill', 'T'],
      ['I genuinely do not know yet', 'N'],
    ],
  },
  {
    q: 'How do you feel about being challenged by someone outside your organisation?',
    opts: [
      ['Comfortable — I want honest pushback, not validation', 'C'],
      ['Open, as long as they understand my context', 'M'],
      ['Slightly uncomfortable but willing to try', 'C'],
      ['Not ready for that level of exposure right now', 'N'],
    ],
  },
  {
    q: 'What outcome matters most to you?',
    opts: [
      ['A measurable shift in how others experience me', 'C'],
      ['Specific advice on decisions I am facing', 'M'],
      ['A skill I can apply immediately', 'T'],
      ['Clarity on what I actually need', 'N'],
    ],
  },
  {
    q: 'How much time and energy can you realistically invest right now?',
    opts: [
      ['Significant — I am treating this as a priority', 'C'],
      ['Moderate — I can commit to regular sessions', 'C'],
      ['Limited — things are too full right now', 'N'],
      ['Uncertain — depends on what comes next', 'N'],
    ],
  },
  {
    q: 'Have you worked with a coach or mentor before?',
    opts: [
      ['Yes, with a coach — and it was useful', 'C'],
      ['Yes, with a mentor — and that was more helpful', 'M'],
      ['Yes, but it did not deliver what I expected', 'N'],
      ['No, this would be my first time', 'C'],
    ],
  },
  {
    q: 'What concerns you most about starting?',
    opts: [
      ['Whether the process will be honest and not just supportive', 'C'],
      ['Whether the person will understand my specific context', 'M'],
      ['Whether I will have the time to commit properly', 'N'],
      ['Whether I actually need this right now', 'N'],
    ],
  },
]

const results = {
  C: {
    badge: 'Coaching is the right fit',
    badgeBg: '#E1F5EE',
    badgeColor: '#085041',
    cardBg: '#F0FAF6',
    cardBorder: '#1D9E75',
    headline: 'You are ready for executive coaching.',
    body: 'You have a clear sense of what you want to change, you are open to honest feedback, and your situation is stable enough to support sustained development work. Coaching works best when these three conditions are true — and for you, they are.',
    detail: 'An executive coaching engagement with PGS starts with a 360-degree feedback process and a strengths assessment. From there, you co-create two to three development goals and work through them over six to eight months. Outcomes are tracked and verified with your stakeholders.',
    cta: 'Book a 30-minute discovery call',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Read how it works',
    secondaryHref: '/work/executive-coaching/approach',
  },
  M: {
    badge: 'Mentoring may suit you better',
    badgeBg: '#FAEEDA',
    badgeColor: '#633806',
    cardBg: '#FDF6EE',
    cardBorder: '#633806',
    headline: 'You may need a guide, not a coach.',
    body: 'You are looking for perspective and direction from someone who has walked a similar path. That is mentoring, not coaching. A coach helps you find your own answers. A mentor shares theirs. Both are valuable — the right one depends on what you need.',
    detail: 'PGS works with a small number of clients in a mentoring capacity, particularly around leadership transitions, business decisions, and organisational challenges. A discovery call is still worth having.',
    cta: 'Book a call to explore what fits',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Back to Executive Coaching',
    secondaryHref: '/work/executive-coaching',
  },
  T: {
    badge: 'Structured learning first',
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
    cardBg: '#F5F4F2',
    cardBorder: '#B4B2A9',
    headline: 'A program may serve you better right now.',
    body: 'Your primary gap appears to be knowledge or skill-based rather than behavioural. Coaching works best when the behavioural challenge is clear. Consider a structured program first, and revisit coaching when the gap is more defined.',
    detail: 'PGS runs structured programs through Embiggen Academy. These may be a better starting point for where you are right now.',
    cta: 'Explore the Academy',
    ctaHref: '/academy',
    secondary: 'Still want to talk it through?',
    secondaryHref: 'https://cal.id/pgs',
  },
  N: {
    badge: 'Timing may not be right yet',
    badgeBg: '#F1EFE8',
    badgeColor: '#444441',
    cardBg: '#F5F4F2',
    cardBorder: '#B4B2A9',
    headline: 'Come back when things settle.',
    body: 'Something in your responses suggests you are either not yet clear on what you need, or under too much pressure to invest meaningfully in a coaching engagement right now. Coaching requires enough stability to reflect, commit, and act between sessions.',
    detail: 'This is not a closed door. A single conversation with PGS to think through what you actually need costs nothing.',
    cta: 'Book a no-agenda 30-minute call',
    ctaHref: 'https://cal.id/pgs',
    secondary: 'Back to Executive Coaching',
    secondaryHref: '/work/executive-coaching',
  },
}

type Bucket = 'C' | 'M' | 'T' | 'N'
type Stage = 'gate' | 'questions' | 'result'

const SHEET_URL = process.env.NEXT_PUBLIC_COACHING_ASSESSMENT_SHEET_URL || ''

export default function AssessmentPage() {
  const [stage, setStage] = useState<Stage>('gate')
  const [gate, setGate] = useState({ name: '', email: '', org: '', role: '' })
  const [gateError, setGateError] = useState('')
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [result, setResult] = useState<Bucket | null>(null)
  const [selected, setSelected] = useState<number | null>(null)

  const progress = Math.round((current / questions.length) * 100)

  function handleGate(e: React.FormEvent) {
    e.preventDefault()
    if (!gate.name.trim() || !gate.email.trim()) {
      setGateError('Name and email are required.')
      return
    }
    setGateError('')
    setStage('questions')
  }

  function handleSelect(optIndex: number) {
    setSelected(optIndex)
    const updated = { ...answers, [current]: optIndex }
    setTimeout(() => {
      setAnswers(updated)
      setSelected(null)
      if (current < questions.length - 1) {
        setCurrent(current + 1)
      } else {
        const outcome = calcResult(updated)
        setResult(outcome)
        setStage('result')
        submitToSheet(updated, outcome)
      }
    }, 300)
  }

  function calcResult(ans: Record<number, number>): Bucket {
    const counts: Record<Bucket, number> = { C: 0, M: 0, T: 0, N: 0 }
    Object.keys(ans).forEach((k) => {
      const bucket = questions[Number(k)].opts[ans[Number(k)]][1] as Bucket
      counts[bucket]++
    })
    if (counts.N >= 4) return 'N'
    const sorted = (Object.entries(counts) as [Bucket, number][]).sort((a, b) => b[1] - a[1])
    if (sorted[0][1] === sorted[1][1] && (sorted[0][0] === 'C' || sorted[1][0] === 'C')) return 'C'
    return sorted[0][0]
  }

  async function submitToSheet(ans: Record<number, number>, outcome: Bucket) {
    try {
      const payload = {
        timestamp: new Date().toISOString(),
        name: gate.name,
        email: gate.email,
        organisation: gate.org,
        role: gate.role,
        outcome,
        ...Object.fromEntries(
          questions.map((q, i) => [`q${i + 1}`, ans[i] !== undefined ? q.opts[ans[i]][0] : ''])
        ),
      }
      if (SHEET_URL) {
        await fetch(SHEET_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
    } catch {
      // silent fail
    }
  }

  const res = result ? results[result] : null

  const s: Record<string, React.CSSProperties> = {
    page: { background: '#FAF8F5', minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: '#2C2C2A' },
    breadcrumb: { padding: '1rem 2rem', fontSize: '0.85rem', color: '#5F5E5A', borderBottom: '1px solid #E8E4DC' },
    wrap: { maxWidth: '600px', margin: '0 auto', padding: '3rem 2rem 5rem' },
    eyebrow: { fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase' as const, color: '#1D9E75', marginBottom: '0.85rem' },
    h1: { fontFamily: 'Lora, serif', fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 700, lineHeight: 1.3, color: '#2C2C2A', marginBottom: '0.85rem' },
    h2: { fontFamily: 'Lora, serif', fontSize: 'clamp(1.15rem, 2.5vw, 1.4rem)', fontWeight: 700, lineHeight: 1.35, color: '#2C2C2A', marginBottom: '1.5rem' },
    p: { fontSize: '0.95rem', lineHeight: 1.75, color: '#5F5E5A' },
    label: { display: 'block' as const, fontSize: '0.82rem', fontWeight: 600, color: '#2C2C2A', marginBottom: '0.35rem' },
    input: { width: '100%', padding: '0.65rem 0.9rem', fontSize: '0.9rem', border: '1.5px solid #E8E4DC', borderRadius: '6px', background: '#fff', color: '#2C2C2A', outline: 'none', boxSizing: 'border-box' as const },
    field: { marginBottom: '1rem' },
    btnPrimary: { background: '#633806', color: '#fff', width: '100%', padding: '0.8rem', border: 'none', borderRadius: '6px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.5rem', fontFamily: 'Inter, sans-serif' },
    btnOutline: { width: '100%', padding: '0.75rem', border: '1.5px solid #633806', background: 'none', color: '#633806', borderRadius: '6px', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer', marginTop: '0.65rem', fontFamily: 'Inter, sans-serif' },
    note: { fontSize: '0.78rem', color: '#5F5E5A', textAlign: 'center' as const, marginTop: '0.85rem' },
    progressTrack: { height: '3px', background: '#E8E4DC', borderRadius: '2px', marginBottom: '2rem' },
    backBtn: { background: 'none', border: 'none', color: '#5F5E5A', fontSize: '0.82rem', cursor: 'pointer', padding: 0, marginTop: '1.25rem', display: 'block' },
  }

  return (
    <main style={s.page}>
      <div style={s.breadcrumb}>
        <Link href="/work" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Work</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/work/executive-coaching" style={{ color: '#5F5E5A', textDecoration: 'none' }}>Executive Coaching</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span>Assessment</span>
      </div>

      <div style={s.wrap}>

        {/* GATE */}
        {stage === 'gate' && (
          <>
            <p style={s.eyebrow}>Coaching Need Assessment</p>
            <h1 style={s.h1}>Coaching, mentoring,<br />or something else?</h1>
            <p style={{ ...s.p, marginBottom: '1.75rem' }}>
              Ten questions. About five minutes. You will get a clear recommendation at the end. Your responses are saved so PGS can follow up if helpful.
            </p>
            <form onSubmit={handleGate}>
              <div style={s.field}>
                <label style={s.label}>Name <span style={{ color: '#633806' }}>*</span></label>
                <input style={s.input} type="text" placeholder="Your full name" value={gate.name} onChange={e => setGate({ ...gate, name: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Email <span style={{ color: '#633806' }}>*</span></label>
                <input style={s.input} type="email" placeholder="your@email.com" value={gate.email} onChange={e => setGate({ ...gate, email: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={{ ...s.label, color: '#888', fontWeight: 400 }}>Organisation <span style={{ fontSize: '0.78rem' }}>(optional)</span></label>
                <input style={s.input} type="text" placeholder="Where you work" value={gate.org} onChange={e => setGate({ ...gate, org: e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={{ ...s.label, color: '#888', fontWeight: 400 }}>Role or designation <span style={{ fontSize: '0.78rem' }}>(optional)</span></label>
                <input style={s.input} type="text" placeholder="Your current title" value={gate.role} onChange={e => setGate({ ...gate, role: e.target.value })} />
              </div>
              {gateError && <p style={{ color: '#c0392b', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{gateError}</p>}
              <button type="submit" style={s.btnPrimary}>Start the Assessment</button>
              <p style={s.note}>Your information is shared only with PGS and is not used for any other purpose.</p>
            </form>
          </>
        )}

        {/* QUESTIONS */}
        {stage === 'questions' && (
          <>
            {/* Dot indicators */}
            <div style={{ display: 'flex', gap: '5px', marginBottom: '1.5rem' }}>
              {questions.map((_, i) => (
                <div key={i} style={{
                  width: '8px', height: '8px', borderRadius: '50%',
                  background: i < current ? '#1D9E75' : i === current ? '#633806' : '#E8E4DC',
                  transition: 'background 0.2s',
                }} />
              ))}
            </div>

            {/* Progress bar */}
            <div style={s.progressTrack}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#1D9E75', borderRadius: '2px', transition: 'width 0.3s' }} />
            </div>

            <p style={{ fontSize: '0.78rem', color: '#5F5E5A', marginBottom: '0.6rem' }}>
              Question {current + 1} of {questions.length}
            </p>

            <h2 style={s.h2}>{questions[current].q}</h2>

            <div>
              {questions[current].opts.map((opt, i) => {
                const isSelected = selected === i || answers[current] === i
                return (
                  <div
                    key={i}
                    onClick={() => handleSelect(i)}
                    style={{
                      background: isSelected ? '#F0FAF6' : '#fff',
                      border: `1.5px solid ${isSelected ? '#1D9E75' : '#E8E4DC'}`,
                      borderRadius: '10px',
                      padding: '1rem 1.1rem',
                      fontSize: '0.9rem',
                      color: '#2C2C2A',
                      cursor: 'pointer',
                      marginBottom: '0.65rem',
                      lineHeight: 1.6,
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.75rem',
                      transition: 'border-color 0.15s, background 0.15s',
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%',
                      border: `2px solid ${isSelected ? '#1D9E75' : '#E8E4DC'}`,
                      flexShrink: 0, marginTop: '2px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'border-color 0.15s',
                    }}>
                      {isSelected && (
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#1D9E75' }} />
                      )}
                    </div>
                    <span>{opt[0]}</span>
                  </div>
                )
              })}
            </div>

            <button
              style={s.backBtn}
              onClick={() => {
                if (current > 0) setCurrent(current - 1)
                else setStage('gate')
              }}
            >
              ← Back
            </button>
          </>
        )}

        {/* RESULT */}
        {stage === 'result' && res && (
          <>
            <p style={s.eyebrow}>Your Result</p>

            <span style={{
              display: 'inline-block',
              background: res.badgeBg, color: res.badgeColor,
              padding: '0.35rem 1rem', borderRadius: '20px',
              fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', marginBottom: '1.25rem',
            }}>
              {res.badge}
            </span>

            <h1 style={{ ...s.h1, marginBottom: '1.25rem' }}>{res.headline}</h1>

            <div style={{
              background: res.cardBg,
              border: `1.5px solid ${res.cardBorder}`,
              borderRadius: '12px', padding: '1.75rem', marginBottom: '1.5rem',
            }}>
              <p style={{ ...s.p, marginBottom: '1rem' }}>{res.body}</p>
              <p style={s.p}>{res.detail}</p>
            </div>

            <Link
              href={res.ctaHref}
              target={res.ctaHref.startsWith('http') ? '_blank' : undefined}
              style={{ ...s.btnPrimary, display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              {res.cta}
            </Link>

            <Link
              href={res.secondaryHref}
              target={res.secondaryHref.startsWith('http') ? '_blank' : undefined}
              style={{ ...s.btnOutline, display: 'block', textAlign: 'center', textDecoration: 'none' }}
            >
              {res.secondary}
            </Link>

            <p style={s.note}>
              Your responses have been saved. PGS may reach out if there is something worth discussing.
            </p>
          </>
        )}

      </div>
    </main>
  )
}
