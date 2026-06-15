'use server'

import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

const levelEmails: Record<number, { subject: string; text: (name: string) => string }> = {
  1: {
    subject: 'Your OKR Readiness result — and what it means for you',
    text: (name) => `Hi ${name},

Thank you for completing the OKR Readiness Assessment.

Your result is Level 1 — Founder-Dependent Execution.

What this means:

Your organisation runs on your personal energy and judgment. Decisions wait for you. Priorities shift when you shift. The team is capable but not yet operating independently. This is a natural stage — and also the stage where the right conversations about goals and priorities can create the biggest shift.

How OKRs can help at your stage:

At this stage, OKRs are most valuable as a clarity tool. They help you articulate what you are trying to achieve, communicate it to your team in a way that reduces the need for constant direction from you, and create the first layer of shared accountability. The goal is not to install a system — it is to start building the habit of thinking in outcomes rather than tasks.

Your next step:

A conversation about where you are and what you are trying to build is the best place to start. No frameworks, no jargon — just a clear-headed look at your situation and what will actually move things forward.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  2: {
    subject: 'Your OKR Readiness result — and what it means for you',
    text: (name) => `Hi ${name},

Thank you for completing the OKR Readiness Assessment.

Your result is Level 2 — Functional Silos.

What this means:

Your organisation has structure but not yet alignment. Each function is doing its job — but they are not always pulling in the same direction. Cross-functional work is slow, handoffs break down, and leadership spends more time coordinating than deciding.

How OKRs can help at your stage:

At this stage, OKRs are most valuable as an alignment tool. They create a shared language for what the organisation is trying to achieve and make it visible when different functions are pulling in different directions. The process of writing OKRs together — not just the OKRs themselves — is where the value often shows up first.

Your next step:

A conversation about your current priorities and where alignment is breaking down is a good place to start. From there we can work out what a practical first step looks like for your organisation.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  3: {
    subject: 'Your OKR Readiness result — and what it means for you',
    text: (name) => `Hi ${name},

Thank you for completing the OKR Readiness Assessment.

Your result is Level 3 — Structured Alignment.

What this means:

Your organisation has cleared the early hurdles. There is a shared direction, functions are broadly aligned, and the team can execute without you being involved in every decision. You have built something real — and now the opportunity is to make it more consistent and scalable.

How OKRs can help at your stage:

At this stage, OKRs move from being a clarity tool to being a focus tool. You have alignment — now the challenge is staying focused on what matters most as more opportunities and distractions compete for attention. A well-implemented OKR cycle helps the organisation say no to the right things and accelerate on the right ones.

Your next step:

A conversation about your current goal-setting process and where focus tends to break down is a good place to start. From there we can work out what a structured OKR implementation would look like for your organisation.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  4: {
    subject: 'Your OKR Readiness result — and what it means for you',
    text: (name) => `Hi ${name},

Thank you for completing the OKR Readiness Assessment.

Your result is Level 4 — Disciplined Execution.

What this means:

Your organisation executes well. Goals are set, tracked, and reviewed. The team operates with a good degree of independence. The challenge at this stage is not getting things done — it is making sure the right things are getting done as the organisation grows and complexity increases.

How OKRs can help at your stage:

At this stage, OKRs shift from being an implementation challenge to being a quality challenge. The question is not whether you are doing OKRs — it is whether you are doing them well. Are your objectives genuinely ambitious? Are your key results measurable without debate? Is the review process honest? Getting these right at Level 4 is what determines whether the organisation moves forward or plateaus.

Your next step:

A conversation about the quality of your current OKR practice and where it can be sharpened is a good place to start. An external perspective often surfaces things that are hard to see from inside.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
  5: {
    subject: 'Your OKR Readiness result — and what it means for you',
    text: (name) => `Hi ${name},

Thank you for completing the OKR Readiness Assessment.

Your result is Level 5 — Institutionalised Growth.

What this means:

Your organisation has reached a level of execution maturity that most companies never achieve. Strategy translates into action reliably. Leadership is distributed. The founder or CEO is working on the organisation, not in it.

How OKRs can help at your stage:

At this stage, the value of OKRs is in sustaining and scaling what you have built. As the organisation grows — new teams, new markets, new leaders — the execution culture that got you here needs to be consciously maintained. OKRs are one of the tools that keep the rigour in place as complexity increases.

Your next step:

A conversation about how to scale your execution culture without diluting it is always worth having. If there are specific challenges you are navigating as you grow, that is a good place to start.

Book a call here: https://cal.id/pgs

Warm regards
Subramaniam P G
Growth Architect and Executive Coach
Embiggen Consulting LLP
pgs@embiggen.co.in`,
  },
}

export async function submitOkrAssessment(data: {
  name: string
  email: string
  level: number
}) {
  const template = levelEmails[data.level]
  if (!template) return

  const textContent = template.text(data.name)

  await sendBrevoEmail({
    to: data.email,
    toName: data.name,
    subject: template.subject,
    htmlContent: textContent.replace(/\n/g, '<br>'),
    textContent,
  })
}
