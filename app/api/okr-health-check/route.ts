import { NextRequest, NextResponse } from 'next/server'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

const BASE = 'https://api.brevo.com/v3'

type LevelKey = 'OKR Mirage' | 'OKR Patchwork' | 'OKR Routine' | 'OKR Discipline' | 'OKR Flywheel'

interface CategoryScores {
  'Objective Clarity': number
  'Key Result Quality': number
  'Review Cadence': number
  'Alignment and Ownership': number
}

const CATEGORY_ORDER: (keyof CategoryScores)[] = [
  'Objective Clarity',
  'Key Result Quality',
  'Review Cadence',
  'Alignment and Ownership',
]

const LEVEL_CONTENT: Record<LevelKey, {
  description: string
  whatThisMeans: string
  highestLeverageAction: string
}> = {
  'OKR Mirage': {
    description: 'Your OKRs look real from a distance, but there is little behind them yet.',
    whatThisMeans:
      'Objectives and Key Results exist somewhere, but they are not shaping daily decisions. Teams are running on old habits, not on the plan written down. This is common in the first year of using OKRs, and it is fixable.',
    highestLeverageAction:
      'Pick one team. Set 2 Objectives with real, numeric Key Results. Review them every two weeks for one quarter. Prove the system works small before scaling it.',
  },
  'OKR Patchwork': {
    description: 'Parts of your system work well. Other parts are inconsistent or ignored.',
    whatThisMeans:
      'Some teams treat OKRs seriously. Others barely touch them. Reviews happen sometimes, not on a fixed rhythm. The unevenness is the real problem, not any single team.',
    highestLeverageAction:
      'Set one shared review cadence across all teams. Consistency matters more than perfection right now.',
  },
  'OKR Routine': {
    description: 'A cadence exists. The habit is there. The impact is still uneven.',
    whatThisMeans:
      'You review regularly and most teams participate. But OKRs are becoming a checkbox exercise for some, rather than a tool that changes decisions. This is the stage where OKRs can quietly go stale.',
    highestLeverageAction:
      'In your next review, ask each team one question: what did you stop doing because of this OKR. If no one can answer, the reviews are not driving real change yet.',
  },
  'OKR Discipline': {
    description: 'A reliable system. OKRs are actively shaping how your teams work.',
    whatThisMeans:
      'Objectives are directional, Key Results are measurable, and reviews change behaviour. Most organisations do not reach this stage. The risk here is complacency, not collapse.',
    highestLeverageAction:
      'Look at your weakest category and tighten it further. Small refinements now protect the discipline you have built.',
  },
  'OKR Flywheel': {
    description: 'Self-reinforcing. OKRs are compounding results quarter on quarter.',
    whatThisMeans:
      'Your system runs without needing constant push from leadership. Teams set strong OKRs, review honestly, and adjust fast. Very few organisations operate here.',
    highestLeverageAction:
      'Document what makes this work. At this stage, the risk is losing the system when a key person leaves. Write down the playbook.',
  },
}

const CLOSING_NOTE =
  'This is the stage where most OKR systems either take root or quietly fade. I would be glad to walk through your result with you and figure out the fastest way forward. No pitch, just a real conversation about where you stand. Book a short call here: https://cal.id/pgs'

function levelFromScore(score: number): LevelKey {
  if (score < 1.75) return 'OKR Mirage'
  if (score < 2.50) return 'OKR Patchwork'
  if (score < 3.25) return 'OKR Routine'
  if (score < 3.75) return 'OKR Discipline'
  return 'OKR Flywheel'
}

function weakestCategory(categories: CategoryScores): keyof CategoryScores {
  return CATEGORY_ORDER.reduce((weakest, key) =>
    categories[key] < categories[weakest] ? key : weakest
  , CATEGORY_ORDER[0])
}

function buildVisitorReport(name: string, level: LevelKey, categories: CategoryScores): { subject: string; text: string } {
  const content = LEVEL_CONTENT[level]
  const weakest = weakestCategory(categories)

  const text = `Hi ${name},

Your OKR system is ${level}.

${content.description}

What this means for your organisation:

${content.whatThisMeans}

Your biggest gap is in ${weakest}. This is usually the first place to fix, because it affects everything else.

Your highest-leverage next action:

${content.highestLeverageAction}

${CLOSING_NOTE}

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`

  return { subject: 'Your OKR Health Check Report', text }
}

async function sendLeadNotification(data: {
  name: string
  email: string
  company?: string
  phone?: string
  level: LevelKey
  score: number
  categories: CategoryScores
}) {
  const apiKey = process.env.BREVO_API_KEY ?? ''
  const submittedAt = new Date().toLocaleString('en-GB', {
    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  const text = `New OKR Health Check lead.

Name: ${data.name}
Email: ${data.email}
Company: ${data.company || '(not provided)'}
Phone: ${data.phone || '(not provided)'}

Level: ${data.level}
Score: ${data.score.toFixed(2)} / 4.00

Category breakdown:
${CATEGORY_ORDER.map(c => `- ${c}: ${data.categories[c].toFixed(2)}`).join('\n')}

Submitted: ${submittedAt}`

  const res = await fetch(`${BASE}/smtp/email`, {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: 'OKR Health Check', email: 'pgs@embiggen.co.in' },
      to: [{ email: 'pgs@embiggen.co.in', name: 'Subramaniam P G' }],
      subject: `New OKR Health Check Lead — ${data.name}, ${data.level}`,
      htmlContent: text.replace(/\n/g, '<br>'),
      textContent: text,
    }),
  })

  const responseText = await res.text()
  if (!res.ok) {
    console.error('OKR health check lead notification failed:', res.status, responseText)
  }
}

async function ensureAttributes(apiKey: string) {
  const attrs = ['OKR_HEALTH_CHECK_LEVEL', 'OKR_HEALTH_CHECK_SCORE', 'OKR_HEALTH_CHECK_DATE', 'OKR_HEALTH_CHECK_COMPANY']
  await Promise.all(attrs.map(name =>
    fetch(`${BASE}/contacts/attributes/normal/${name}`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text' }),
    }).catch(() => {})
  ))
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json()
    const score = Number(data.score)
    const categories: CategoryScores = data.categories
    if (!Number.isFinite(score) || !categories) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }
    const level = levelFromScore(score)

    const report = buildVisitorReport(data.name, level, categories)
    await sendBrevoEmail({
      to: data.email,
      toName: data.name,
      subject: report.subject,
      htmlContent: report.text.replace(/\n/g, '<br>'),
      textContent: report.text,
    })

    await sendLeadNotification({
      name: data.name,
      email: data.email,
      company: data.company,
      phone: data.phone,
      level,
      score,
      categories,
    })

    const apiKey = process.env.BREVO_API_KEY ?? ''
    await ensureAttributes(apiKey)
    const attributes: Record<string, string> = {
      OKR_HEALTH_CHECK_LEVEL: level,
      OKR_HEALTH_CHECK_SCORE: score.toFixed(2),
      OKR_HEALTH_CHECK_DATE: formatDate(new Date()),
    }
    if (data.company) attributes.OKR_HEALTH_CHECK_COMPANY = data.company

    await fetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, attributes, updateEnabled: true }),
    })

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('OKR health check API error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
