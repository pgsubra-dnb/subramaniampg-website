import { NextRequest, NextResponse } from 'next/server'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

const resultEmails: Record<string, { subject: string; text: (name: string) => string }> = {
  C: {
    subject: 'Your coaching assessment result — and what it means',
    text: (name) => `Hi ${name},

Thank you for completing the assessment.

Based on your responses, executive coaching is likely the right fit for where you are right now.

You have a clear sense of what you want to change, you are open to honest feedback, and your situation is stable enough to support sustained development work. These are exactly the conditions that make coaching work.

What this means in practice:

An engagement with PGS typically starts with a 360-degree feedback process and a strengths assessment. This gives you real data — not opinions — about how others experience you. From there, you co-create two to three development goals in your own words and work through them over six to eight months. At the end, a follow-up with your stakeholders confirms what has shifted.

The next step is a 30-minute discovery call. No agenda, no commitment. Just a conversation to understand your situation and decide whether to move forward.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  M: {
    subject: 'Your coaching assessment result — and what it means',
    text: (name) => `Hi ${name},

Thank you for completing the assessment.

Based on your responses, mentoring may serve you better than coaching right now.

You are looking for perspective and direction from someone who has walked a similar path. That is mentoring, not coaching. A coach helps you find your own answers. A mentor shares theirs. Both are valuable — the right one depends on what you need, and your responses suggest you need the latter.

What this means in practice:

PGS works with a small number of clients in a mentoring capacity, particularly around leadership transitions, business decisions, and organisational challenges. If that fits your situation, a conversation is worth having.

The next step is a 30-minute call to understand your context and decide what kind of engagement makes sense.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  T: {
    subject: 'Your coaching assessment result — and what it means',
    text: (name) => `Hi ${name},

Thank you for completing the assessment.

Based on your responses, a structured learning program may be a better starting point than coaching right now.

Your primary gap appears to be knowledge or skill-based rather than behavioural. Coaching works best when the behavioural challenge is already visible. Building the knowledge foundation first — and then returning to coaching — tends to produce better results than the other way around.

What this means in practice:

PGS runs structured programs through Embiggen Academy covering OKR implementation, leadership fundamentals, and execution frameworks. These may be a better fit for where you are right now.

Explore the Academy here: https://subramaniampg.guru/academy

If you would like to talk through which program suits your situation, a short call is always an option.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  N: {
    subject: 'Your coaching assessment result — and what it means',
    text: (name) => `Hi ${name},

Thank you for completing the assessment.

Based on your responses, the timing for a coaching engagement may not be right just yet.

Something in your answers suggests you are either not yet clear on what you need, or under too much pressure right now to invest meaningfully in development work. Coaching requires enough stability to reflect, commit, and act between sessions. Rushing into it when those conditions are not in place rarely helps.

This is not a closed door.

Come back when things settle. In the meantime, a single no-agenda conversation with PGS to think through what you actually need costs nothing and may help you get clearer.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
}

export async function POST(req: NextRequest) {
  console.log('API key present:', !!process.env.BREVO_API_KEY)
  console.log('API key first 6 chars:', process.env.BREVO_API_KEY?.slice(0, 6))
  try {
    const data = await req.json()
    const template = resultEmails[data.outcome]
    if (!template) {
      return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 })
    }
    const textContent = template.text(data.name)
    await sendBrevoEmail({
      to: data.email,
      toName: data.name,
      subject: template.subject,
      htmlContent: textContent.replace(/\n/g, '<br>'),
      textContent,
    })
    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    console.error('Coaching assessment API error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
