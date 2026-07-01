/**
 * Run: SANITY_API_TOKEN=<token> node scripts/deduplicateFaqs.mjs
 *
 * Fetches all FAQ documents, groups by question text, keeps the one
 * with the lowest sortOrder in each group, and deletes the rest.
 * Prints a dry-run summary first, then asks for confirmation.
 */

import { createClient } from '@sanity/client'
import * as readline from 'readline'

const client = createClient({
  projectId: 'vpwi5zan',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

async function confirm(prompt) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close()
      resolve(answer.trim().toLowerCase())
    })
  })
}

async function run() {
  console.log('Fetching all FAQ documents from Sanity…\n')

  const all = await client.fetch(
    `*[_type == "faq"] | order(sortOrder asc, _createdAt asc) { _id, question, sortOrder, active, _createdAt }`
  )

  console.log(`Found ${all.length} FAQ document(s) total.\n`)

  // Group by normalised question text
  const groups = {}
  for (const doc of all) {
    const key = doc.question.trim().toLowerCase()
    if (!groups[key]) groups[key] = []
    groups[key].push(doc)
  }

  const toKeep = []
  const toDelete = []

  for (const [, docs] of Object.entries(groups)) {
    // First in the sorted list (lowest sortOrder, then earliest created) is the keeper
    toKeep.push(docs[0])
    for (const dup of docs.slice(1)) {
      toDelete.push(dup)
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicates found. Nothing to delete.')
    return
  }

  console.log('── Keeping ──────────────────────────────────────────────')
  for (const d of toKeep) {
    console.log(`  [${d._id}] sortOrder=${d.sortOrder}  "${d.question}"`)
  }

  console.log('\n── Will DELETE ──────────────────────────────────────────')
  for (const d of toDelete) {
    console.log(`  [${d._id}] sortOrder=${d.sortOrder}  "${d.question}"`)
  }

  console.log(`\n${toDelete.length} duplicate(s) will be permanently deleted.`)
  const answer = await confirm('Type "yes" to proceed, anything else to abort: ')

  if (answer !== 'yes') {
    console.log('Aborted. No documents deleted.')
    return
  }

  for (const doc of toDelete) {
    await client.delete(doc._id)
    console.log(`✓ Deleted ${doc._id}  "${doc.question}"`)
  }

  console.log('\nDone. Sanity now has exactly one document per question.')
}

run().catch((err) => { console.error(err); process.exit(1) })
