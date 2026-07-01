import { readFileSync } from 'fs'
try {
  const env = readFileSync('.env.local', 'utf8')
  for (const line of env.split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
  }
} catch {}

import { createClient } from '@sanity/client'
const client = createClient({
  projectId: 'vpwi5zan',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const COURSE_REF = { _type: 'reference', _ref: 'raci-decoded-course' }

const assignments = [
  // MODULE 1
  {
    _id: 'raci-assignment-1a',
    _type: 'assignment',
    title: 'The Ambiguity Audit',
    code: '1A',
    course: COURSE_REF,
    moduleSlug: 'raci-module-1',
    prompt: 'Think of a real project you have been part of — at work or elsewhere — where something went wrong because nobody was clearly responsible for it. In 150 to 250 words, describe what happened and which of the four problems from this module (duplicated effort, dropped tasks, decision paralysis, or conflict) it most closely matches.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-1b',
    _type: 'assignment',
    title: 'Worth It or Overkill',
    code: '1B',
    course: COURSE_REF,
    moduleSlug: 'raci-module-1',
    prompt: 'List three tasks or projects from your own work — one where RACI would clearly be worth setting up, one where it would be overkill, and one that is borderline. In a few sentences each, explain your reasoning for each one.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-1c',
    _type: 'assignment',
    title: 'The Fifteen-Minute Fix',
    code: '1C',
    course: COURSE_REF,
    moduleSlug: 'raci-module-1',
    prompt: 'Revisit the legal sign-off story from this module. Write a short paragraph (100 to 150 words) describing exactly what a fifteen-minute RACI conversation at the start of that project should have covered — who would you have made Responsible, Accountable, Consulted, and Informed, and why.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },

  // MODULE 2
  {
    _id: 'raci-assignment-2a',
    _type: 'assignment',
    title: 'Spot the Role',
    code: '2A',
    course: COURSE_REF,
    moduleSlug: 'raci-module-2',
    prompt: 'Pick any task from your current work — something you are doing this week. Identify who is Responsible, who is Accountable, who should be Consulted, and who should be Informed. If any of these roles do not currently exist for that task, say so and explain what should change.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-2b',
    _type: 'assignment',
    title: 'The Accountable Test',
    code: '2B',
    course: COURSE_REF,
    moduleSlug: 'raci-module-2',
    prompt: 'Think of a task where you are currently marked, formally or informally, as Accountable. Do you actually have the authority that role requires — the ability to make decisions and allocate resources? If not, describe the gap and what would need to change for the accountability to be fair.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-2c',
    _type: 'assignment',
    title: 'Consulted or Just Informed',
    code: '2C',
    course: COURSE_REF,
    moduleSlug: 'raci-module-2',
    prompt: 'List three people on a current project who are currently being kept in the loop. For each one, decide honestly whether they should be Consulted or merely Informed, based on whether their input would actually change how the work gets done. Explain your reasoning.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },

  // MODULE 3
  {
    _id: 'raci-assignment-3a',
    _type: 'assignment',
    title: 'Build Your Own Matrix',
    code: '3A',
    course: COURSE_REF,
    moduleSlug: 'raci-module-3',
    prompt: 'Choose a real project you are currently working on or planning. Using either of the two templates provided in this course, build a RACI matrix covering at least five tasks and four stakeholders. Upload the completed file.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-3b',
    _type: 'assignment',
    title: 'The Breakdown Exercise',
    code: '3B',
    course: COURSE_REF,
    moduleSlug: 'raci-module-3',
    prompt: 'Take one large task from your work and break it down into a Work Breakdown Structure with at least four sub-tasks, in the style of the product launch example in this module. For each sub-task, note who would be Responsible and who would be Accountable.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-3c',
    _type: 'assignment',
    title: 'Find the Flaw',
    code: '3C',
    course: COURSE_REF,
    moduleSlug: 'raci-module-3',
    prompt: 'Build a short RACI matrix — even a rough one — for a hypothetical scenario of your choice, but deliberately include one common error from this module, such as two Accountable people on one task or a task with nobody Responsible. Then write a short explanation of the error you planted and how you would fix it.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },

  // MODULE 4
  {
    _id: 'raci-assignment-4a',
    _type: 'assignment',
    title: 'Map Your Own Process',
    code: '4-Process-A',
    course: COURSE_REF,
    moduleSlug: 'raci-module-4',
    prompt: 'Choose a recurring process from your own work — something that repeats regularly, such as onboarding, reporting, approvals, or fulfilment. Sketch a simple swimlane flowchart for it, with at least three lanes and RACI roles marked at the key steps. You may draw this by hand and upload a photo, or build it in any tool you prefer.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-4b',
    _type: 'assignment',
    title: 'Find the Missing Process Owner',
    code: '4-Process-B',
    course: COURSE_REF,
    moduleSlug: 'raci-module-4',
    prompt: 'Think of a process in your organisation, or one you have experienced as a customer, that seems to lack a single clear process owner. In 150 to 250 words, describe the process, explain why you believe there is no clear Accountable owner at the process level, and what problems that gap is likely causing.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-4c',
    _type: 'assignment',
    title: 'Project Tool or Process Tool',
    code: '4-Process-C',
    course: COURSE_REF,
    moduleSlug: 'raci-module-4',
    prompt: 'Take one piece of work from your own experience and decide honestly whether it is really a project or really a process — some work is genuinely ambiguous. Explain your reasoning, and describe which RACI tool — a task-based matrix or a swimlane flowchart — would suit it better, and why.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },

  // MODULE 5
  {
    _id: 'raci-assignment-5a',
    _type: 'assignment',
    title: 'The Rollout Plan',
    code: '5A',
    course: COURSE_REF,
    moduleSlug: 'raci-module-5',
    prompt: 'Imagine you need to introduce RACI to a team that has never used it before. Write a short plan (200 to 300 words) covering how you would introduce the concept, how you would involve the team in building the matrix, and which tool you would choose to keep it accessible, and why.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-5b',
    _type: 'assignment',
    title: 'Choosing Your Tool',
    code: '5B',
    course: COURSE_REF,
    moduleSlug: 'raci-module-5',
    prompt: 'Compare two of the three tools discussed in this module — Excel or Google Sheets, project management software, or online templates — for a specific team or project you have in mind. Explain which one you would choose and why, considering your team\'s size and habits.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-5c',
    _type: 'assignment',
    title: 'Rewrite the Rollout',
    code: '5C',
    course: COURSE_REF,
    moduleSlug: 'raci-module-5',
    prompt: 'Revisit the opening story of this module, where the project manager built the matrix alone and emailed it out. Rewrite how that rollout should have happened instead, step by step, applying what you learned in this module.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },

  // MODULE 6
  {
    _id: 'raci-assignment-6a',
    _type: 'assignment',
    title: 'Your Review Rhythm',
    code: '6A',
    course: COURSE_REF,
    moduleSlug: 'raci-module-6',
    prompt: 'Design a review schedule for a project you are currently part of. State how often you would review the RACI matrix, what three questions you would ask at each review, and who you would gather feedback from.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-6b',
    _type: 'assignment',
    title: 'The Conflict Scenario',
    code: '6B',
    course: COURSE_REF,
    moduleSlug: 'raci-module-6',
    prompt: 'Describe a real or plausible situation where a Consulted person on one of your projects might start acting as though they have decision-making authority. Write how you would handle that conversation, applying the approach described in this module.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
  {
    _id: 'raci-assignment-6c',
    _type: 'assignment',
    title: 'Closing Reflection',
    code: '6C',
    course: COURSE_REF,
    moduleSlug: 'raci-module-6',
    prompt: 'Looking back across all six modules, describe one project from your own experience where applying RACI from the start would have changed the outcome. Be specific about which roles were missing and what you would do differently now.',
    allowText: true,
    allowFile: true,
    acceptedFileTypes: ['xlsx', 'docx', 'pdf'],
    active: true,
  },
]

// Module → assignment IDs map for patching assignmentBank
const moduleAssignments = {
  'raci-module-1': ['raci-assignment-1a', 'raci-assignment-1b', 'raci-assignment-1c'],
  'raci-module-2': ['raci-assignment-2a', 'raci-assignment-2b', 'raci-assignment-2c'],
  'raci-module-3': ['raci-assignment-3a', 'raci-assignment-3b', 'raci-assignment-3c'],
  'raci-module-4': ['raci-assignment-4a', 'raci-assignment-4b', 'raci-assignment-4c'],
  'raci-module-5': ['raci-assignment-5a', 'raci-assignment-5b', 'raci-assignment-5c'],
  'raci-module-6': ['raci-assignment-6a', 'raci-assignment-6b', 'raci-assignment-6c'],
}

async function seed() {
  console.log('Seeding 18 assignments...')
  for (const a of assignments) {
    await client.createOrReplace(a)
    console.log(`  ✓ ${a._id} — ${a.title}`)
  }

  console.log('\nPatching modules with assignmentBank references...')
  for (const [moduleId, assignmentIds] of Object.entries(moduleAssignments)) {
    const assignmentBank = assignmentIds.map(id => ({
      _type: 'reference',
      _ref: id,
      _key: id,
    }))
    await client.patch(moduleId).set({ assignmentBank }).commit()
    console.log(`  ✓ ${moduleId}`)
  }

  console.log('\nAll done. 18 assignments seeded and linked to modules.')
}

seed().catch(err => { console.error(err); process.exit(1) })
