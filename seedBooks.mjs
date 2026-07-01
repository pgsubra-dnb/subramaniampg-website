// scripts/seedBooks.mjs
// Run with: SANITY_WRITE_TOKEN=<token> node scripts/seedBooks.mjs

const PROJECT_ID = 'vpwi5zan'
const DATASET = 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN

const books = [
  {
    id: 'book-master-leadership-focus',
    title: 'Master Leadership Focus',
    slug: 'master-leadership-focus',
    amazonUrl: 'https://amzn.in/d/01PmmiIV',
  },
  {
    id: 'book-elevate-your-leadership',
    title: 'Elevate Your Leadership',
    slug: 'elevate-your-leadership',
    amazonUrl: 'https://amzn.in/d/04zntDcd',
  },
  {
    id: 'book-beyond-the-surface',
    title: 'Beyond the Surface',
    slug: 'beyond-the-surface',
    amazonUrl: 'https://amzn.in/d/01mB8NQ9',
  },
  {
    id: 'book-lead-with-integrity',
    title: 'Lead with Integrity',
    slug: 'lead-with-integrity',
    amazonUrl: 'https://amzn.in/d/0fClzHrL',
  },
  {
    id: 'book-the-lamp-and-the-shadow',
    title: 'The Lamp and the Shadow',
    slug: 'the-lamp-and-the-shadow',
    amazonUrl: 'https://amzn.in/d/0dfjvlWu',
  },
  {
    id: 'book-master-execution-gap',
    title: 'Master Execution Gap',
    slug: 'master-execution-gap',
    amazonUrl: 'https://amzn.in/d/06Aq42fD',
  },
  {
    id: 'book-awaken-your-potential',
    title: 'Awaken Your Potential',
    slug: 'awaken-your-potential',
    amazonUrl: 'https://amzn.in/d/015kSqih',
  },
]

const mutations = books.map((b) => ({
  createOrReplace: {
    _type: 'book',
    _id: b.id,
    title: b.title,
    slug: { _type: 'slug', current: b.slug },
    amazonUrl: b.amazonUrl,
  },
}))

const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify({ mutations }),
})

const data = await res.json()
console.log('Status:', res.status)
console.log('Response:', JSON.stringify(data, null, 2))

if (res.ok) {
  console.log('Done. All 7 books seeded.')
} else {
  console.error('Failed:', data)
}
