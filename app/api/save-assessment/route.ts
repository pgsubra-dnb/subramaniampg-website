import { NextResponse } from 'next/server'

const BREVO = 'https://api.brevo.com/v3'

const LEVEL_NAMES: Record<number, string> = {
  1: 'Founder-Dependent Execution',
  2: 'Functional Silos',
  3: 'Structured Alignment',
  4: 'Disciplined Execution',
  5: 'Institutionalised Growth',
}

async function ensureAttribute(apiKey: string, attrName: string) {
  const url = `${BREVO}/contacts/attributes/normal/${attrName}`
  console.log(`[Brevo] ensureAttribute → POST ${url}`)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text' }),
    })
    const text = await res.text()
    console.log(`[Brevo] ensureAttribute ${attrName} status=${res.status} body=${text}`)
  } catch (err) {
    console.error(`[Brevo] ensureAttribute ${attrName} THREW:`, err)
  }
}

export async function POST(request: Request) {
  console.log('[Brevo] ── save-assessment POST received ──')

  // ── 1. API key check ─────────────────────────────────────
  const apiKey = process.env.BREVO_API_KEY ?? ''
  if (!apiKey) {
    console.error('[Brevo] ERROR: BREVO_API_KEY is empty or not set')
    return NextResponse.json({ ok: false, error: 'missing_api_key' }, { status: 500 })
  }
  console.log(`[Brevo] API key present — first 5 chars: ${apiKey.slice(0, 5)}`)

  // ── 2. Parse request body ────────────────────────────────
  let body: { name: string; email: string; organisation?: string; level: number; date: string }
  try {
    body = await request.json()
    console.log('[Brevo] Request body:', JSON.stringify(body))
  } catch (err) {
    console.error('[Brevo] Failed to parse request body:', err)
    return NextResponse.json({ ok: false, error: 'invalid_body' }, { status: 400 })
  }

  const { name, email, organisation, level, date } = body
  const levelLabel = `Level ${level} — ${LEVEL_NAMES[level] ?? 'Unknown'}`
  const parts     = name.trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.slice(1).join(' ')

  console.log(`[Brevo] Prepared: email=${email} levelLabel="${levelLabel}" firstName=${firstName} lastName=${lastName}`)

  // ── 3. Ensure custom attributes exist ────────────────────
  console.log('[Brevo] Ensuring custom attributes...')
  await Promise.all([
    ensureAttribute(apiKey, 'ASSESSMENT_LEVEL'),
    ensureAttribute(apiKey, 'ASSESSMENT_DATE'),
    ensureAttribute(apiKey, 'ASSESSMENT_ORGANISATION'),
  ])

  // ── 4. Save / update contact ─────────────────────────────
  const contactPayload = {
    email,
    attributes: {
      FIRSTNAME:               firstName,
      LASTNAME:                lastName,
      ASSESSMENT_LEVEL:        levelLabel,
      ASSESSMENT_DATE:         date,
      ASSESSMENT_ORGANISATION: organisation ?? '',
    },
    updateEnabled: true,
  }
  console.log('[Brevo] Contact payload:', JSON.stringify(contactPayload))

  try {
    const res  = await fetch(`${BREVO}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(contactPayload),
    })
    const text = await res.text()
    console.log(`[Brevo] Contact save status=${res.status} body=${text}`)

    if (!res.ok) {
      console.error(`[Brevo] Contact save FAILED status=${res.status}`)
      return NextResponse.json({ ok: false, status: res.status, detail: text })
    }

    console.log('[Brevo] Contact saved successfully')
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Brevo] Contact save THREW:', String(err))
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
