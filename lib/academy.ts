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
