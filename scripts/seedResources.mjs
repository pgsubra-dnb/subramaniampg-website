const PROJECT_ID = 'vpwi5zan'
const DATASET = 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN

const resources = [
  {
    id: 'resource-awaken-your-potential-sample',
    title: 'Awaken Your Potential Sample',
    description: 'A sample chapter from the book Awaken Your Potential by Subramaniam P G.',
    accessType: 'free',
    externalUrl: '',
  },
  {
    id: 'resource-elevate-your-leadership-sample',
    title: 'Elevate Your Leadership Sample',
    description: 'A sample chapter from the book Elevate Your Leadership by Subramaniam P G.',
    accessType: 'free',
    externalUrl: '',
  },
  {
    id: 'resource-okr-maturity-model',
    title: 'OKR Maturity Model',
    description: 'A practical guide to understanding and applying the OKR Maturity Model across five levels of execution.',
    accessType: 'free',
    externalUrl: '',
  },
  {
    id: 'resource-raci-guideline',
    title: 'RACI Guideline',
    description: 'A structured guide to using the RACI model for clear role definition and accountability.',
    accessType: 'free',
    externalUrl: '',
  },
  {
    id: 'resource-language-of-okr',
    title: 'Language of OKR',
    description: 'A deeper guide to understanding and writing effective OKRs — gated resource requiring name and email.',
    accessType: 'gated',
    externalUrl: '',
  },
  {
    id: 'resource-master-execution-gap',
    title: 'Master Execution Gap',
    description: 'A guide to identifying and closing the gap between strategy and execution in your organisation.',
    accessType: 'gated',
    externalUrl: '',
  },
]

const mutations = resources.map(r => ({
  createOrReplace: {
    _type: 'resource',
    _id: r.id,
    title: r.title,
    description: r.description,
    accessType: r.accessType,
    ...(r.externalUrl ? { externalUrl: r.externalUrl } : {}),
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
  console.log('Done. All 6 resources seeded.')
} else {
  console.error('Failed:', data)
}
