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
 *   - 6-digit sign-in code storage/verification (this file)
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

// ─── 6-digit sign-in codes (stored in the okr-ally dataset) ──────────────
//
// OKR Ally / Goal Ally sign-in is a one-time 6-digit code typed back into the
// app — there is no magic-link URL and no token-in-URL path. The code is never
// stored: `codeHash` is an HMAC keyed by the email + OKR_ALLY_SESSION_SECRET,
// so a leak of the Sanity dataset alone can't be brute-forced back to a code.
// A short TTL plus a hard wrong-attempt cap defend the online path.
//
// Academy's magic link (lib/academy.ts, `production` dataset) is untouched.

export const SIGN_IN_CODE_TTL_MS = 10 * 60 * 1000
export const MAX_SIGN_IN_CODE_ATTEMPTS = 5

/** A uniformly-random 6-digit code, "000000"–"999999" (no modulo bias). */
export function generateSignInCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

function codeHash(email: string, code: string): string {
  const secret = process.env.OKR_ALLY_SESSION_SECRET
  if (!secret) {
    throw new Error('OKR_ALLY_SESSION_SECRET is not set — required to hash sign-in codes')
  }
  return crypto.createHmac('sha256', secret).update(`${email}:${code}`).digest('hex')
}

/**
 * Issue a fresh code for `email`, replacing any code already on file (a resend
 * always supersedes — the old one stops working immediately).
 */
export async function storeSignInCode(email: string, code: string): Promise<void> {
  const existing: { _id: string }[] = await okrAllySanityClient.fetch(
    `*[_type == 'signInCode' && email == $email]{ _id }`,
    { email },
    { cache: 'no-store' }
  )
  await Promise.all(existing.map((d) => okrAllySanityClient.delete(d._id)))

  await okrAllySanityClient.create({
    _type: 'signInCode',
    email,
    codeHash: codeHash(email, code),
    attempts: 0,
    expiresAt: new Date(Date.now() + SIGN_IN_CODE_TTL_MS).toISOString(),
  })
}

export type VerifySignInCodeResult =
  | { ok: true; email: string }
  /** 'invalid' = wrong code, tries left; 'expired' = no code on file or past TTL;
   *  'locked' = attempt cap hit, the code is now dead and a new one is needed. */
  | { ok: false; reason: 'invalid' | 'expired' | 'locked' }

/**
 * Check a submitted (email, code) pair. On success the code is consumed
 * (deleted). On the Nth wrong try (N = MAX_SIGN_IN_CODE_ATTEMPTS) the code is
 * destroyed and 'locked' is returned; earlier wrong tries just bump the counter.
 */
export async function verifySignInCode(
  email: string,
  code: string
): Promise<VerifySignInCodeResult> {
  const doc = await okrAllySanityClient.fetch(
    `*[_type == 'signInCode' && email == $email] | order(_createdAt desc)[0]`,
    { email },
    { cache: 'no-store' }
  )

  if (!doc?._id) return { ok: false, reason: 'expired' }

  if (!doc.expiresAt || Date.parse(doc.expiresAt) <= Date.now()) {
    await okrAllySanityClient.delete(doc._id)
    return { ok: false, reason: 'expired' }
  }

  const expected = Buffer.from(codeHash(email, code))
  const stored = Buffer.from(String(doc.codeHash || ''))
  const match =
    expected.length === stored.length && crypto.timingSafeEqual(expected, stored)

  if (match) {
    await okrAllySanityClient.delete(doc._id)
    return { ok: true, email: doc.email }
  }

  const attempts = (typeof doc.attempts === 'number' ? doc.attempts : 0) + 1
  if (attempts >= MAX_SIGN_IN_CODE_ATTEMPTS) {
    await okrAllySanityClient.delete(doc._id)
    return { ok: false, reason: 'locked' }
  }
  await okrAllySanityClient.patch(doc._id).set({ attempts }).commit()
  return { ok: false, reason: 'invalid' }
}

/** Housekeeping — drop codes past their TTL. No scheduled caller today. */
export async function cleanExpiredSignInCodes(): Promise<void> {
  const now = new Date().toISOString()
  const expired = await okrAllySanityClient.fetch(
    `*[_type == 'signInCode' && expiresAt < $now]{ _id }`,
    { now }
  )
  await Promise.all(
    expired.map((doc: { _id: string }) => okrAllySanityClient.delete(doc._id))
  )
}
