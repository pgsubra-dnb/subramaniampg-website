import { isDemoRequest } from '@/lib/okrAllyDemoContext'

export async function sendBrevoEmail({
  to,
  toName,
  subject,
  htmlContent,
  textContent,
  attachments,
  skipBcc,
}: {
  to: string
  toName: string
  subject: string
  htmlContent: string
  textContent: string
  /** Optional file attachments — `content` is base64-encoded file data. */
  attachments?: { name: string; content: string }[]
  /** Skip the pgs@embiggen.co.in BCC (e.g. for a document already sent to PGS separately). */
  skipBcc?: boolean
}): Promise<boolean> {
  // Demo mode (OKR Ally / Goal Ally): no email EVER fires for a demo session,
  // regardless of what was typed during it. Two independent guards —
  //   1. the demo request context (set by runInDemoContext in the review route),
  //   2. the reserved-TLD recipient (demo accounts use @…​.invalid).
  if (isDemoRequest() || /\.invalid$/i.test(to.trim())) {
    console.log(`Brevo send SKIPPED (demo mode): subject="${subject}" to=${to}`)
    return false
  }

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('BREVO_API_KEY is not set')
    return false
  }

  const payload: Record<string, unknown> = {
    sender: { name: 'Subramaniam P G', email: 'pgs@embiggen.co.in' },
    to: [{ email: to, name: toName }],
    subject,
    htmlContent,
    textContent,
  }
  if (!skipBcc) {
    payload.bcc = [{ email: 'pgs@embiggen.co.in', name: 'Subramaniam P G' }]
  }
  if (attachments?.length) {
    payload.attachment = attachments
  }

  // Make the BCC decision observable in prod logs (the address is PGS's own, not
  // third-party data) so the "only invoice/payment emails copy PGS" rule can be
  // spot-checked live without an inbox.
  console.log(
    `Brevo send: subject="${subject}" to=${to} bcc=${payload.bcc ? 'pgs@embiggen.co.in' : 'none'}`
  )

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()
  console.log('Brevo status:', res.status)
  console.log('Brevo response:', responseText)

  if (!res.ok) {
    console.error('Brevo failed:', res.status, responseText)
  }
  return res.ok
}
