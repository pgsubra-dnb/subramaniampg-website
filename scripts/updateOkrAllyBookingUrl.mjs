/**
 * Repoint the OKR Ally exit-screen booking link at the new paid consulting page.
 *
 * OKR Ally's exit screen reads `okrAllySettings.okrAllyBookingUrl` from the
 * isolated `okr-ally` dataset (see lib/okrAlly.ts → getSiteSettings). This patch
 * changes it from the free short-discussion Cal.id link to /work/book-consulting.
 *
 * Run:  SANITY_WRITE_TOKEN=xxx node scripts/updateOkrAllyBookingUrl.mjs
 *
 * You can also just edit it in Studio: /studio/okr-ally → OKR Ally Settings →
 * "Consulting Booking URL".
 */
const PROJECT_ID = 'vpwi5zan'
const DATASET = 'okr-ally'
const TOKEN = process.env.SANITY_WRITE_TOKEN
const NEW_URL = 'https://www.subramaniampg.guru/work/book-consulting'

if (!TOKEN) {
  console.error('Set SANITY_WRITE_TOKEN')
  process.exit(1)
}

const mutation = {
  mutations: [
    { patch: { id: 'okrAllySettings', set: { okrAllyBookingUrl: NEW_URL } } },
  ],
}

const url = `https://${PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${DATASET}?returnDocuments=true`

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
  body: JSON.stringify(mutation),
})

const data = await res.json()
console.log('Status:', res.status)
console.log('Response:', JSON.stringify(data, null, 2))
