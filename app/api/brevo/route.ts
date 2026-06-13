import { NextResponse } from 'next/server'

const BASE = 'https://api.brevo.com/v3'

async function ensureAttribute(apiKey: string, name: string) {
  try {
    await fetch(`${BASE}/contacts/attributes/normal/${name}`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text' }),
    })
    // 400 = already exists — that is fine, ignore it
  } catch (err) {
    console.error(`[Brevo] ensureAttribute ${name} failed:`, err)
  }
}

export async function POST(request: Request) {
  const { name, email, organisation, levelLabel, date } = await request.json()

  const apiKey = process.env.BREVO_API_KEY ?? ''

  const parts = (name as string).trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.slice(1).join(' ')

  // Create the three custom attributes if they don't already exist
  await Promise.all([
    ensureAttribute(apiKey, 'ASSESSMENT_LEVEL'),
    ensureAttribute(apiKey, 'ASSESSMENT_DATE'),
    ensureAttribute(apiKey, 'ASSESSMENT_ORGANISATION'),
  ])

  try {
    const res = await fetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: firstName,
          LASTNAME:  lastName,
          ASSESSMENT_LEVEL:        levelLabel,
          ASSESSMENT_DATE:         date,
          ASSESSMENT_ORGANISATION: organisation ?? '',
        },
        updateEnabled: true,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[Brevo] contact save error:', err)
    }
  } catch (err) {
    console.error('[Brevo] request failed:', err)
  }

  return NextResponse.json({ ok: true })
}
