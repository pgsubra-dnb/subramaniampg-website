import { createClient } from '@sanity/client'
import crypto from 'crypto'

/**
 * OKR Ally — dedicated Sanity client.
 *
 * OKR Ally's Sanity content lives in its own dataset (`okr-ally`), separate from
 * the main `production` dataset that powers the marketing site and the Academy.
 * Nothing here touches `lib/academy.ts` or the `production` dataset — that keeps
 * the Academy's schema, queries, and magic-link auth path completely isolated
 * from anything OKR Ally does.
 *
 * This module is the ONLY place OKR Ally talks to Sanity:
 *   - magic-link token storage/verification (this file)
 *   - coupon + course-anchor lookup            (lib/okrAllyBilling.ts)
 *   - okrAllySettings (footer links + GST supplier snapshot)  (lib/okrAlly.ts)
 *
 * Same project, same API token (project-scoped, works across datasets); only the
 * `dataset` differs. Override the dataset name per-environment with
 * NEXT_PUBLIC_OKR_ALLY_SANITY_DATASET if it is ever renamed.
 */

export const OKR_ALLY_SANITY_DATASET =
  process.env.NEXT_PUBLIC_OKR_ALLY_SANITY_DATASET || 'okr-ally'

export const okrAllySanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vpwi5zan',
  dataset: OKR_ALLY_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
  // Always resolve the published version of a document, never a Studio draft.
  perspective: 'published',
})

// ─── Magic-link tokens (stored in the okr-ally dataset) ──────────────────
//
// Mirrors the primitives in lib/academy.ts, but writes to OKR Ally's own
// dataset and carries no `learnerId` — OKR Ally has no learnerRecord concept;
// a verified token resolves straight to a Neon `users` row (see lib/okrAlly.ts).

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function storeMagicToken(email: string, token: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  await okrAllySanityClient.create({
    _type: 'magicToken',
    email,
    tokenHash: hashToken(token),
    expiresAt,
  })
}

export async function verifyMagicToken(token: string): Promise<{ email: string } | null> {
  const tokenHash = hashToken(token)
  const now = new Date().toISOString()

  const doc = await okrAllySanityClient.fetch(
    `*[_type == 'magicToken' && tokenHash == $tokenHash && expiresAt > $now][0]`,
    { tokenHash, now },
    { cache: 'no-store' }
  )

  if (!doc) return null

  await okrAllySanityClient.delete(doc._id)

  return { email: doc.email }
}

export async function cleanExpiredTokens(): Promise<void> {
  const now = new Date().toISOString()
  const expired = await okrAllySanityClient.fetch(
    `*[_type == 'magicToken' && expiresAt < $now]{ _id }`,
    { now }
  )
  await Promise.all(
    expired.map((doc: { _id: string }) => okrAllySanityClient.delete(doc._id))
  )
}
