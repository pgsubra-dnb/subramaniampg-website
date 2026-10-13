import { NextResponse } from 'next/server'
import { CURRENT_EPISODE } from '@/lib/webinarEpisodes'

const BASE = 'https://api.brevo.com/v3'
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

async function ensureAttribute(apiKey: string, name: string) {
  try {
    await fetch(`${BASE}/contacts/attributes/normal/${name}`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text' }),
    })
    // 400 = already exists. That is fine.
  } catch (err) {
    console.error(`[Webinar] ensureAttribute ${name} failed:`, err)
  }
}

async function getExisting(apiKey: string, email: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/contacts/${encodeURIComponent(email)}`, {
      headers: { 'api-key': apiKey },
    })
    if (!res.ok) return ''
    const data = (await res.json()) as { attributes?: Record<string, unknown> }
    return (data.attributes?.WEBINAR_REGISTERED as string) ?? ''
  } catch {
    return ''
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'Invalid request.' }, { status: 400 })
  }

  // Honeypot. Real people never fill this hidden field.
  if (typeof body.website === 'string' && body.website.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const name = String(body.name ?? '').trim().slice(0, 120)
  const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200)
  const phone = String(body.phone ?? '').trim().slice(0, 30)
  const src = String(body.src ?? '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30) || 'direct'

  if (!name) return NextResponse.json({ ok: false, error: 'Please enter your name.' }, { status: 400 })
  if (!EMAIL_RE.test(email)) return NextResponse.json({ ok: false, error: 'Please enter a valid email.' }, { status: 400 })

  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) {
    console.error('[Webinar] BREVO_API_KEY is not set')
    return NextResponse.json({ ok: false, error: 'Registration is unavailable. Please try again later.' }, { status: 500 })
  }

  await Promise.all([
    ensureAttribute(apiKey, 'WEBINAR_REGISTERED'),
    ensureAttribute(apiKey, 'WEBINAR_SOURCE'),
    ensureAttribute(apiKey, 'WEBINAR_PHONE'),
  ])

  // Keep a running list so the same person can register for many episodes.
  const existing = await getExisting(apiKey, email)
  const ids = existing.split(',').map((s) => s.trim()).filter(Boolean)
  if (!ids.includes(CURRENT_EPISODE.id)) ids.push(CURRENT_EPISODE.id)

  const parts = name.split(/\s+/)
  const attributes: Record<string, string> = {
    FIRSTNAME: parts[0] ?? '',
    LASTNAME: parts.slice(1).join(' '),
    WEBINAR_REGISTERED: ids.join(', '),
    WEBINAR_SOURCE: src,
  }
  // Stored as text on purpose. Brevo's SMS field rejects numbers without a country code.
  if (phone) attributes.WEBINAR_PHONE = phone

  const payload: Record<string, unknown> = { email, attributes, updateEnabled: true }
  const listId = Number(process.env.BREVO_WEBINAR_LIST_ID)
  if (Number.isFinite(listId) && listId > 0) payload.listIds = [listId]

  try {
    const res = await fetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[Webinar] Brevo error:', err)
      return NextResponse.json({ ok: false, error: 'Could not save your registration. Please try again.' }, { status: 502 })
    }
  } catch (err) {
    console.error('[Webinar] Brevo request failed:', err)
    return NextResponse.json({ ok: false, error: 'Could not save your registration. Please try again.' }, { status: 502 })
  }

  return NextResponse.json({ ok: true })
}
