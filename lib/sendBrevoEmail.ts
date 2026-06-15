export async function sendBrevoEmail({
  to,
  toName,
  subject,
  htmlContent,
  textContent,
}: {
  to: string
  toName: string
  subject: string
  htmlContent: string
  textContent: string
}) {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('BREVO_API_KEY is not set')
    return
  }

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: 'Subramaniam P G', email: 'pgs@embiggen.co.in' },
      to: [{ email: to, name: toName }],
      bcc: [{ email: 'pgs@embiggen.co.in', name: 'Subramaniam P G' }],
      subject,
      htmlContent,
      textContent,
    }),
  })

  const responseText = await res.text()
  console.log('Brevo status:', res.status)
  console.log('Brevo response:', responseText)

  if (!res.ok) {
    console.error('Brevo failed:', res.status, responseText)
  }
}
