/**
 * Run: node scripts/seedFaqs.mjs
 * Seeds the 6 confirmed FAQ entries into Sanity.
 * Requires SANITY_API_TOKEN in your environment (write access).
 */

import { createClient } from '@sanity/client'

const client = createClient({
  projectId: 'vpwi5zan',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const FAQS = [
  {
    question: 'How do I get started with PGS?',
    answer: [
      {
        _type: 'block',
        _key: 'faq1a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'faq1a1', text: 'The best way to start is to book a short discovery call. You can do this at cal.id/pgs. The call is free and takes around 20 to 30 minutes. It helps us understand your situation before any engagement is scoped.' }],
        markDefs: [],
      },
    ],
    sortOrder: 1,
    active: true,
  },
  {
    question: 'What kind of organisations does PGS work with?',
    answer: [
      {
        _type: 'block',
        _key: 'faq2a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'faq2a1', text: 'PGS works with founders, senior leaders, and leadership teams primarily in BPO, KPO, FinTech, and management services companies. Both early-stage and growth-stage organisations. Engagements are typically with companies that have between 50 and 500 people.' }],
        markDefs: [],
      },
    ],
    sortOrder: 2,
    active: true,
  },
  {
    question: 'Does PGS work with organisations outside India?',
    answer: [
      {
        _type: 'block',
        _key: 'faq3a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'faq3a1', text: 'Yes. PGS is based in Chennai but works with leadership teams remotely. Clients span multiple geographies. Engagements are conducted online with structured check-in cadences.' }],
        markDefs: [],
      },
    ],
    sortOrder: 3,
    active: true,
  },
  {
    question: 'What is the typical engagement model?',
    answer: [
      {
        _type: 'block',
        _key: 'faq4a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'faq4a1', text: 'Engagements are structured in three stages — Discover, Design, and Deploy. The scope, duration, and format depend on the specific need. All commercial conversations begin with a discovery call so the right engagement can be designed.' }],
        markDefs: [],
      },
    ],
    sortOrder: 4,
    active: true,
  },
  {
    question: 'Are pricing details available on the website?',
    answer: [
      {
        _type: 'block',
        _key: 'faq5a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'faq5a1', text: 'Pricing is not listed on the website. Every engagement is scoped individually based on the organisation\'s size, need, and context. Book a discovery call to start that conversation.' }],
        markDefs: [],
      },
    ],
    sortOrder: 5,
    active: true,
  },
  {
    question: 'What is the difference between OKR consulting, executive coaching, and strategy consulting?',
    answer: [
      {
        _type: 'block',
        _key: 'faq6a',
        style: 'normal',
        children: [{ _type: 'span', _key: 'faq6a1', text: 'OKR consulting focuses on building an execution system — goal-setting, alignment, and cadence. Executive coaching works with individual leaders on thinking, decision-making, and leadership effectiveness. Strategy consulting addresses growth architecture — how the organisation plans, aligns, and executes at a company level. Many engagements draw on more than one of these.' }],
        markDefs: [],
      },
    ],
    sortOrder: 6,
    active: true,
  },
]

async function seed() {
  console.log('Seeding FAQs into Sanity…')
  for (const faq of FAQS) {
    const doc = { _type: 'faq', ...faq }
    const result = await client.create(doc)
    console.log(`✓ Created: "${faq.question}" (${result._id})`)
  }
  console.log('Done.')
}

seed().catch((err) => { console.error(err); process.exit(1) })
