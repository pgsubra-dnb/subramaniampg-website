'use client'

import { useState } from 'react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

// ── Types ──────────────────────────────────────────────────────────────────────

type Stage = 'gate' | 'questions' | 'report'
type Level = 1 | 2 | 3 | 4 | 5

interface UserData {
  name: string
  email: string
  organisation: string
}

// ── Questions ──────────────────────────────────────────────────────────────────

const QUESTIONS = [
  {
    id: 1,
    text: 'Who makes the key decisions in your organisation?',
    options: [
      { text: 'I make almost all decisions myself', score: 1 },
      { text: 'My team tries but I usually make the final call', score: 2 },
      { text: 'My leadership team decides most things on their own', score: 3 },
      { text: 'Decisions are made at the right level without needing me', score: 4 },
    ],
  },
  {
    id: 2,
    text: 'When priorities change, how does your team react?',
    options: [
      { text: 'Everyone shifts to what I am focused on immediately', score: 1 },
      { text: 'Teams hear different things and respond slowly', score: 2 },
      { text: 'We discuss it as a leadership team before cascading down', score: 3 },
      { text: 'We have a clear process for communicating priority changes', score: 4 },
    ],
  },
  {
    id: 3,
    text: 'When something does not get done, what happens?',
    options: [
      { text: 'It comes back to me — I am the one following up', score: 1 },
      { text: 'There is debate about who was responsible but no clear owner', score: 2 },
      { text: 'Ownership is mostly clear but follow-up is inconsistent', score: 3 },
      { text: 'Ownership is clear, reviews happen, and gaps are caught early', score: 4 },
    ],
  },
  {
    id: 4,
    text: 'Do your leaders agree on the top three company priorities?',
    options: [
      { text: 'I am not sure they would name the same three', score: 1 },
      { text: 'Each leader focuses on their own function, not company priorities', score: 2 },
      { text: 'We have aligned but revisit frequently as things shift', score: 3 },
      { text: 'Priorities are stable and owned collectively by the leadership team', score: 4 },
    ],
  },
  {
    id: 5,
    text: 'How freely does information move across your organisation?',
    options: [
      { text: 'Most critical information flows through me', score: 1 },
      { text: 'Teams keep information within their own department', score: 2 },
      { text: 'Some shared visibility exists but gaps remain', score: 3 },
      { text: 'Information is open and accessible across the leadership team', score: 4 },
    ],
  },
  {
    id: 6,
    text: 'How regularly does your team review progress?',
    options: [
      { text: 'We review things only during a crisis or at a milestone', score: 1 },
      { text: 'Some teams have reviews but there is no company-wide rhythm', score: 2 },
      { text: 'We have a quarterly rhythm but it is not always consistent', score: 3 },
      { text: 'We have a clear weekly, monthly, and quarterly review rhythm', score: 4 },
    ],
  },
  {
    id: 7,
    text: 'How does accountability work when you are not around?',
    options: [
      { text: 'Accountability depends on my pressure — it relaxes when I step back', score: 1 },
      { text: 'Blame is common — ownership is often disputed', score: 2 },
      { text: 'Ownership is improving but some leaders still avoid accountability', score: 3 },
      { text: 'Leaders hold each other accountable without needing me to push', score: 4 },
    ],
  },
  {
    id: 8,
    text: 'How has your experience with OKRs been so far?',
    options: [
      { text: 'We tried them and they did not stick — felt like extra work', score: 1 },
      { text: 'We set them but they stay in a document, not in how we work', score: 2 },
      { text: 'We use them and they help, but not consistently across teams', score: 3 },
      { text: 'OKRs are genuinely how we manage priorities and track progress', score: 4 },
    ],
  },
  {
    id: 9,
    text: 'How do you spend most of your time?',
    options: [
      { text: 'Mostly on day-to-day problems — I am often the one resolving issues', score: 1 },
      { text: 'Mostly operational with some time for strategy', score: 2 },
      { text: 'Roughly split — I am trying to move more toward strategy', score: 3 },
      { text: 'Mostly strategic — my team handles the day-to-day operations', score: 4 },
    ],
  },
  {
    id: 10,
    text: 'If you were away for two weeks with no contact, what would happen?',
    options: [
      { text: 'The company would slow significantly — key decisions would stall', score: 1 },
      { text: 'Some things would move but important decisions would wait for me', score: 2 },
      { text: 'Most things would continue — a few items would need attention on my return', score: 3 },
      { text: 'The company would run well — my team is fully capable and accountable', score: 4 },
    ],
  },
]

// ── Report content ─────────────────────────────────────────────────────────────

const LEVEL_CONFIG: Record<Level, {
  name: string
  bg: string
  text: string
  border: string
  badgeBg: string
}> = {
  1: { name: 'Founder-Dependent Execution', bg: '#633806', text: '#ffffff', border: '#633806', badgeBg: '#FAEEDA' },
  2: { name: 'Functional Silos',            bg: '#8B5016', text: '#ffffff', border: '#8B5016', badgeBg: '#FEF3E2' },
  3: { name: 'Structured Alignment',        bg: '#C17D2A', text: '#ffffff', border: '#C17D2A', badgeBg: '#FFF8ED' },
  4: { name: 'Disciplined Execution',       bg: '#2E9B70', text: '#ffffff', border: '#2E9B70', badgeBg: '#E1F5EE' },
  5: { name: 'Institutionalised Growth',    bg: '#1D9E75', text: '#ffffff', border: '#1D9E75', badgeBg: '#D6F5EB' },
}

const REPORT_CONTENT: Record<Level, {
  whatThisMeans: string
  bottlenecks: string[]
  whereOKRsFit: string
  highestLeverageAction: string
  noteFromPG: string
}> = {
  1: {
    whatThisMeans:
      'Your organisation runs on your personal energy and judgment. Most decisions — big and small — flow through you. When you are present things move. When you step away things slow or stop. This is not a failure. It is the natural consequence of how great companies get started. But it has a ceiling.',
    bottlenecks: [
      'Decision Bottleneck — your team waits for your input before acting',
      'Priority Bottleneck — priorities shift with your attention',
      'Information Bottleneck — critical information flows through you',
      'Accountability Bottleneck — follow-up depends on your pressure',
      'Culture Bottleneck — the organisation reflects your personal style not a shared culture',
    ],
    whereOKRsFit:
      'OKRs introduced at Level 1 almost always fail within the first cycle. Without distributed accountability and leadership independence OKRs become another founder-reviewed checklist. The foundation must be built before the framework is introduced.',
    highestLeverageAction:
      'Identify two or three decisions your leadership team can own fully — without you overriding them. Start with one. Not five. This single shift begins the move from Level 1 to Level 2.',
    noteFromPG:
      'Every leader I have worked with at Level 1 had one thing in common — they built the company by being the system. That strength is also the constraint. The good news is the path forward is clear. I would be happy to talk through what that first step looks like for your specific situation.',
  },
  2: {
    whatThisMeans:
      'Your organisation has grown beyond one person. Teams have formed and leaders have emerged. But each function is optimising for itself rather than for the company as a whole. Cross-functional coordination is painful. Blame is easier than alignment. You are still the only person who sees the complete picture — which means every major decision still lands with you.',
    bottlenecks: [
      'Priority Bottleneck — the company has functional goals not company goals',
      'Information Bottleneck — teams protect data rather than share it',
      'Accountability Bottleneck — ownership is claimed in good times and disclaimed when things go wrong',
      'Culture Bottleneck — safe escalation is rare and people learn to manage upward not solve laterally',
    ],
    whereOKRsFit:
      'OKRs introduced at Level 2 tend to stay siloed. Each team sets their own OKRs and they look aligned on paper but do not connect in practice. The move to shared company-level ownership must happen first before OKRs can work as intended.',
    highestLeverageAction:
      'Convene your leadership team for one focused conversation. Ask: what are our top three company priorities this quarter — not functional priorities but the ones we all own together. If your team cannot answer that consistently you have found the starting point.',
    noteFromPG:
      'Level 2 is where many growing companies live — sometimes for years without realising it. The shift to Level 3 is not about adding more structure. It is about one leadership conversation that changes the nature of ownership. I have guided many leadership teams through exactly this moment.',
  },
  3: {
    whatThisMeans:
      'Something is working in your organisation and you can feel it. Strategic priorities are becoming clearer. The leadership team is beginning to own goals together. Execution is more consistent. But it is still fragile. Scaling pressure is making the remaining gaps visible and the organisation needs more discipline to sustain what has been built.',
    bottlenecks: [
      'Information Bottleneck — visibility is improving but gaps remain across teams',
      'Accountability Bottleneck — ownership is mostly clear but review discipline is inconsistent',
    ],
    whereOKRsFit:
      'Level 3 is where OKRs begin to take hold. The conditions for alignment exist. Introducing OKRs now — with proper facilitation — will accelerate the move to Level 4 by making priorities visible, measurable, and collectively owned across the leadership team.',
    highestLeverageAction:
      'Establish a consistent quarterly review rhythm that the entire leadership team protects. Not a reporting meeting — a genuine conversation about what is working, what is not, and what needs to change. This one discipline separates organisations that sustain Level 3 from those that slide back.',
    noteFromPG:
      'You are at the most exciting stage — where the work of building starts to pay off. The risk here is assuming that because things are working they will continue to work without active maintenance. This is exactly where OKRs can lock in the gains you have made and build the platform for Level 4.',
  },
  4: {
    whatThisMeans:
      'Your organisation executes with discipline. Decisions are made at the right level without needing you. Accountability is real and distributed. The leadership team owns results not just functions. You have moved from being the system to leading the system. This is a significant achievement that very few founder-led organisations reach.',
    bottlenecks: [
      'Culture Bottleneck — the informal norms, habits, and expectations that govern daily behaviour are still forming and need active leadership attention to become truly self-sustaining',
    ],
    whereOKRsFit:
      'OKRs are working as designed at Level 4. The focus now shifts from implementing OKRs to deepening their sophistication — connecting company OKRs more tightly to individual contribution and using OKR reviews as genuine strategic conversations rather than progress reports.',
    highestLeverageAction:
      'Shift your personal attention from execution to the next horizon. What markets, capabilities, or leadership investments will define the next phase of growth? Your organisation can now run without your daily involvement. Use that freedom to think further ahead than you have ever been able to before.',
    noteFromPG:
      'Reaching Level 4 is genuinely rare. Most organisations never get here. The challenge now is not fixing what is broken — it is deciding what to build next. I work with leaders at this stage on strategic clarity, the next growth horizon, and building the culture that will carry the organisation to Level 5.',
  },
  5: {
    whatThisMeans:
      'Your organisation grows independently of any single person including you. Systems scale on their own. Culture is self-reinforcing. Leadership develops from within. You have built something rare — an institution not just a business. The founder is now freed for the long horizon: new markets, new bets, new phases of ambition.',
    bottlenecks: [
      'Culture Bottleneck — at Level 5 the bottleneck is no longer a gap but a frontier. The question is not how to fix culture but how to evolve it as the organisation grows into new complexity and scale',
    ],
    whereOKRsFit:
      'OKRs are embedded as operating practice at Level 5. The next evolution may involve board-level OKR visibility, more sophisticated strategic planning integration, or using OKRs to drive innovation portfolios rather than just operational performance.',
    highestLeverageAction:
      'The Leadership Execution Scale starts again at the next level of complexity. As you enter new markets, build new capabilities, or transition leadership the same five levels will re-emerge in new forms. The question to ask now is: what is the next arena and are we ready for it?',
    noteFromPG:
      'Very few organisations reach Level 5. If your assessment reflects genuine practice rather than aspiration you have built something exceptional. I would enjoy a conversation about where you take it next — the challenges at this level are among the most interesting in leadership.',
  },
}

// ── Scoring ────────────────────────────────────────────────────────────────────

function computeLevel(answers: Record<number, number>): Level {
  const avg = Object.values(answers).reduce((s, v) => s + v, 0) / 10
  if (avg < 1.75) return 1
  if (avg < 2.50) return 2
  if (avg < 3.25) return 3
  if (avg < 3.75) return 4
  return 5
}

// ── Brevo save ─────────────────────────────────────────────────────────────────

async function saveToBrevo(userData: UserData, level: Level, date: string) {
  try {
    await fetch('/api/save-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...userData, level, date }),
    })
  } catch (err) {
    console.error('[Brevo] silent failure:', err)
  }
}

// ── PDF generator ──────────────────────────────────────────────────────────────

async function downloadPDF(userData: UserData, level: Level, date: string) {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PW = 210
  const M  = 20
  const CW = PW - 2 * M
  let y    = 24

  const cfg = LEVEL_CONFIG[level]
  const content = REPORT_CONTENT[level]

  const levelRgb: Record<Level, [number, number, number]> = {
    1: [99, 56, 6],
    2: [139, 80, 22],
    3: [193, 125, 42],
    4: [46, 155, 112],
    5: [29, 158, 117],
  }

  const addFooter = () => {
    const n = doc.getNumberOfPages()
    for (let i = 1; i <= n; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(160, 140, 120)
      doc.text('subramaniampg.guru  |  pgs@embiggen.co.in', M, 290)
      doc.text(`${i} / ${n}`, PW - M, 290, { align: 'right' })
    }
  }

  const guard = (need: number) => {
    if (y + need > 278) { doc.addPage(); y = 20 }
  }

  const body = (text: string, indent = 0) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(95, 94, 90)
    const lines = doc.splitTextToSize(text, CW - indent)
    lines.forEach((line: string) => { guard(6); doc.text(line, M + indent, y); y += 5.5 })
  }

  const heading = (text: string) => {
    guard(18)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(44, 44, 42)
    doc.text(text, M, y)
    y += 8
  }

  // ── Cover ──────────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150, 140, 130)
  doc.text('LEADERSHIP EXECUTION SCALE  -  PERSONAL REPORT', M, y)
  y += 10

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(44, 44, 42)
  doc.text('Your Leadership Execution', M, y); y += 10
  doc.text('Scale Report', M, y); y += 14

  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(95, 94, 90)
  doc.text(userData.name, M, y); y += 6
  if (userData.organisation) { doc.text(userData.organisation, M, y); y += 6 }
  doc.text(date, M, y); y += 14

  // Level badge rectangle
  const rgb = levelRgb[level]
  doc.setFillColor(rgb[0], rgb[1], rgb[2])
  doc.roundedRect(M, y, 100, 18, 3, 3, 'F')
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text(`Level ${level}  -  ${cfg.name}`, M + 5, y + 12)
  doc.setTextColor(44, 44, 42)
  y += 28

  doc.setDrawColor(232, 228, 220)
  doc.line(M, y, PW - M, y)
  y += 12

  // ── Sections ───────────────────────────────────────────────
  heading('What This Means')
  body(content.whatThisMeans)
  y += 8

  heading('Your Active Bottlenecks')
  content.bottlenecks.forEach(b => {
    guard(10)
    body(`  -  ${b}`, 3)
    y += 2
  })
  y += 6

  heading('Where OKRs Fit')
  body(content.whereOKRsFit)
  y += 8

  heading('Your Highest Leverage Action')
  body(content.highestLeverageAction)
  y += 8

  heading('A Note from Subramaniam P G')
  body(content.noteFromPG)
  y += 14

  // ── Booking prompt ─────────────────────────────────────────
  guard(24)
  doc.setFillColor(250, 248, 245)
  doc.roundedRect(M, y, CW, 20, 3, 3, 'F')
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(99, 56, 6)
  doc.text('Book a conversation: cal.id/pgs/short-discussion', M + 5, y + 13)
  y += 26

  addFooter()

  const safeName = userData.name.replace(/[^a-zA-Z0-9]/g, '_')
  const safeDate = date.replace(/\//g, '-')
  doc.save(`LES-Report-${safeName}-${safeDate}.pdf`)
}

// ── Shared input styles ────────────────────────────────────────────────────────

const inputBase =
  'w-full px-4 py-3 rounded-lg text-sm text-[#2C2C2A] bg-white outline-none transition-colors placeholder:text-[#C4B49E]'
const inputStyle = { border: '1px solid #E8E4DC' }

function onFocus(e: React.FocusEvent<HTMLInputElement>) { e.currentTarget.style.borderColor = '#633806' }
function onBlur(e: React.FocusEvent<HTMLInputElement>)  { e.currentTarget.style.borderColor = '#E8E4DC' }

// ── Stage 1 — Email Gate ───────────────────────────────────────────────────────

function GateForm({ onSubmit }: { onSubmit: (d: UserData) => void }) {
  const [name,  setName]  = useState('')
  const [email, setEmail] = useState('')
  const [org,   setOrg]   = useState('')

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <main className="flex-1 flex items-center justify-center px-4 py-16 lg:py-24">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-10">
            <p className="section-label mb-4">FREE ASSESSMENT</p>
            <h1 className="font-lora text-3xl sm:text-4xl font-bold text-[#2C2C2A] leading-tight mb-4">
              The Leadership Execution Scale Assessment
            </h1>
            <p className="text-[#5F5E5A] leading-relaxed">
              10 questions. 5 minutes. Instant personalised report.
            </p>
          </div>

          {/* Trust strip */}
          <div
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-10 px-4 py-4 rounded-xl"
            style={{ backgroundColor: '#FAEEDA' }}
          >
            {['Free & instant', 'No spam — ever', 'Personalised to you'].map(t => (
              <span key={t} className="flex items-center gap-1.5 text-xs font-semibold text-[#633806]">
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                </svg>
                {t}
              </span>
            ))}
          </div>

          {/* Form */}
          <form
            onSubmit={e => { e.preventDefault(); onSubmit({ name, email, organisation: org }) }}
            className="space-y-4 bg-white rounded-2xl p-8 border"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-2">
                Full Name <span className="text-[#633806]">*</span>
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
                Email Address <span className="text-[#633806]">*</span>
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
                Organisation
                <span className="ml-1.5 normal-case font-normal text-[#888780] tracking-normal">optional</span>
              </label>
              <input
                type="text"
                placeholder="Your organisation name"
                value={org}
                onChange={e => setOrg(e.target.value)}
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
              Begin Assessment →
            </button>

            <p className="text-xs text-center text-[#888780] leading-relaxed">
              Your answers are private. We will never share your information.
            </p>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Stage 2 — Questions ────────────────────────────────────────────────────────

function QuestionsStage({
  onComplete,
}: {
  onComplete: (answers: Record<number, number>, level: Level) => void
}) {
  const [answers, setAnswers] = useState<Record<number, number>>({})

  const answered = Object.keys(answers).length
  const allDone  = answered === QUESTIONS.length

  const handleSubmit = () => {
    const level = computeLevel(answers)
    onComplete(answers, level)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">

        {/* Progress header */}
        <div className="mb-10">
          <p className="section-label mb-2">LEADERSHIP EXECUTION SCALE</p>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-[#2C2C2A] mb-4">
            Answer honestly — there are no right or wrong responses.
          </h1>
          {/* Progress bar */}
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

        {/* Questions */}
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

        {/* Submit */}
        <div className="mt-10 text-center">
          {!allDone && (
            <p className="text-sm text-[#888780] mb-4">
              {QUESTIONS.length - answered} question{QUESTIONS.length - answered !== 1 ? 's' : ''} remaining
            </p>
          )}
          <button
            onClick={handleSubmit}
            disabled={!allDone}
            className="px-10 py-4 rounded-lg text-white text-sm font-semibold transition-all"
            style={{
              backgroundColor: allDone ? '#633806' : '#C4B49E',
              cursor: allDone ? 'pointer' : 'not-allowed',
            }}
          >
            {allDone ? 'See My Results →' : `Answer all ${QUESTIONS.length} questions to continue`}
          </button>
        </div>
      </main>

      <Footer />
    </div>
  )
}

// ── Stage 3 — Report ───────────────────────────────────────────────────────────

function ReportSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-white border p-7 sm:p-8" style={{ borderColor: '#E8E4DC' }}>
      <h3 className="font-lora text-lg font-bold text-[#2C2C2A] mb-4">{title}</h3>
      {children}
    </div>
  )
}

function ReportStage({
  userData,
  level,
  answers,
}: {
  userData: UserData
  level: Level
  answers: Record<number, number>
}) {
  const [downloading, setDownloading] = useState(false)
  const cfg     = LEVEL_CONFIG[level]
  const content = REPORT_CONTENT[level]

  const today = new Date().toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const avg = (Object.values(answers).reduce((s, v) => s + v, 0) / 10).toFixed(2)

  const handleDownload = async () => {
    setDownloading(true)
    try { await downloadPDF(userData, level, today) }
    finally { setDownloading(false) }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 lg:py-16">

        {/* Report header */}
        <div className="mb-10">
          <p className="section-label mb-3">YOUR PERSONAL REPORT</p>
          <h1 className="font-lora text-2xl sm:text-3xl font-bold text-[#2C2C2A] mb-2">
            Your Leadership Execution Scale Report — {userData.name}
          </h1>
          <p className="text-sm text-[#888780]">Assessment completed on {today}</p>
          {userData.organisation && (
            <p className="text-sm text-[#888780] mt-0.5">{userData.organisation}</p>
          )}
        </div>

        {/* Level badge */}
        <div
          className="rounded-2xl p-8 sm:p-10 mb-8 text-white"
          style={{ backgroundColor: cfg.bg }}
        >
          <p className="text-xs font-semibold tracking-widest uppercase text-white/70 mb-3">
            Your Execution Maturity Level
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-lora text-5xl sm:text-6xl font-bold mb-1">{level}</p>
              <p className="font-lora text-xl sm:text-2xl font-semibold opacity-90">{cfg.name}</p>
            </div>
            <div className="text-right">
              <p className="text-4xl font-bold font-lora">{avg}</p>
              <p className="text-sm text-white/70 mt-1">Average score</p>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10">
          <a
            href="https://cal.id/pgs/short-discussion"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-white text-sm font-semibold transition-colors"
            style={{ backgroundColor: '#633806' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#7a4408')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#633806')}
          >
            Book a conversation with Subramaniam P G
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
            </svg>
          </a>
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold border-2 transition-colors"
            style={{
              borderColor: '#633806',
              color: '#633806',
              backgroundColor: 'transparent',
              opacity: downloading ? 0.7 : 1,
            }}
            onMouseEnter={e => { if (!downloading) { (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#FAEEDA' } }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M8.75 2.75a.75.75 0 0 0-1.5 0v5.69L5.03 6.22a.75.75 0 0 0-1.06 1.06l3.5 3.5a.75.75 0 0 0 1.06 0l3.5-3.5a.75.75 0 0 0-1.06-1.06L8.75 8.44V2.75Z" />
              <path d="M3.5 9.75a.75.75 0 0 0-1.5 0v1.5A2.75 2.75 0 0 0 4.75 14h6.5A2.75 2.75 0 0 0 14 11.25v-1.5a.75.75 0 0 0-1.5 0v1.5c0 .69-.56 1.25-1.25 1.25h-6.5c-.69 0-1.25-.56-1.25-1.25v-1.5Z" />
            </svg>
            {downloading ? 'Generating PDF…' : 'Download Your Report'}
          </button>
        </div>

        {/* Divider */}
        <div className="h-px mb-10" style={{ backgroundColor: '#E8E4DC' }} />

        {/* Report sections */}
        <div className="space-y-5">

          <ReportSection title="What This Means">
            <p className="text-[#5F5E5A] leading-relaxed text-sm sm:text-base">
              {content.whatThisMeans}
            </p>
          </ReportSection>

          <ReportSection title="Your Active Bottlenecks">
            <ul className="space-y-3">
              {content.bottlenecks.map((b, i) => {
                const [label, desc] = b.split(' — ')
                return (
                  <li key={i} className="flex items-start gap-3">
                    <span
                      className="shrink-0 mt-0.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: cfg.bg, marginTop: '6px' }}
                    />
                    <span className="text-sm sm:text-base text-[#5F5E5A] leading-relaxed">
                      <strong className="text-[#2C2C2A]">{label}</strong>
                      {desc ? ` — ${desc}` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          </ReportSection>

          <ReportSection title="Where OKRs Fit">
            <p className="text-[#5F5E5A] leading-relaxed text-sm sm:text-base">
              {content.whereOKRsFit}
            </p>
          </ReportSection>

          <ReportSection title="Your Highest Leverage Action">
            <div
              className="rounded-xl p-5 border-l-4 text-sm sm:text-base text-[#2C2C2A] leading-relaxed"
              style={{ backgroundColor: cfg.badgeBg, borderLeftColor: cfg.bg }}
            >
              {content.highestLeverageAction}
            </div>
          </ReportSection>

          <ReportSection title="A Note from Subramaniam P G">
            <div className="flex gap-5">
              <div
                className="shrink-0 w-1 rounded-full"
                style={{ backgroundColor: cfg.bg }}
              />
              <p className="text-[#5F5E5A] leading-relaxed italic text-sm sm:text-base">
                {content.noteFromPG}
              </p>
            </div>
          </ReportSection>

        </div>

        {/* Footer CTA */}
        <div
          className="mt-10 rounded-2xl p-8 text-center"
          style={{ backgroundColor: '#2C2C2A' }}
        >
          <h2 className="font-lora text-xl sm:text-2xl font-bold text-white mb-3">
            Ready to move to the next level?
          </h2>
          <p className="text-white/60 text-sm leading-relaxed mb-6 max-w-md mx-auto">
            Every engagement begins with a conversation. Book 30 minutes and let us
            discuss what the move from Level {level} to Level {Math.min(level + 1, 5) as Level} looks like for your organisation.
          </p>
          <a
            href="https://cal.id/pgs/short-discussion"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white text-white text-sm font-semibold rounded-lg hover:bg-white hover:text-[#2C2C2A] transition-colors"
          >
            Book a conversation
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
            </svg>
          </a>
        </div>

      </main>

      <Footer />
    </div>
  )
}

// ── Main page orchestrator ─────────────────────────────────────────────────────

export default function AssessmentPage() {
  const [stage,    setStage]    = useState<Stage>('gate')
  const [userData, setUserData] = useState<UserData>({ name: '', email: '', organisation: '' })
  const [answers,  setAnswers]  = useState<Record<number, number>>({})
  const [level,    setLevel]    = useState<Level>(1)

  const handleGateSubmit = (data: UserData) => {
    setUserData(data)
    setStage('questions')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleAssessmentComplete = (ans: Record<number, number>, lvl: Level) => {
    setAnswers(ans)
    setLevel(lvl)
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    saveToBrevo(userData, lvl, today)
    fetch('/api/okr-assessment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: userData.name, email: userData.email, level: lvl }),
    })
    setStage('report')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (stage === 'gate')
    return <GateForm onSubmit={handleGateSubmit} />

  if (stage === 'questions')
    return <QuestionsStage onComplete={handleAssessmentComplete} />

  return <ReportStage userData={userData} level={level} answers={answers} />
}
