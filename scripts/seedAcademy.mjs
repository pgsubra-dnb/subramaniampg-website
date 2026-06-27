import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'vpwi5zan',
  dataset: 'production',
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
})

const COVER_IMAGE_ID = 'image-364fe465f77cfd939a5febd34816e1ef52a228a7-1536x1024-webp'
const BADGE_COURSE_ID = 'image-353fc5598afd7acc9d9ae2745add6a37043140eb-1254x1254-webp'

async function seed() {
  console.log('Starting academy seed...')

  // ─── LESSONS (must exist before modules reference them) ───────

  // Module 1 — Lesson 1
  await client.createOrReplace({
    _id: 'okr-lesson-1-1',
    _type: 'lesson',
    title: 'The problem with traditional goal-setting',
    order: 1,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-1' },
    pointsValue: 10,
    interactiveType: 'reflection',
    interactiveContent: JSON.stringify({
      prompt: 'Think about one goal your team or organisation set in the last year. Was it reviewed regularly or written and forgotten? Did it measure outcomes or activities? Did it connect to something bigger?',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'Most organisations set goals. But most also struggle to achieve them. The problem is not the people. The problem is the way goals are set.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'The annual ritual', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Every year, leaders sit down and write goals. These goals go into a document. The document goes into a folder. And by February, no one remembers what was written in January. This is not unusual. It is the norm.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'Three familiar problems', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'Problem 1: Goals are set once and forgotten. Goals are written at the start of the year and reviewed at the end. Nothing happens in between. No check-ins. No course correction. No accountability.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'normal', children: [{ _type: 'span', _key: 's6', text: 'Problem 2: Goals measure activity, not progress. Teams track how busy they are, not how much they have moved forward. Calls made. Reports submitted. Meetings attended. These are activities — not outcomes.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'Problem 3: Goals are disconnected from strategy. Each department sets its own goals. Sales goes one way. Operations goes another. No one checks whether these goals add up to something meaningful for the business.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b8', style: 'h3', children: [{ _type: 'span', _key: 's8', text: 'What needs to change', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b9', style: 'normal', children: [{ _type: 'span', _key: 's9', text: 'Goals need to be few in number, focused on outcomes not activities, reviewed regularly not once a year, and connected to what the business is trying to achieve. This is exactly what OKRs are designed to do.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 1-1 created')

  // Module 1 — Lesson 2
  await client.createOrReplace({
    _id: 'okr-lesson-1-2',
    _type: 'lesson',
    title: 'What is an OKR',
    order: 2,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-1' },
    pointsValue: 10,
    interactiveType: 'true-false',
    interactiveContent: JSON.stringify({
      question: 'Which statement is true?',
      options: [
        { label: 'An Objective in an OKR must always be a specific number', value: 'A' },
        { label: 'Key Results should measure outcomes, not the tasks you plan to complete', value: 'B' },
        { label: 'OKRs should always be tied to salary and bonuses', value: 'C' },
        { label: 'A team should have at least 10 OKRs per quarter', value: 'D' },
      ],
      correctAnswer: 'B',
      explanation: 'Key Results must describe what will be measurably different — not what activities will be completed. The Objective is qualitative and directional, not necessarily a number.',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'OKR stands for Objectives and Key Results. It is a goal-setting framework used by some of the world\'s most successful organisations — from Google and LinkedIn to small businesses and family-owned companies.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'The Objective', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'The Objective is what you want to achieve. It is qualitative and aspirational. It answers: where do we want to go? A good Objective is inspiring. It is a direction, not just a number.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'The Key Results', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'Key Results are how you know you have achieved your Objective. They are specific and measurable. They describe outcomes — not tasks. If you achieve your Key Results, you should have achieved your Objective.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'h3', children: [{ _type: 'span', _key: 's6', text: 'A worked example', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'Objective: Become the most trusted service provider in our region. Key Result 1: Customer satisfaction score rises from 72 to 85. Key Result 2: Net Promoter Score improves from 30 to 50. Key Result 3: Zero unresolved complaints older than 48 hours.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b8', style: 'h3', children: [{ _type: 'span', _key: 's8', text: 'Where OKRs came from', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b9', style: 'normal', children: [{ _type: 'span', _key: 's9', text: 'OKRs were invented by Andy Grove at Intel in the 1970s. In 1999, John Doerr introduced the system to a small startup called Google in a single meeting. Since then, OKRs have been adopted by LinkedIn, Adobe, Spotify, and thousands of organisations. John Doerr wrote about the system in his book Measure What Matters, published in 2018.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 1-2 created')

  // Module 1 — Lesson 3
  await client.createOrReplace({
    _id: 'okr-lesson-1-3',
    _type: 'lesson',
    title: 'Why OKRs work',
    order: 3,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-1' },
    pointsValue: 10,
    interactiveType: 'spot-mistake',
    interactiveContent: JSON.stringify({
      question: 'This OKR has problems. Which option correctly identifies the main issue?',
      options: [
        { label: 'Objective: Do more this quarter. KR1: Complete the product roadmap. KR2: Hold three meetings. KR3: Increase sales. — The Objective is vague and all Key Results are tasks not outcomes.', value: 'A' },
        { label: 'The Objective is too ambitious', value: 'B' },
        { label: 'There are too many Key Results', value: 'C' },
        { label: 'Nothing is wrong with this OKR', value: 'D' },
      ],
      correctAnswer: 'A',
      explanation: 'The Objective is vague with no direction. All three Key Results are activities — complete, hold, increase — not measurable outcomes. "Increase sales" has no starting point or target number.',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'OKRs have been used by Google since 1999. John Doerr describes five reasons why the system works. Together they spell FACTS.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'F — Focus', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'OKRs force you to choose. When you can only have 3 to 5 Objectives, you decide what matters most. Everything else waits.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'A — Alignment', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'When everyone\'s OKRs are visible, people can see how their work connects to the bigger picture. Alignment replaces guesswork with shared direction.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'h3', children: [{ _type: 'span', _key: 's6', text: 'C — Commitment', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'When goals are set openly and reviewed regularly, commitment becomes visible. People know what they said they would do. Their colleagues know too.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b8', style: 'h3', children: [{ _type: 'span', _key: 's8', text: 'T — Tracking', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b9', style: 'normal', children: [{ _type: 'span', _key: 's9', text: 'OKRs are reviewed frequently — usually weekly. Progress is visible. If something is off track, the team knows early enough to act.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b10', style: 'h3', children: [{ _type: 'span', _key: 's10', text: 'S — Stretching', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b11', style: 'normal', children: [{ _type: 'span', _key: 's11', text: 'OKRs are designed to be ambitious. Google considers 70 percent a success, because it means the goal was genuinely challenging. OKRs give people permission to aim high without fear of punishment for falling short.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b12', style: 'h3', children: [{ _type: 'span', _key: 's12', text: 'The important separation', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b13', style: 'normal', children: [{ _type: 'span', _key: 's13', text: 'OKRs are not connected to salary, bonuses, or performance ratings. When goals are tied to compensation, people set safe goals. The ambition disappears. In organisations that have used OKRs for several years and have strong strategic clarity, a thoughtful connection is possible — but never for beginners.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 1-3 created')

  // Module 2 — Lesson 1
  await client.createOrReplace({
    _id: 'okr-lesson-2-1',
    _type: 'lesson',
    title: 'What is an Objective',
    order: 1,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-2' },
    pointsValue: 10,
    interactiveType: 'fill-blank',
    interactiveContent: JSON.stringify({
      question: 'Which of these is a strong Objective that starts with a direct verb and has clear direction?',
      options: [
        { label: 'To improve team performance', value: 'A' },
        { label: 'Build a team that delivers without being chased', value: 'B' },
        { label: 'Support the team this quarter', value: 'C' },
        { label: 'Enable team success', value: 'D' },
      ],
      correctAnswer: 'B',
      explanation: '"Build" is a direct verb that implies commitment and completion. "To improve", "Support", and "Enable" are weak — they suggest intent without ownership.',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'An Objective is what you want to achieve. It is the direction you are moving in. It is qualitative — describing a quality or state you want to reach, not just a number.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'What makes a good Objective', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'A good Objective is inspiring — it makes people want to work toward it. It is clear — anyone reading it understands what success looks like. It is time-bound — achievable within a defined period, usually a quarter.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'The verb matters', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'Start every Objective with a strong verb. Compare: "To improve team performance" — this is intent, not commitment. "Build a high-performing team that delivers consistently" — this is directional and clear. Avoid starting with "to". It sounds like a wish. An Objective should sound like a promise.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'h3', children: [{ _type: 'span', _key: 's6', text: 'Numbers in Objectives', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'Numbers are acceptable in Objectives if the statement is directional and aspirational. A number without direction makes a weak Objective. Direction without any specificity can also be vague. The best Objectives combine direction with enough precision that everyone knows what winning looks like.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 2-1 created')

  // Module 2 — Lesson 2
  await client.createOrReplace({
    _id: 'okr-lesson-2-2',
    _type: 'lesson',
    title: 'What is a Key Result',
    order: 2,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-2' },
    pointsValue: 10,
    interactiveType: 'sort',
    interactiveContent: JSON.stringify({
      question: 'Which of these is an outcome (not an activity)?',
      options: [
        { label: 'Hold three customer review meetings', value: 'A' },
        { label: 'Customer satisfaction score rises from 65 to 80', value: 'B' },
        { label: 'Send weekly update emails to stakeholders', value: 'C' },
        { label: 'Conduct training sessions for the team', value: 'D' },
      ],
      correctAnswer: 'B',
      explanation: 'Only option B describes a measurable change. The others describe activities — things you do, not things that change because of what you did.',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'A Key Result is how you know you have achieved your Objective. It is specific, measurable, and time-bound. It does not describe what you will do. It describes what will be different when you have done it.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'The most common mistake', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'The most common mistake is confusing tasks with outcomes. "Conduct customer interviews" is a task — it tells you what someone will be doing. "Customer satisfaction score increases from 68 to 80" is an outcome — it tells you what will be measurably different.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'Two types of Key Results', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'Value-based Key Results use numbers to measure change: NPS improves from 30 to 50, revenue grows from 10 to 15 crore. These are the strongest type. Activity-based Key Results describe a completed action with a clear end state: Launch the new onboarding process across all five branches. Use these sparingly when a number is not practical.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 2-2 created')

  // Module 2 — Lesson 3
  await client.createOrReplace({
    _id: 'okr-lesson-2-3',
    _type: 'lesson',
    title: 'Outputs vs Outcomes',
    order: 3,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-2' },
    pointsValue: 10,
    interactiveType: 'spot-mistake',
    interactiveContent: JSON.stringify({
      question: 'A team set this OKR. Which Key Result is an output masquerading as an outcome?',
      options: [
        { label: 'KR1: Client retention rate improves from 70% to 85%', value: 'A' },
        { label: 'KR2: Conduct quarterly business reviews with all clients', value: 'B' },
        { label: 'KR3: Net Promoter Score improves from 25 to 45', value: 'C' },
        { label: 'None — all three are strong Key Results', value: 'D' },
      ],
      correctAnswer: 'B',
      explanation: 'KR2 is an activity — "conduct business reviews" is something you do. It does not measure whether those reviews created any value. Replace it with: "Client satisfaction score after each QBR reaches 4.5 out of 5."',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'This is one of the most important distinctions in OKR writing. Most teams naturally think in outputs. OKRs require outcome thinking.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'What is an output', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'An output is something you produce or deliver. A report submitted. A training session conducted. A product feature launched. Outputs are important. But they do not tell you whether anything actually improved.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'What is an outcome', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'An outcome is a change in the world caused by your output. Customer satisfaction improved from 65 to 80 because of the training session. Sales conversion rate rose from 20% to 35% because of the new product feature. Outcomes measure impact. This is what OKRs should track.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'h3', children: [{ _type: 'span', _key: 's6', text: 'The test', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'For every Key Result ask: could this be true even if nothing actually improved? If yes, it is an output. Rewrite it as something that can only be true once a real change has happened.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 2-3 created')

  // Module 3 — Lesson 1
  await client.createOrReplace({
    _id: 'okr-lesson-3-1',
    _type: 'lesson',
    title: 'A bad OKR and a good OKR — side by side',
    order: 1,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-3' },
    pointsValue: 10,
    interactiveType: 'true-false',
    interactiveContent: JSON.stringify({
      question: 'Which statement is correct?',
      options: [
        { label: 'A good Objective should always be a specific number like "Increase revenue by 20 percent"', value: 'A' },
        { label: 'If all Key Results are tasks, the OKR is not measuring outcomes', value: 'B' },
        { label: 'OKRs should be set by the CEO and handed down to teams', value: 'C' },
        { label: 'The more OKRs a team has the more productive they will be', value: 'D' },
      ],
      correctAnswer: 'B',
      explanation: 'Key Results must measure outcomes not activities. Objectives are qualitative and directional — the number belongs in the Key Result, not necessarily the Objective.',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'The fastest way to understand what a good OKR looks like is to see one next to a bad one. Here are three real-world scenarios comparing weak OKRs with strong ones.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'Scenario 1: A sales team', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Bad OKR — Objective: Improve our sales performance. KR1: Make more sales calls. KR2: Update the sales tracker. KR3: Attend the industry conference. What is wrong: The Objective is vague. All three Key Results are activities. None measure whether sales actually improved.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'normal', children: [{ _type: 'span', _key: 's4', text: 'Good OKR — Objective: Build a sales pipeline that consistently converts. KR1: New leads added to pipeline grows from 40 to 70 per month. KR2: Lead-to-proposal conversion rate improves from 25% to 40%. KR3: Revenue from new clients this quarter reaches 18 lakh.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'h3', children: [{ _type: 'span', _key: 's5', text: 'Scenario 2: An HR team', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'normal', children: [{ _type: 'span', _key: 's6', text: 'Bad OKR — Objective: Focus on people this quarter. KR1: Conduct performance appraisals. KR2: Organise two engagement events. KR3: Update the HR policy document. "Focus on people" is not an Objective. The Key Results are a to-do list.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'Good OKR — Objective: Build an organisation where people perform and stay. KR1: Employee engagement score improves from 3.4 to 4.2. KR2: Voluntary attrition rate falls from 18% to 10%. KR3: 90% of employees complete their development plan by end of quarter.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 3-1 created')

  // Module 3 — Lesson 2
  await client.createOrReplace({
    _id: 'okr-lesson-3-2',
    _type: 'lesson',
    title: 'OKRs at individual, team, and company level',
    order: 2,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-3' },
    pointsValue: 10,
    interactiveType: 'reflection',
    interactiveContent: JSON.stringify({
      prompt: 'Think about your own role. If you were to write an OKR for yourself this quarter, what Objective would you choose? What would your three Key Results be? How would your OKR connect to your team or organisation goals?',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'One of the most powerful things about OKRs is how they connect. When done well, every individual OKR traces upward to their team OKR, which traces upward to the company OKR. This is called alignment.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'Vertical alignment', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'Vertical alignment means the OKRs at each level support the OKRs above them. The company sets strategic Objectives. Teams set OKRs that contribute to those. Individuals set OKRs that contribute to their team. Each level is doing something different but everyone is moving in the same direction.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'Horizontal alignment', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'Horizontal alignment means different teams\' OKRs do not conflict with each other. If sales commits to delivering new features but technology has frozen development, these two OKRs pull in opposite directions. Good OKR practice includes a cross-team review where leaders check for conflicts before the quarter begins.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'h3', children: [{ _type: 'span', _key: 's6', text: 'OKRs are not just for large companies', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'A team of five people can use OKRs. A founder running a small business can use OKRs. The principles are the same. The scale adjusts. At smaller scale the company OKR and the founder OKR are often the same thing.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 3-2 created')

  // Module 3 — Lesson 3
  await client.createOrReplace({
    _id: 'okr-lesson-3-3',
    _type: 'lesson',
    title: 'Common mistakes and how to avoid them',
    order: 3,
    moduleRef: { _type: 'reference', _weak: true, _ref: 'okr-module-3' },
    pointsValue: 10,
    interactiveType: 'sort',
    interactiveContent: JSON.stringify({
      question: 'A team set safe, low targets to protect their annual bonus. Which mistake does this represent?',
      options: [
        { label: 'Set and forget', value: 'A' },
        { label: 'OKRs tied to compensation — kills ambition', value: 'B' },
        { label: 'Too many OKRs', value: 'C' },
        { label: 'Top-down without team input', value: 'D' },
      ],
      correctAnswer: 'B',
      explanation: 'When OKRs affect salary or bonuses people sandbag — they set targets they know they will hit. The ambition that makes OKRs powerful disappears entirely.',
    }),
    body: [
      { _type: 'block', _key: 'b1', style: 'normal', children: [{ _type: 'span', _key: 's1', text: 'OKRs fail far more often than they succeed. The reason is almost never the framework. The reason is how the framework is used. Here are the five most common mistakes and how to avoid each one.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b2', style: 'h3', children: [{ _type: 'span', _key: 's2', text: 'Mistake 1: Tying OKRs to salary and performance ratings', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b3', style: 'normal', children: [{ _type: 'span', _key: 's3', text: 'When OKR achievement is linked to bonuses, people stop setting ambitious goals. They aim low to guarantee they hit the target. Keep OKRs and performance management completely separate. In mature organisations with strategic clarity a thoughtful connection is possible — but not for beginners.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b4', style: 'h3', children: [{ _type: 'span', _key: 's4', text: 'Mistake 2: Setting OKRs top-down without team input', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b5', style: 'normal', children: [{ _type: 'span', _key: 's5', text: 'When leaders write all OKRs and hand them down, teams have no ownership. Combine top-down direction with bottom-up input. Leadership sets strategic Objectives. Teams propose their own Key Results and discuss alignment.', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b6', style: 'h3', children: [{ _type: 'span', _key: 's6', text: 'Mistake 3: Making Key Results a task list', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b7', style: 'normal', children: [{ _type: 'span', _key: 's7', text: 'Teams list their quarterly activities inside Key Results. The OKR looks complete but measures nothing. Every Key Result must answer: what will be measurably different when this is done?', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b8', style: 'h3', children: [{ _type: 'span', _key: 's8', text: 'Mistake 4: Set and forget', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b9', style: 'normal', children: [{ _type: 'span', _key: 's9', text: 'OKRs are written at the start of the quarter and never mentioned again. Review OKRs every week. A 15-minute weekly check-in is enough. Ask: what is on track, what is at risk, and what needs to change?', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b10', style: 'h3', children: [{ _type: 'span', _key: 's10', text: 'Mistake 5: Too many OKRs', marks: [] }], markDefs: [] },
      { _type: 'block', _key: 'b11', style: 'normal', children: [{ _type: 'span', _key: 's11', text: 'When every goal is a priority nothing is a priority. Maximum 3 to 5 Objectives. Maximum 3 to 5 Key Results per Objective. If something does not make that list it waits. This is not a limitation — it is the whole point.', marks: [] }], markDefs: [] },
    ],
  })
  console.log('Lesson 3-3 created')

  // ─── MODULES (must exist before course references them) ───────

  const module1 = await client.createOrReplace({
    _id: 'okr-module-1',
    _type: 'academyModule',
    title: 'What OKRs Are and Why They Matter',
    order: 1,
    badgeName: 'OKR Explorer',
    courseRef: { _type: 'reference', _weak: true, _ref: 'okr-foundations-course' },
    questionsToShow: 3,
    lessons: [
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-1-1', _key: 'l11' },
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-1-2', _key: 'l12' },
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-1-3', _key: 'l13' },
    ],
    quizQuestionBank: [
      { _key: 'q1-1', questionText: 'What is the main problem with traditional goal-setting?', optionA: 'Goals are too ambitious', optionB: 'Goals measure activity rather than outcomes and are rarely reviewed', optionC: 'Goals are set by the wrong people', optionD: 'Goals are always connected to salary', correctAnswer: 'B', explanation: 'Traditional goals fail because they track what people do, not what changes. They are also written once and forgotten.', points: 10 },
      { _key: 'q1-2', questionText: 'Which of the following is a good Key Result?', optionA: 'Improve customer service', optionB: 'Hold weekly team meetings', optionC: 'Increase customer satisfaction score from 65 to 80 by end of quarter', optionD: 'Work harder on delivery timelines', correctAnswer: 'C', explanation: 'A good Key Result is specific, measurable, and describes an outcome — not an activity or a vague aspiration.', points: 10 },
      { _key: 'q1-3', questionText: 'Which of the following is the strongest Objective?', optionA: 'Increase revenue by 20 percent', optionB: 'Do better in sales this quarter', optionC: 'Build a sales engine that wins 10 new enterprise clients and grows revenue to 2 crore', optionD: 'Support the growth of the business', correctAnswer: 'C', explanation: 'Numbers in Objectives are acceptable if the statement is directional and aspirational. Option C has both direction and ambition.', points: 10 },
      { _key: 'q1-4', questionText: 'OKR stands for:', optionA: 'Operational Key Results', optionB: 'Objectives and Key Results', optionC: 'Outcomes and Key Reviews', optionD: 'Organisational Key Results', correctAnswer: 'B', explanation: 'OKR was invented by Andy Grove at Intel and stands for Objectives and Key Results.', points: 10 },
      { _key: 'q1-5', questionText: 'Who invented the OKR system?', optionA: 'John Doerr at Google', optionB: 'Larry Page at Google', optionC: 'Andy Grove at Intel', optionD: 'Peter Drucker at General Electric', correctAnswer: 'C', explanation: 'Andy Grove invented OKRs at Intel in the 1970s. John Doerr later introduced the system to Google in 1999.', points: 10 },
      { _key: 'q1-6', questionText: 'What does the S in FACTS stand for?', optionA: 'Strategy', optionB: 'Scoring', optionC: 'Stretching', optionD: 'Success', correctAnswer: 'C', explanation: 'FACTS stands for Focus, Alignment, Commitment, Tracking, Stretching. The S represents the principle that OKRs should be ambitious enough to stretch the team.', points: 10 },
      { _key: 'q1-7', questionText: 'Why should OKRs be separated from salary and bonuses?', optionA: 'Because OKRs are not important enough to affect pay', optionB: 'Because linking OKRs to pay causes people to set safe easy targets and kills ambition', optionC: 'Because HR manages salary and OKRs belong to the business', optionD: 'There is no reason — OKRs should always be linked to pay', correctAnswer: 'B', explanation: 'When OKRs affect compensation, people sandbag — they set targets they know they will hit. This defeats the purpose of ambitious goal-setting.', points: 10 },
      { _key: 'q1-8', questionText: 'How many Objectives should a team typically have per quarter?', optionA: '10 to 15, to cover all priorities', optionB: 'As many as needed', optionC: '3 to 5, to maintain focus', optionD: 'Just 1, to keep things simple', correctAnswer: 'C', explanation: 'OKRs are a prioritisation tool. 3 to 5 Objectives forces the team to choose what matters most. More than that dilutes focus.', points: 10 },
    ],
  })
  console.log('Module 1 created:', module1._id)

  const module2 = await client.createOrReplace({
    _id: 'okr-module-2',
    _type: 'academyModule',
    title: 'The Language of OKRs',
    order: 2,
    badgeName: 'OKR Navigator',
    courseRef: { _type: 'reference', _weak: true, _ref: 'okr-foundations-course' },
    questionsToShow: 3,
    lessons: [
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-2-1', _key: 'l21' },
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-2-2', _key: 'l22' },
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-2-3', _key: 'l23' },
    ],
    quizQuestionBank: [
      { _key: 'q2-1', questionText: 'Which of the following is a strong Objective?', optionA: 'To support the sales team this quarter', optionB: 'Build a sales team that wins three new enterprise accounts this quarter', optionC: 'Increase revenue', optionD: 'Do better in sales', correctAnswer: 'B', explanation: 'A strong Objective is directional, inspiring, and clear. Starting with "to" weakens the statement. Vague phrases like "do better" give no direction.', points: 10 },
      { _key: 'q2-2', questionText: 'A Key Result says: Hold five customer feedback sessions. What is wrong with this?', optionA: 'Five sessions is too many', optionB: 'It is an activity not an outcome — it measures what you will do not what will change', optionC: 'Customer feedback is not important', optionD: 'Nothing is wrong with it', correctAnswer: 'B', explanation: 'Holding sessions is something you do. A Key Result must measure what changes because of those sessions.', points: 10 },
      { _key: 'q2-3', questionText: 'What is the difference between an output and an outcome?', optionA: 'An output is bigger than an outcome', optionB: 'There is no difference — both measure results', optionC: 'An output is something you produce. An outcome is a change that happens because of what you produced.', optionD: 'Outcomes are for individuals. Outputs are for teams.', correctAnswer: 'C', explanation: 'You can produce many outputs and still have no meaningful change. OKRs must track outcomes — the actual difference your work makes.', points: 10 },
      { _key: 'q2-4', questionText: 'Which verb makes an Objective stronger?', optionA: 'To improve team performance', optionB: 'Support team performance', optionC: 'Build a team that delivers without being chased', optionD: 'Enable high performance across the team', correctAnswer: 'C', explanation: 'Direct verbs create ownership. "Build" implies commitment and completion. "To improve", "support", and "enable" suggest intent not action.', points: 10 },
      { _key: 'q2-5', questionText: 'Which of these is a value-based Key Result?', optionA: 'Complete the new onboarding process', optionB: 'Run three client workshops', optionC: 'Reduce average onboarding time from 10 days to 5 days', optionD: 'Improve the onboarding experience', correctAnswer: 'C', explanation: 'A value-based Key Result uses a number to measure change. It shows the starting point and the target.', points: 10 },
      { _key: 'q2-6', questionText: 'The outcome test asks: Could this Key Result be true even if nothing actually improved? What does a YES answer tell you?', optionA: 'The Key Result is excellent', optionB: 'The Key Result is measuring an output not an outcome — rewrite it', optionC: 'The Key Result is too ambitious', optionD: 'The Key Result needs more detail', correctAnswer: 'B', explanation: 'If a Key Result can be ticked off without any real change happening it is an activity or output. Rewrite it to describe what will be measurably different.', points: 10 },
      { _key: 'q2-7', questionText: 'A manager writes this Key Result: Increase sales. What is the main problem?', optionA: 'Sales is not a good focus for OKRs', optionB: 'It has no starting point and no target — it is not measurable', optionC: 'It should be an Objective not a Key Result', optionD: 'There is no problem with this Key Result', correctAnswer: 'B', explanation: 'Every Key Result needs a starting number and a target number. "Increase sales from 50 lakh to 75 lakh this quarter" is measurable. "Increase sales" is not.', points: 10 },
      { _key: 'q2-8', questionText: 'Which of these Objectives contains a number used well?', optionA: 'Achieve 90 percent on-time delivery', optionB: 'Build a delivery operation that reaches 90 percent on-time and becomes our strongest client retention driver', optionC: 'Improve delivery by 20 percent', optionD: 'Hit our delivery targets this quarter', correctAnswer: 'B', explanation: 'Option B uses a number inside a directional aspirational statement. The number adds precision without replacing the sense of direction and purpose.', points: 10 },
    ],
  })
  console.log('Module 2 created:', module2._id)

  const module3 = await client.createOrReplace({
    _id: 'okr-module-3',
    _type: 'academyModule',
    title: 'OKRs in Practice',
    order: 3,
    badgeName: 'OKR Practitioner',
    courseRef: { _type: 'reference', _weak: true, _ref: 'okr-foundations-course' },
    questionsToShow: 5,
    lessons: [
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-3-1', _key: 'l31' },
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-3-2', _key: 'l32' },
      { _type: 'reference', _weak: true, _ref: 'okr-lesson-3-3', _key: 'l33' },
    ],
    quizQuestionBank: [
      { _key: 'q3-1', questionText: 'Which of these is a well-written Objective?', optionA: 'Increase sales by 20 percent', optionB: 'Do better this quarter', optionC: 'Build a sales engine that consistently converts new clients and reaches 2 crore in revenue', optionD: 'Support the growth of the company', correctAnswer: 'C', explanation: 'A well-written Objective is directional, aspirational, and clear. It can contain numbers if they add precision to a directional statement.', points: 10 },
      { _key: 'q3-2', questionText: 'A team Key Result says: Conduct 10 client visits this quarter. What is the problem?', optionA: '10 visits is not enough', optionB: 'It is an activity not an outcome — it does not measure what changes because of the visits', optionC: 'Client visits are not relevant to OKRs', optionD: 'There is no problem with this Key Result', correctAnswer: 'B', explanation: 'Visiting clients is an activity. The Key Result should measure what changes because of those visits.', points: 10 },
      { _key: 'q3-3', questionText: 'What does vertical alignment mean in OKRs?', optionA: 'All OKRs are written in the same format', optionB: 'The OKRs at each level of the organisation support the OKRs above them', optionC: 'Individual OKRs are more important than team OKRs', optionD: 'The CEO writes all the OKRs', correctAnswer: 'B', explanation: 'Vertical alignment means an individual OKR supports their team OKR which supports the company OKR. Everyone moves in the same direction.', points: 10 },
      { _key: 'q3-4', questionText: 'Why should OKRs be separated from salary and performance appraisals?', optionA: 'Because OKRs are not important enough to affect pay', optionB: 'Because when OKRs are linked to pay people set safe easy targets and ambition disappears', optionC: 'Because performance appraisals are done annually and OKRs are quarterly', optionD: 'There is no reason — OKRs should always be linked to pay', correctAnswer: 'B', explanation: 'Linking OKRs to compensation causes sandbagging. In mature systems with clear strategy a thoughtful connection is possible — but never for beginners.', points: 10 },
      { _key: 'q3-5', questionText: 'A company has 12 OKRs for the quarter. What is the likely result?', optionA: 'More goals means more progress', optionB: 'The team will be very productive', optionC: 'Energy is spread too thin, focus is lost, and nothing moves fast enough', optionD: 'Nothing — 12 OKRs is normal and acceptable', correctAnswer: 'C', explanation: 'OKRs are a prioritisation tool. 3 to 5 Objectives is the maximum. Beyond that the focus that OKRs are designed to create disappears.', points: 10 },
      { _key: 'q3-6', questionText: 'What is horizontal alignment in OKRs?', optionA: 'All OKRs are written at the same level of detail', optionB: 'Different teams OKRs are checked so they do not conflict with each other', optionC: 'Individual OKRs match each other in length and format', optionD: 'The leadership team writes OKRs for all departments', correctAnswer: 'B', explanation: 'Horizontal alignment prevents teams from pulling in opposite directions.', points: 10 },
      { _key: 'q3-7', questionText: 'A team sets OKRs at the start of the quarter and never reviews them again. What is this called?', optionA: 'Strategic planning', optionB: 'Set and forget — one of the most common OKR mistakes', optionC: 'Autonomous execution', optionD: 'Good practice — OKRs should not be micromanaged', correctAnswer: 'B', explanation: 'Set and forget is a critical failure mode. OKRs must be reviewed weekly. Without a regular cadence they become irrelevant and ignored.', points: 10 },
      { _key: 'q3-8', questionText: 'Which of these is an example of a bad OKR Objective for a founder?', optionA: 'Establish ourselves as the most trusted logistics partner in South India', optionB: 'Grow the business', optionC: 'Build a category-leading brand that generates 5 crore in annual recurring revenue', optionD: 'Deliver an exceptional client experience that makes switching unthinkable', correctAnswer: 'B', explanation: '"Grow the business" is vague and could mean anything. A good Objective is specific enough that everyone understands what success looks like.', points: 10 },
      { _key: 'q3-9', questionText: 'OKRs work best when teams are involved in setting their own Key Results. Why?', optionA: 'Because teams are better at writing than leaders', optionB: 'Because involvement creates ownership which creates commitment to achieving the goal', optionC: 'Because leaders do not understand the work', optionD: 'There is no benefit — leaders should set all the goals', correctAnswer: 'B', explanation: 'People commit to what they help create. When teams propose their own Key Results within the strategic direction set by leadership they take genuine ownership.', points: 10 },
      { _key: 'q3-10', questionText: 'In Google OKR practice a score of 70 percent on an ambitious goal is considered:', optionA: 'A failure — goals must be achieved 100 percent', optionB: 'Acceptable — it shows the goal was genuinely ambitious and the team gave their best', optionC: 'A warning sign — the team needs more resources', optionD: 'Irrelevant — OKRs are not scored at Google', correctAnswer: 'B', explanation: 'Google grades OKRs on a 0 to 1.0 scale. A score of 0.7 is considered success because it means the goal was set high enough to require genuine stretch.', points: 10 },
    ],
  })
  console.log('Module 3 created:', module3._id)

  // ─── COURSE (created last so module references exist) ─────────
  const course = await client.createOrReplace({
    _id: 'okr-foundations-course',
    _type: 'course',
    title: 'OKR Foundations',
    slug: { _type: 'slug', current: 'okr-foundations' },
    shortDescription: 'Understand what OKRs are, how to write them, and what mistakes to avoid. Free course with certificate on completion.',
    descriptionLine: 'A foundational programme in Objectives and Key Results methodology',
    price: 0,
    status: 'published',
    coverImage: { _type: 'image', asset: { _type: 'reference', _weak: true, _ref: COVER_IMAGE_ID } },
    badgeImage: { _type: 'image', asset: { _type: 'reference', _weak: true, _ref: BADGE_COURSE_ID } },
    modules: [
      { _type: 'reference', _weak: true, _ref: 'okr-module-1', _key: 'mod1' },
      { _type: 'reference', _weak: true, _ref: 'okr-module-2', _key: 'mod2' },
      { _type: 'reference', _weak: true, _ref: 'okr-module-3', _key: 'mod3' },
    ],
  })
  console.log('Course created:', course._id)

  console.log('\nAll academy content seeded successfully.')
}

seed().catch(err => { console.error(err); process.exit(1) })
