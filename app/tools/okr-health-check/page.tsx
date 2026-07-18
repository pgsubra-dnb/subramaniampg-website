'use client'

import { useEffect, useRef, useState } from 'react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

// ── Types ──────────────────────────────────────────────────────────────────────

type Stage = 'gate' | 'questions' | 'result'

interface UserData {
  name: string
  email: string
  company: string
  phone: string
}

type Category = 'Objective Clarity' | 'Key Result Quality' | 'Review Cadence' | 'Alignment and Ownership'

interface Question {
  id: number
  category: Category
  text: string
  options: { text: string; score: number }[]
}

// ── Questions ──────────────────────────────────────────────────────────────────

const QUESTIONS: Question[] = [
  {
    id: 1,
    category: 'Objective Clarity',
    text: 'Do your teams have written Objectives for this quarter',
    options: [
      { text: 'No, nothing written', score: 1 },
      { text: 'Somewhere, but not shared widely', score: 2 },
      { text: 'Yes, shared but not referred to often', score: 3 },
      { text: 'Yes, and teams refer to them regularly', score: 4 },
    ],
  },
  {
    id: 2,
    category: 'Objective Clarity',
    text: 'Are your Objectives inspiring and directional, not just task lists',
    options: [
      { text: 'They read like a to-do list', score: 1 },
      { text: 'Mostly tasks, some direction', score: 2 },
      { text: 'Mostly directional, some tasks', score: 3 },
      { text: 'Clearly directional and motivating', score: 4 },
    ],
  },
  {
    id: 3,
    category: 'Key Result Quality',
    text: 'Are your Key Results measurable numbers, not activities',
    options: [
      { text: 'Mostly activities, not numbers', score: 1 },
      { text: 'Some numbers, mostly activities', score: 2 },
      { text: 'Mostly numbers, a few activities', score: 3 },
      { text: 'All Key Results are measurable numbers', score: 4 },
    ],
  },
  {
    id: 4,
    category: 'Key Result Quality',
    text: 'Do you set Key Results before knowing exactly how to achieve them',
    options: [
      { text: 'No, we only set what we already know how to do', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes', score: 3 },
      { text: 'Yes, this is normal for us', score: 4 },
    ],
  },
  {
    id: 5,
    category: 'Review Cadence',
    text: 'How often do you review OKR progress',
    options: [
      { text: 'Never, or only at quarter end', score: 1 },
      { text: 'Once a quarter', score: 2 },
      { text: 'Once a month', score: 3 },
      { text: 'Every week or two', score: 4 },
    ],
  },
  {
    id: 6,
    category: 'Review Cadence',
    text: 'When progress stalls, does anything change',
    options: [
      { text: 'No, we just note it and move on', score: 1 },
      { text: 'Rarely', score: 2 },
      { text: 'Sometimes we adjust', score: 3 },
      { text: 'Yes, we actively problem solve', score: 4 },
    ],
  },
  {
    id: 7,
    category: 'Alignment and Ownership',
    text: 'Do team members know how their OKRs connect to company goals',
    options: [
      { text: 'No idea', score: 1 },
      { text: 'Vague sense', score: 2 },
      { text: 'Mostly clear', score: 3 },
      { text: 'Completely clear', score: 4 },
    ],
  },
  {
    id: 8,
    category: 'Alignment and Ownership',
    text: 'Do most OKRs get completed, or mostly abandoned',
    options: [
      { text: 'Mostly abandoned', score: 1 },
      { text: 'Less than half completed', score: 2 },
      { text: 'Most completed', score: 3 },
      { text: 'Nearly all completed', score: 4 },
    ],
  },
]

const CATEGORIES: Category[] = ['Objective Clarity', 'Key Result Quality', 'Review Cadence', 'Alignment and Ownership']

const LABEL_LINES: Record<Category, string[]> = {
  'Objective Clarity': ['Objective Clarity'],
  'Key Result Quality': ['Key Result', 'Quality'],
  'Review Cadence': ['Review Cadence'],
  'Alignment and Ownership': ['Alignment and', 'Ownership'],
}

// ── Levels ─────────────────────────────────────────────────────────────────────

type LevelKey = 'OKR Mirage' | 'OKR Patchwork' | 'OKR Routine' | 'OKR Discipline' | 'OKR Flywheel'

const LEVELS: { key: LevelKey; min: number; description: string }[] = [
  { key: 'OKR Mirage', min: 1.00, description: 'Your OKRs look real from a distance, but there is little behind them yet.' },
  { key: 'OKR Patchwork', min: 1.75, description: 'Parts of your system work well. Other parts are inconsistent or ignored.' },
  { key: 'OKR Routine', min: 2.50, description: 'A cadence exists. The habit is there. The impact is still uneven.' },
  { key: 'OKR Discipline', min: 3.25, description: 'A reliable system. OKRs are actively shaping how your teams work.' },
  { key: 'OKR Flywheel', min: 3.75, description: 'Self-reinforcing. OKRs are compounding results quarter on quarter.' },
]

function levelFromScore(score: number): { key: LevelKey; description: string } {
  const match = [...LEVELS].reverse().find(l => score >= l.min) ?? LEVELS[0]
  return match
}

function computeCategoryScores(answers: Record<number, number>): Record<Category, number> {
  const scores = {} as Record<Category, number>
  for (const category of CATEGORIES) {
    const qs = QUESTIONS.filter(q => q.category === category)
    const sum = qs.reduce((s, q) => s + (answers[q.id] ?? 0), 0)
    scores[category] = sum / qs.length
  }
  return scores
}

// ── Radar chart ────────────────────────────────────────────────────────────────

function RadarChart({ categories }: { categories: Record<Category, number> }) {
  const size = 280
  const center = size / 2
  const maxRadius = 100
  const minRadius = 16 // score of 1 still shows a visible shape, not a dot
  const labelRadius = maxRadius + 16
  const labelMargin = 8 // breathing room between label text and the SVG edge

  const angleFor = (i: number) => (Math.PI * 2 * i) / CATEGORIES.length - Math.PI / 2

  const pointFor = (i: number, score: number) => {
    const r = minRadius + ((score - 1) / 3) * (maxRadius - minRadius)
    const angle = angleFor(i)
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const dataPoints = CATEGORIES.map((c, i) => pointFor(i, categories[c]))
  const dataPath = dataPoints.map(p => `${p.x},${p.y}`).join(' ')

  const rings = [1, 2, 3, 4]
  const lineHeight = 13

  // Horizontal padding starts generous, then grows to fit the browser's own
  // rendered label widths (via getBBox) so wrapping never clips regardless
  // of device font metrics or fallback-font timing on first paint.
  const [horizontalPadding, setHorizontalPadding] = useState(95)
  const textRefs = useRef<Partial<Record<Category, SVGTextElement | null>>>({})

  useEffect(() => {
    const measure = () => {
      let maxLeftWidth = 0
      let maxRightWidth = 0
      CATEGORIES.forEach((c, i) => {
        const el = textRefs.current[c]
        if (!el) return
        const cos = Math.cos(angleFor(i))
        const width = el.getBBox().width
        if (cos > 0.3) maxRightWidth = Math.max(maxRightWidth, width)
        else if (cos < -0.3) maxLeftWidth = Math.max(maxLeftWidth, width)
      })
      const rightLabelX = center + labelRadius
      const leftLabelX = center - labelRadius
      const neededRight = (rightLabelX + maxRightWidth + labelMargin) - size
      const neededLeft = -(leftLabelX - maxLeftWidth - labelMargin)
      const needed = Math.ceil(Math.max(neededRight, neededLeft))
      if (needed > 0) setHorizontalPadding(p => Math.max(p, needed))
    }
    if (typeof document !== 'undefined' && document.fonts?.ready) {
      document.fonts.ready.then(measure)
    } else {
      measure()
    }
  }, [categories])

  const viewBoxWidth = size + horizontalPadding * 2

  return (
    <svg
      viewBox={`${-horizontalPadding} 0 ${viewBoxWidth} ${size}`}
      className="w-full max-w-md mx-auto"
      style={{ background: 'transparent' }}
    >
      {rings.map(ring => {
        const pts = CATEGORIES.map((_, i) => pointFor(i, ring))
        return (
          <polygon
            key={ring}
            points={pts.map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="#E8E4DC"
            strokeWidth={1}
          />
        )
      })}

      {CATEGORIES.map((c, i) => {
        const outer = pointFor(i, 4)
        return (
          <line
            key={c}
            x1={center}
            y1={center}
            x2={outer.x}
            y2={outer.y}
            stroke="#E8E4DC"
            strokeWidth={1}
          />
        )
      })}

      <polygon points={dataPath} fill="#1D9E75" fillOpacity={0.25} stroke="#1D9E75" strokeWidth={2} />

      {CATEGORIES.map((c, i) => {
        const angle = angleFor(i)
        const labelPoint = { x: center + labelRadius * Math.cos(angle), y: center + labelRadius * Math.sin(angle) }
        const anchor = Math.abs(Math.cos(angle)) < 0.3 ? 'middle' : Math.cos(angle) > 0 ? 'start' : 'end'
        const lines = LABEL_LINES[c]
        const firstLineY = labelPoint.y - ((lines.length - 1) * lineHeight) / 2
        return (
          <text
            key={c}
            ref={el => { textRefs.current[c] = el }}
            textAnchor={anchor}
            fontSize={11}
            fontWeight={600}
            fill="#888780"
          >
            {lines.map((line, li) => (
              <tspan key={li} x={labelPoint.x} y={firstLineY + li * lineHeight} dominantBaseline="middle">
                {line}
              </tspan>
            ))}
          </text>
        )
      })}
    </svg>
  )
}

// ── Shared input styles ────────────────────────────────────────────────────────

const inputBase =
  'w-full px-4 py-3 rounded-lg text-sm text-[#2C2C2A] bg-white outline-none transition-colors placeholder:text-[#C4B49E]'
const inputStyle = { border: '1px solid #E8E4DC' }

function onFocus(e: React.FocusEvent<HTMLInputElement>) { e.currentTarget.style.borderColor = '#633806' }
function onBlur(e: React.FocusEvent<HTMLInputElement>)  { e.currentTarget.style.borderColor = '#E8E4DC' }

// ── Stage 1 — Contact gate ─────────────────────────────────────────────────────

function GateForm({ onSubmit }: { onSubmit: (d: UserData) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [phone, setPhone] = useState('')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 lg:py-24">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <p className="section-label mb-4">FREE OKR HEALTH CHECK</p>
            <h1 className="font-lora text-3xl sm:text-4xl font-bold text-[#2C2C2A] leading-tight mb-4">
              How Healthy Are Your OKRs, Really
            </h1>
            <p className="text-[#5F5E5A] leading-relaxed mb-4">
              Answer 8 quick questions. Get your OKR Health Check in under two minutes.
            </p>
            <p className="text-sm text-[#888780] leading-relaxed">
              Most OKR systems fail quietly. Teams write Objectives, set Key Results, then drift back to
              old habits within a quarter. This check shows you exactly where your system is strong and
              where it is breaking down.
            </p>
          </div>

          <form
            onSubmit={e => { e.preventDefault(); onSubmit({ name, email, company, phone }) }}
            className="space-y-4 bg-white rounded-2xl p-8 border"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-2">
                Name <span className="text-[#633806]">*</span>
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                className={inputBase}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-2">
                Email <span className="text-[#633806]">*</span>
              </label>
              <input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                className={inputBase}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-2">
                Company
                <span className="ml-1.5 normal-case font-normal text-[#888780] tracking-normal">optional</span>
              </label>
              <input
                type="text"
                placeholder="Your company name"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className={inputBase}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-2">
                Phone
                <span className="ml-1.5 normal-case font-normal text-[#888780] tracking-normal">optional</span>
              </label>
              <input
                type="tel"
                placeholder="Your phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className={inputBase}
                style={inputStyle}
                onFocus={onFocus}
                onBlur={onBlur}
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 rounded-lg text-white text-sm font-semibold transition-colors mt-2"
              style={{ backgroundColor: '#633806' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7a4408')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#633806')}
            >
              Start the Health Check
            </button>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Stage 2 — Questions ────────────────────────────────────────────────────────

function QuestionsStage({ onComplete }: { onComplete: (answers: Record<number, number>) => void }) {
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const answered = Object.keys(answers).length
  const allDone = answered === QUESTIONS.length

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="mb-10">
          <p className="section-label mb-2">OKR HEALTH CHECK</p>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-[#2C2C2A] mb-4">
            Answer honestly — there are no right or wrong responses.
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-[#E8E4DC] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${(answered / QUESTIONS.length) * 100}%`, backgroundColor: '#1D9E75' }}
              />
            </div>
            <span className="text-xs font-semibold text-[#5F5E5A] shrink-0">
              {answered} / {QUESTIONS.length}
            </span>
          </div>
        </div>

        <div className="space-y-8">
          {QUESTIONS.map((q, qi) => {
            const selected = answers[q.id]
            return (
              <div
                key={q.id}
                className="bg-white rounded-2xl border p-6 sm:p-8"
                style={{ borderColor: selected ? '#1D9E75' : '#E8E4DC', transition: 'border-color 0.2s' }}
              >
                <p className="text-xs font-semibold text-[#1D9E75] uppercase tracking-widest mb-3">
                  Question {qi + 1}
                </p>
                <h2 className="font-lora text-lg sm:text-xl font-semibold text-[#2C2C2A] mb-5 leading-snug">
                  {q.text}
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  {q.options.map(opt => {
                    const isSelected = selected === opt.score
                    return (
                      <button
                        key={opt.score}
                        onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                        className="text-left w-full p-4 rounded-xl text-sm leading-snug transition-all duration-150"
                        style={{
                          border: `2px solid ${isSelected ? '#1D9E75' : '#E8E4DC'}`,
                          backgroundColor: isSelected ? '#E1F5EE' : '#ffffff',
                          color: isSelected ? '#0D6E4E' : '#2C2C2A',
                          fontWeight: isSelected ? 600 : 400,
                        }}
                      >
                        {opt.text}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="mt-10 text-center">
          {!allDone && (
            <p className="text-sm text-[#888780] mb-4">
              {QUESTIONS.length - answered} question{QUESTIONS.length - answered !== 1 ? 's' : ''} remaining
            </p>
          )}
          <button
            onClick={() => onComplete(answers)}
            disabled={!allDone}
            className="px-10 py-4 rounded-lg text-white text-sm font-semibold transition-all"
            style={{
              backgroundColor: allDone ? '#633806' : '#C4B49E',
              cursor: allDone ? 'pointer' : 'not-allowed',
            }}
          >
            {allDone ? 'See My Result →' : `Answer all ${QUESTIONS.length} questions to continue`}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Stage 3 — Result ───────────────────────────────────────────────────────────

function ResultStage({ categoryScores }: { categoryScores: Record<Category, number> }) {
  const overall = CATEGORIES.reduce((s, c) => s + categoryScores[c], 0) / CATEGORIES.length
  const level = levelFromScore(overall)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <main className="max-w-xl mx-auto px-4 sm:px-6 py-16 lg:py-24 text-center">
        <p className="section-label mb-4">YOUR RESULT</p>
        <p className="text-[#5F5E5A] text-sm mb-2">Your OKR system is</p>
        <h1 className="font-lora text-3xl sm:text-4xl font-bold text-[#2C2C2A] mb-4">
          {level.key}
        </h1>
        <p className="text-[#5F5E5A] leading-relaxed mb-10 max-w-md mx-auto">
          {level.description}
        </p>

        <div className="mb-10">
          <RadarChart categories={categoryScores} />
        </div>

        <p className="text-[#5F5E5A] leading-relaxed mb-8">
          Your full report is on its way to your email. Or, book time directly below.
        </p>

        <a
          href="https://cal.id/pgs"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg text-white text-sm font-semibold transition-colors"
          style={{ backgroundColor: '#633806' }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7a4408')}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#633806')}
        >
          Book a Call
        </a>
      </main>

      <Footer />
    </div>
  )
}

// ── Main page orchestrator ─────────────────────────────────────────────────────

export default function OKRHealthCheckPage() {
  const [stage, setStage] = useState<Stage>('gate')
  const [userData, setUserData] = useState<UserData>({ name: '', email: '', company: '', phone: '' })
  const [categoryScores, setCategoryScores] = useState<Record<Category, number>>({
    'Objective Clarity': 1,
    'Key Result Quality': 1,
    'Review Cadence': 1,
    'Alignment and Ownership': 1,
  })

  const handleGateSubmit = (data: UserData) => {
    setUserData(data)
    setStage('questions')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleQuestionsComplete = (answers: Record<number, number>) => {
    const categories = computeCategoryScores(answers)
    const overall = CATEGORIES.reduce((s, c) => s + categories[c], 0) / CATEGORIES.length
    setCategoryScores(categories)

    fetch('/api/okr-health-check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: userData.name,
        email: userData.email,
        company: userData.company,
        phone: userData.phone,
        score: overall,
        categories,
      }),
    }).catch(err => console.error('[OKR Health Check] submit failed:', err))

    setStage('result')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (stage === 'gate')
    return <GateForm onSubmit={handleGateSubmit} />

  if (stage === 'questions')
    return <QuestionsStage onComplete={handleQuestionsComplete} />

  return <ResultStage categoryScores={categoryScores} />
}
