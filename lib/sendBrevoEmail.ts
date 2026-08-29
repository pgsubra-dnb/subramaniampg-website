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
