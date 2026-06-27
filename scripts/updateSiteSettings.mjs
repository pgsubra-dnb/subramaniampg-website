const PROJECT_ID = 'vpwi5zan'
const DATASET = 'production'
const TOKEN = process.env.SANITY_WRITE_TOKEN

const mutation = {
  mutations: [
    {
      createOrReplace: {
        _id: 'siteSettings',
        _type: 'siteSettings',
        yearsExperience: '40+',
        booksPublished: '7',
        articlesWritten: '182',
        leadersCoached: '100+',
      },
    },
  ],
}

const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}`

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${TOKEN}`,
  },
  body: JSON.stringify(mutation),
})

const data = await res.json()
console.log('Status:', res.status)
console.log('Response:', JSON.stringify(data, null, 2))
