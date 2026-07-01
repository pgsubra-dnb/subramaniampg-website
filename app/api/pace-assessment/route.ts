import { NextRequest, NextResponse } from 'next/server'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

const BASE = 'https://api.brevo.com/v3'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Level 1 — Reactive Organisation',
  2: 'Level 2 — Intuitive Direction',
  3: 'Level 3 — Structured Intent',
  4: 'Level 4 — Aligned Execution',
  5: 'Level 5 — Growth Rhythm',
}

const levelEmails: Record<number, { subject: string; text: (name: string) => string }> = {
  1: {
    subject: 'Your PACE Maturity result — and what it means for your organisation',
    text: (name) => `Hi ${name},

Thank you for completing the PACE Maturity Assessment.

Your result is Level 1 — Reactive Organisation.

What this means:

Your organisation is running on the founder's energy and judgment. Decisions wait for one person. There is no planning horizon beyond next month. The business responds to what arrives, not what it chose. This is a natural stage — and also the stage where the right structural work creates the biggest shift.

How PACE helps at your stage:

At Level 1, the work is foundational. Before any framework or system can be introduced, the first layer of shared direction and independent execution needs to be built. PACE starts here — not with OKRs or quarterly reviews, but with the structural work that makes everything else possible. This means establishing the first documented direction, identifying which decisions should not be coming back to the founder, and beginning to build the accountability structures the team needs to operate independently.

Your next step:

A 30-minute conversation to understand your specific situation and what the most useful first move looks like for your business.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  2: {
    subject: 'Your PACE Maturity result — and what it means for your organisation',
    text: (name) => `Hi ${name},

Thank you for completing the PACE Maturity Assessment.

Your result is Level 2 — Intuitive Direction.

What this means:

The direction exists — in your head. Your team is capable and willing, but they are operating on inference and assumption. When you are in the room, things align. When you are not, they drift. The organisation is not failing — it is dependent.

How PACE helps at your stage:

At Level 2, the work is externalisation. The direction that lives in the founder's head needs to become something the team can operate from independently. PACE at this stage means building the first documented plan, establishing the first accountability structures, and beginning to design a meeting cadence that does not depend on the founder to initiate. The goal is not to remove the founder from strategy — it is to make the strategy survive the founder's absence.

Your next step:

A 30-minute conversation to understand your specific situation and what the most useful first move looks like for your business.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  3: {
    subject: 'Your PACE Maturity result — and what it means for your organisation',
    text: (name) => `Hi ${name},

Thank you for completing the PACE Maturity Assessment.

Your result is Level 3 — Structured Intent.

What this means:

The plan exists. The team knows the goals. But execution breaks down by quarter two. The plan lives in a document. Priorities multiply. Bandwidth becomes the explanation for everything that did not happen. This is one of the most common and most frustrating stages — because the problem is not the planning. It is the absence of a rhythm that keeps the plan alive.

How PACE helps at your stage:

At Level 3, the Cadence and Execution pillars of PACE become the primary focus. The work is converting a static plan into a living operating rhythm — weekly check-ins, monthly reviews, quarterly resets — that connects daily work to strategic direction. This is also where OKRs become a useful tool, not as a standalone system, but as part of the broader execution cadence.

Your next step:

A 30-minute conversation to understand your specific situation and what the most useful first move looks like for your business.

Book a call here: https://cal.id/pgs

You may also find it useful to explore how OKRs fit into your situation: https://subramaniampg.guru/work/okr-consulting

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  4: {
    subject: 'Your PACE Maturity result — and what it means for your organisation',
    text: (name) => `Hi ${name},

Thank you for completing the PACE Maturity Assessment.

Your result is Level 4 — Aligned Execution.

What this means:

The leadership team broadly knows the direction and owns their piece of it. Execution is happening. But the cadence depends on the founder's energy to maintain, and accountability still has soft spots. You are executing — you cannot yet sustain it independently.

How PACE helps at your stage:

At Level 4, the work is strengthening the cadence so it does not depend on you to hold it. This means making the meeting rhythm self-sustaining, tightening the accountability model so slippage is caught early, and ensuring the leadership team can hold each other accountable without the founder in the room. If the constraint is behavioural — a leader whose style is limiting the team — executive coaching may be introduced alongside the strategy work.

Your next step:

A 30-minute conversation to understand your specific situation and what the most useful first move looks like for your business.

Book a call here: https://cal.id/pgs

You may also find it useful to explore executive coaching: https://subramaniampg.guru/work/executive-coaching

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  5: {
    subject: 'Your PACE Maturity result — and what it means for your organisation',
    text: (name) => `Hi ${name},

Thank you for completing the PACE Maturity Assessment.

Your result is Level 5 — Growth Rhythm.

What this means:

Strategy, execution, and review are embedded in how your organisation operates week to week. The founder is working on the business, not in it. The leadership team owns the plan and holds each other accountable. The rhythm absorbs new people and new challenges. You have built something most organisations never achieve.

How PACE helps at your stage:

At this stage, the value of PACE is in sustaining and scaling what you have built. As the organisation grows — new teams, new markets, new leaders — the execution culture that got you here needs to be consciously maintained. The risk at this stage is not failure. It is complacency. The systems are working, which makes it easy to stop questioning them.

Your next step:

A conversation about how to scale your execution culture without diluting it is always worth having.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
}

async function ensureAttributes(apiKey: string) {
  const attrs = ['PACE_ASSESSMENT_LEVEL', 'PACE_ASSESSMENT_DATE', 'PACE_ASSESSMENT_ORGANISATION']
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
    const level = Number(data.level)
    const template = levelEmails[level]

    if (!template) {
      return NextResponse.json({ error: 'Invalid level' }, { status: 400 })
    }

    const textContent = template.text(data.name)

    await sendBrevoEmail({
      to: data.email,
      toName: data.name,
      subject: template.subject,
      htmlContent: textContent.replace(/\n/g, '<br>'),
      textContent,
    })

    const apiKey = process.env.BREVO_API_KEY ?? ''
    await ensureAttributes(apiKey)
    const attributes: Record<string, string> = {
      PACE_ASSESSMENT_LEVEL: LEVEL_NAMES[level] ?? String(level),
      PACE_ASSESSMENT_DATE: formatDate(new Date()),
    }
    if (data.organisation) attributes.PACE_ASSESSMENT_ORGANISATION = data.organisation

    await fetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: data.email, attributes, updateEnabled: true }),
    })

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('PACE assessment API error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
