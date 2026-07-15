// Migrates blog post categories from plain strings to references against a new
// `category` document type, so categories can be managed from Studio directly
// instead of being a hardcoded list in code.
//
// Step 1: ensure a `category` document exists for each of the 6 standard names.
// Step 2: for every `post`, remap its raw string `categories` array to
//         references at matching category documents. Any string that doesn't
//         exactly match one of the 6 standard names is dropped and reported —
//         those posts need to be manually re-tagged in Studio afterward.
//
// Dry-run by default — always review the plan before writing.
//
// Usage:
//   node scripts/migrateCategoriesToReferences.mjs                (dry run)
//   node scripts/migrateCategoriesToReferences.mjs --confirm      (actually writes)

import { createClient } from '@sanity/client'

const PROJECT_ID = 'vpwi5zan'
const DATASET = process.env.SANITY_STUDIO_DATASET || process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'

const STANDARD_CATEGORIES = [
  'Ancient Wisdom',
  "Author's Choice",
  'Enabling Growth',
  'Page Turners',
  'Videos',
  'leadership',
]

const confirm = process.argv.includes('--confirm')

const token = process.env.SANITY_API_TOKEN
if (!token) {
  console.error('SANITY_API_TOKEN is required in the environment.')
  process.exit(1)
}

const client = createClient({ projectId: PROJECT_ID, dataset: DATASET, apiVersion: '2024-01-01', token, useCdn: false })

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function categoryId(title) {
  return `category-${slugify(title)}`
}

function randomKey() {
  return Math.random().toString(36).slice(2, 10)
}

// Collapse any run of whitespace (including non-breaking spaces) to a single
// regular space and trim, so cosmetic differences like "Page Turners"
// still match "Page Turners" instead of being flagged as unrecognized.
function normalize(value) {
  return value.replace(/\s+/g, ' ').trim()
}

async function main() {
  console.log(`Dataset: ${DATASET}\n`)

  // Step 1: figure out which of the 6 standard categories already exist as documents.
  const existingCategories = await client.fetch(`*[_type == "category"]{ _id, title }`)
  const existingByTitle = new Map(existingCategories.map((c) => [c.title, c._id]))

  const toCreate = STANDARD_CATEGORIES.filter((title) => !existingByTitle.has(title))

  console.log('Category documents:')
  for (const title of STANDARD_CATEGORIES) {
    const existing = existingByTitle.get(title)
    console.log(`  [${existing ? 'EXISTS' : 'CREATE'}] "${title}" -> ${existing || categoryId(title)}`)
  }

  // Step 2: fetch all published posts with their raw (still-string) categories
  // field. Drafts (a separate "drafts.<id>" document for any in-progress edit)
  // are excluded — a bulk script shouldn't silently rewrite unpublished work.
  const posts = await client.fetch(`*[_type == "post" && !(_id in path("drafts.**"))]{ _id, title, categories }`)

  const idForTitle = new Map(STANDARD_CATEGORIES.map((t) => [normalize(t), existingByTitle.get(t) || categoryId(t)]))

  const patches = []
  const unmapped = []

  for (const post of posts) {
    const rawCategories = Array.isArray(post.categories) ? post.categories : []
    // Skip posts that are already migrated (categories is already an array of references).
    if (rawCategories.some((c) => c && typeof c === 'object' && c._type === 'reference')) {
      continue
    }

    const matched = []
    const dropped = []
    for (const value of rawCategories) {
      if (typeof value !== 'string') continue
      const clean = normalize(value)
      if (clean === '') continue // blank/whitespace-only entries are noise, not real tags
      if (idForTitle.has(clean)) {
        matched.push(clean)
      } else {
        dropped.push(value)
      }
    }

    if (dropped.length > 0) {
      unmapped.push({ id: post._id, title: post.title, dropped })
    }

    patches.push({
      id: post._id,
      title: post.title,
      matched,
      newCategories: matched.map((value) => ({
        _type: 'reference',
        _ref: idForTitle.get(value),
        _key: randomKey(),
      })),
    })
  }

  console.log(`\nPosts to migrate: ${patches.length} (of ${posts.length} total)`)
  for (const p of patches) {
    console.log(`  ${p.id} "${p.title}": [${p.matched.join(', ') || '(none)'}]`)
  }

  if (unmapped.length > 0) {
    console.log(`\nPosts with unrecognized category values that will be DROPPED (need manual re-tagging in Studio):`)
    for (const u of unmapped) {
      console.log(`  ${u.id} "${u.title}": ${u.dropped.map((d) => `"${d}"`).join(', ')}`)
    }
  }

  if (!confirm) {
    console.log('\nThis was a DRY RUN. No changes were made.')
    console.log('Re-run with --confirm to actually apply this exact plan.')
    return
  }

  console.log('\n--confirm passed. Applying changes...\n')

  let tx = client.transaction()
  for (const title of toCreate) {
    tx = tx.createIfNotExists({ _id: categoryId(title), _type: 'category', title })
  }
  await tx.commit()
  console.log(`Created ${toCreate.length} category document(s).`)

  for (const p of patches) {
    await client.patch(p.id).set({ categories: p.newCategories }).commit()
  }
  console.log(`Migrated ${patches.length} post(s).`)
}

main().catch((err) => {
  console.error('Migration failed:', err.message)
  process.exit(1)
})
