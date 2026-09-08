import { createClient } from '@sanity/client'
import crypto from 'crypto'

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

// ─── Magic link tokens (stored in Sanity) ────────────────────────

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function storeMagicToken(email: string, token: string, learnerId?: string): Promise<void> {
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()
  await sanityClient.create({
    _type: 'magicToken',
    email,
    learnerId,
    tokenHash: hashToken(token),
    expiresAt,
  })
}

export async function verifyMagicToken(token: string): Promise<{ email: string; learnerId?: string } | null> {
  const tokenHash = hashToken(token)
  const now = new Date().toISOString()

  const doc = await sanityClient.fetch(
    `*[_type == 'magicToken' && tokenHash == $tokenHash && expiresAt > $now][0]`,
    { tokenHash, now },
    { cache: 'no-store' }
  )

  if (!doc) return null

  await sanityClient.delete(doc._id)

  return { email: doc.email, learnerId: doc.learnerId }
}

export async function cleanExpiredTokens(): Promise<void> {
  const now = new Date().toISOString()
  const expired = await sanityClient.fetch(
    `*[_type == 'magicToken' && expiresAt < $now]{ _id }`,
    { now }
  )
  await Promise.all(expired.map((doc: { _id: string }) => sanityClient.delete(doc._id)))
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
  /** True when a login link email was requested AND accepted by Brevo. */
  magicLinkSent: boolean
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
    /** Send the "you're enrolled / here's your link" email. */
    sendMagicLink?: boolean
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

  let magicLinkSent = false
  if (opts.sendMagicLink) {
    const token = generateToken()
    await storeMagicToken(normalized, token, learner._id)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
    const magicLink = `${siteUrl}/api/academy/verify?token=${token}`
    const intro =
      opts.customEmail?.introHtml ??
      `<p>Hi ${displayName},</p>
       <p>You are now enrolled in <strong>${course.title}</strong>.</p>`
    magicLinkSent = await sendBrevoEmail(
      normalized,
      opts.customEmail?.subject ?? `You are enrolled in ${course.title}`,
      `
        ${intro}
        <p>Click this link to start learning. The link expires in 15 minutes.</p>
        <p><a href="${magicLink}" style="background:#633806;color:#FAEEDA;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Start learning</a></p>
        <p>If the link has expired, visit <a href="${siteUrl}/academy/${course.slug}">${siteUrl}/academy/${course.slug}</a> and enter your email for a new one.</p>
        <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
      `
    )
  }

  return { learnerId: learner._id, learnerCreated, alreadyEnrolled, magicLinkSent }
}
