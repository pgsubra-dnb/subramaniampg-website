const PROJECT_ID = 'vpwi5zan'
const DATASET = 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN

const caseStudies = [
  {
    id: 'case-study-strategy-001',
    number: '01',
    title: 'The organisation that did not know what it did not know',
    serviceArea: 'strategy',
    order: 1,
    context: 'A government-linked organisation needed to assess its marketing capability before designing a development intervention. The assumption going in was that the gaps were tactical — skills, tools, execution.',
    revealed: 'The gaps were not tactical. They were structural. There was no shared understanding of what the organisation was trying to achieve with its marketing function. Different leaders had different definitions of success. Without that clarity, any skill-building intervention would have produced activity without direction.',
    workedOn: [
      'A structured gap audit that surfaced misalignment at the leadership level before any training was designed',
      'Establishing a shared definition of what success looked like for the function',
      'Sequencing the intervention — first clarity, then capability, then execution',
      'Building a roadmap that addressed the actual constraint rather than the presenting symptom',
    ],
    resultLabel: 'What changed',
    result: 'The organisation entered the engagement expecting a training needs analysis. It left with a diagnostic that reframed the problem entirely. The roadmap that followed addressed the structural gap first — and the capability work that came after it landed on a foundation that could hold it.',
  },
  {
    id: 'case-study-strategy-002',
    number: '02',
    title: 'The company where goals existed but alignment did not',
    serviceArea: 'strategy',
    order: 2,
    context: 'A fintech company had been setting quarterly OKRs for over a year. The framework was in place. Objectives were written. Key results were defined. On paper, the organisation was running OKRs. In practice, each function was running its own version of them.',
    revealed: 'There were no company-level OKRs. Each function had written its own objectives in isolation. The sales team was optimising for acquisition. The product team was optimising for retention. The operations team was optimising for cost. All reasonable. All pulling in different directions. There was no vertical alignment connecting function-level goals to a shared company direction.',
    workedOn: [
      "Establishing a single company-level annual OKR that every function's objectives had to connect to",
      'Rebuilding each function\'s OKRs from the top down so vertical alignment was visible and traceable',
      'Designing a quarterly review cadence where function-level progress was visible at the company level in the same conversation',
      'Making cross-functional dependencies visible before they became conflicts',
    ],
    resultLabel: 'What changed',
    result: 'For the first time the leadership team could see whether the company was winning — not just whether each function was hitting its numbers. The annual OKR became the anchor for every quarterly planning conversation. The founder stopped being the person who held the picture of the whole business in their head alone.',
  },
  {
    id: 'case-study-strategy-003',
    number: '03',
    title: 'The institution that was growing faster than its systems',
    serviceArea: 'strategy',
    order: 3,
    context: 'A group of academic institutions had expanded significantly — more campuses, more students, more staff. The operational model that had worked at smaller scale was breaking down. Each campus was running differently. Leadership was stretched. The founder was involved in decisions that should have been resolved at the campus level.',
    revealed: 'There was no shared operating standard across campuses. What looked like an execution problem was actually an alignment problem. Campus heads had different interpretations of what good operations looked like. There was no cadence connecting campus performance to group leadership — which meant problems surfaced late and responses were reactive.',
    workedOn: [
      'Establishing a shared operating standard that defined what each campus was accountable for',
      'Clarifying which decisions sat at campus level and which required group leadership',
      'Building a monthly review cadence that gave group leadership visibility without requiring them to be present in every campus conversation',
      "Separating operational decisions from strategic ones so the founder could lead the group rather than manage its parts",
    ],
    resultLabel: 'What changed',
    result: "Campus heads began operating with more confidence and less escalation. The monthly review became the primary mechanism for surfacing issues that needed group attention. The founder was able to shift from managing operations to leading the group's direction. Expansion decisions became easier because there was now a standard to expand into.",
  },
]

const mutations = caseStudies.map(c => ({
  createOrReplace: {
    _type: 'caseStudy',
    _id: c.id,
    number: c.number,
    title: c.title,
    serviceArea: c.serviceArea,
    order: c.order,
    context: c.context,
    revealed: c.revealed,
    workedOn: c.workedOn,
    resultLabel: c.resultLabel,
    result: c.result,
  }
}))

const res = await fetch(`https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  },
  body: JSON.stringify({ mutations }),
})

const data = await res.json()
console.log('Status:', res.status)
console.log('Response:', JSON.stringify(data, null, 2))

if (res.ok) {
  console.log('Done. All 3 case studies seeded.')
} else {
  console.error('Failed:', data)
}
