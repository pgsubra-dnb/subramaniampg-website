import { createClient } from '@sanity/client'
import crypto from 'crypto'
import type { NextRequest } from 'next/server'

export const ACADEMY_SESSION_COOKIE = 'academy_session'

export const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vpwi5zan',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  token: process.env.SANITY_API_TOKEN!,
  apiVersion: '2024-01-01',
  useCdn: false,
  // Always resolve to the published version of a document, never an unpublished
  // draft, even if a draft with the same slug/id exists (e.g. mid-edit in Studio).
  perspective: 'published',
})

// ─── Certificate ID ──────────────────────────────────────────────
export function generateCertificateId(courseCode: string): string {
  const year = new Date().getFullYear()
  const random = Math.floor(10000 + Math.random() * 90000)
  return `${courseCode}-${year}-${random}`
}

// ─── 6-digit sign-in codes (stored in Sanity) ────────────────────
//
// Replaces the magic link. The learner types the code back into the tab where
// they asked for it, so sign-in never leaves the original tab / window. Same
// shape as OKR Ally's code path (lib/okrAllySanity.ts): the code is never
// stored — `codeHash` is an HMAC keyed by the email + a server secret — and a
// short TTL plus a hard wrong-attempt cap defend the online path.

export const SIGN_IN_CODE_TTL_MS = 15 * 60 * 1000
export const MAX_SIGN_IN_CODE_ATTEMPTS = 5

/** A uniformly-random 6-digit code, "000000"–"999999" (no modulo bias). */
export function generateSignInCode(): string {
  return String(crypto.randomInt(0, 1_000_000)).padStart(6, '0')
}

function signInCodeHash(email: string, code: string): string {
  // SANITY_API_TOKEN is a high-entropy server-only secret present in every
  // environment that runs this code; keying the HMAC with it means a leak of the
  // Sanity dataset alone can't be brute-forced back to a 6-digit code.
  const secret = process.env.SANITY_API_TOKEN
  if (!secret) {
    throw new Error('SANITY_API_TOKEN is not set — required to hash sign-in codes')
  }
  return crypto.createHmac('sha256', secret).update(`${email}:${code}`).digest('hex')
}

/**
 * Issue a fresh code for `email`, replacing any code already on file (a resend
 * always supersedes — the old one stops working immediately).
 */
export async function storeSignInCode(email: string, code: string): Promise<void> {
  const existing: { _id: string }[] = await sanityClient.fetch(
    `*[_type == 'signInCode' && email == $email]{ _id }`,
    { email },
    { cache: 'no-store' }
  )
  await Promise.all(existing.map((d) => sanityClient.delete(d._id)))

  await sanityClient.create({
    _type: 'signInCode',
    email,
    codeHash: signInCodeHash(email, code),
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
  const doc = await sanityClient.fetch(
    `*[_type == 'signInCode' && email == $email] | order(_createdAt desc)[0]`,
    { email },
    { cache: 'no-store' }
  )

  if (!doc?._id) return { ok: false, reason: 'expired' }

  if (!doc.expiresAt || Date.parse(doc.expiresAt) <= Date.now()) {
    await sanityClient.delete(doc._id)
    return { ok: false, reason: 'expired' }
  }

  const expected = Buffer.from(signInCodeHash(email, code))
  const stored = Buffer.from(String(doc.codeHash || ''))
  const match =
    expected.length === stored.length && crypto.timingSafeEqual(expected, stored)

  if (match) {
    await sanityClient.delete(doc._id)
    return { ok: true, email: doc.email }
  }

  const attempts = (typeof doc.attempts === 'number' ? doc.attempts : 0) + 1
  if (attempts >= MAX_SIGN_IN_CODE_ATTEMPTS) {
    await sanityClient.delete(doc._id)
    return { ok: false, reason: 'locked' }
  }
  await sanityClient.patch(doc._id).set({ attempts }).commit()
  return { ok: false, reason: 'invalid' }
}

// ─── Learner ─────────────────────────────────────────────────────

export async function getLearnerByEmail(email: string) {
  return await sanityClient.fetch(
    `*[_type == 'learnerRecord' && email == $email][0]`,
    { email },
    { cache: 'no-store' }
  )
}

export async function createLearnerRecord(data: {
  name: string
  email: string
  company: string
  courseId: string
}) {
  return await sanityClient.create({
    _type: 'learnerRecord',
    name: data.name,
    email: data.email,
    company: data.company,
    enrolledCourses: [{ _type: 'reference', _ref: data.courseId }],
    completionLog: [],
    pointsTotal: 0,
    certificateRefs: [],
    advancedCourseInterest: false,
  })
}

/** The signed-in learner's id + email from the `academy_session` cookie, or
 *  null. The cookie holds the Sanity learnerRecord._id. */
export async function getSessionLearner(
  req: NextRequest
): Promise<{ id: string; email: string; name: string } | null> {
  const id = req.cookies.get(ACADEMY_SESSION_COOKIE)?.value
  if (!id) return null
  const l = await sanityClient.fetch(
    `*[_type == 'learnerRecord' && _id == $id][0]{ _id, email, name }`,
    { id },
    { cache: 'no-store' }
  )
  if (!l?.email) return null
  return { id: l._id, email: String(l.email).toLowerCase(), name: l.name ?? '' }
}

// ─── Brevo ───────────────────────────────────────────────────────

export async function sendBrevoEmail(
  to: string,
  subject: string,
  htmlContent: string,
  skipBcc = false
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    sender: { name: 'Subramaniam P G', email: 'pgs@embiggen.co.in' },
    to: [{ email: to }],
    replyTo: { email: 'pgs@embiggen.co.in' },
    subject,
    htmlContent,
  }
  if (!skipBcc && to !== 'pgs@embiggen.co.in') {
    payload.bcc = [{ email: 'pgs@embiggen.co.in' }]
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify(payload),
  })
  return response.ok
}

export async function sendBrevoEmailToMany(
  to: { email: string }[],
  subject: string,
  htmlContent: string,
  attachments?: { name: string; content: string }[]
): Promise<boolean> {
  const payload: Record<string, unknown> = {
    sender: { name: 'Subramaniam P G', email: 'pgs@embiggen.co.in' },
    to,
    replyTo: { email: 'pgs@embiggen.co.in' },
    subject,
    htmlContent,
  }
  if (attachments?.length) {
    payload.attachment = attachments
  }
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify(payload),
  })
  return response.ok
}

// ─── Branded email template ───────────────────────────────────────

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function renderAcademyEmail(heading: string, bodyHtml: string): string {
  return `
    <div style="background:#FAF8F5;padding:32px 16px;font-family:Inter,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#FFFFFF;border-radius:8px;overflow:hidden;border:1px solid #D3D1C7;">
        <div style="background:#633806;padding:18px 32px;">
          <p style="margin:0;color:#FAEEDA;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Embiggen Consulting LLP — Academy</p>
        </div>
        <div style="padding:32px;">
          <h1 style="margin:0 0 20px;font-family:'Lora',Georgia,serif;color:#2C2C2A;font-size:22px;font-weight:600;">${heading}</h1>
          ${bodyHtml}
        </div>
      </div>
    </div>
  `
}

export async function upsertBrevoContact(
  email: string,
  attributes: Record<string, string | boolean>
): Promise<void> {
  await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      email,
      attributes,
      updateEnabled: true,
    }),
  })
}

// ─── Enrol a learner by email ────────────────────────────────────────────

export interface EnrolLearnerResult {
  learnerId: string
  /** True when the learnerRecord was created by this call. */
  learnerCreated: boolean
  /** True when the learner was already enrolled in this course before the call. */
  alreadyEnrolled: boolean
  /** True when the welcome email was requested AND accepted by Brevo. */
  welcomeEmailSent: boolean
}

/**
 * Enrol the learner identified by `email` in `course`, creating the
 * learnerRecord on first sight and appending the course to `enrolledCourses`
 * only if it is not already there. Optionally emails a 15-minute login link.
 *
 * This is the shared primitive behind free enrolment, paid enrolment, and
 * corporate seat assignment. Sanity writes only — it deliberately does NOT
 * touch Neon, so it can be called after a Neon transaction has committed.
 * Non-blocking on the Brevo contact upsert and the email send.
 */
export async function enrolLearnerByEmail(
  email: string,
  course: { id: string; slug: string; title: string },
  opts: {
    name?: string
    company?: string
    /** Send the "you're enrolled — open your course" welcome email. */
    sendWelcomeEmail?: boolean
    /** Overrides the default enrolment email copy (e.g. for a corporate seat). */
    customEmail?: { subject: string; introHtml: string }
  } = {}
): Promise<EnrolLearnerResult> {
  const normalized = email.trim().toLowerCase()
  const displayName = opts.name?.trim() || normalized.split('@')[0]

  let learner = await getLearnerByEmail(normalized)
  let learnerCreated = false
  let alreadyEnrolled = false

  if (!learner) {
    learner = await createLearnerRecord({
      name: displayName,
      email: normalized,
      company: opts.company?.trim() || '',
      courseId: course.id,
    })
    learnerCreated = true
  } else {
    alreadyEnrolled = !!learner.enrolledCourses?.some(
      (c: { _ref: string }) => c._ref === course.id
    )
    if (!alreadyEnrolled) {
      await sanityClient
        .patch(learner._id)
        .setIfMissing({ enrolledCourses: [] })
        .append('enrolledCourses', [{ _type: 'reference', _ref: course.id }])
        .commit()
    }
  }

  try {
    await upsertBrevoContact(normalized, {
      FIRSTNAME: displayName.split(' ')[0],
      LASTNAME: displayName.split(' ').slice(1).join(' '),
      ACADEMY_ENROLLED: 'true',
    })
  } catch (e) {
    console.error('enrolLearnerByEmail: Brevo contact upsert failed', e)
  }

  let welcomeEmailSent = false
  if (opts.sendWelcomeEmail) {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
    const courseUrl = `${siteUrl}/academy/${course.slug}`
    const intro =
      opts.customEmail?.introHtml ??
      `<p>Hi ${displayName},</p>
       <p>You are now enrolled in <strong>${course.title}</strong>.</p>`
    welcomeEmailSent = await sendBrevoEmail(
      normalized,
      opts.customEmail?.subject ?? `You are enrolled in ${course.title}`,
      `
        ${intro}
        <p>Open your course here:</p>
        <p><a href="${courseUrl}" style="background:#633806;color:#FAEEDA;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Go to the course</a></p>
        <p>The first time you visit, choose <strong>Log in</strong> and enter this email address —
           we'll send you a 6-digit sign-in code to type in. No password needed.</p>
        <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
      `
    )
  }

  return { learnerId: learner._id, learnerCreated, alreadyEnrolled, welcomeEmailSent }
}
