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

// ---------------------------------------------------------------------------
// Bigin (Zoho) path. Used when the four ZOHO_* env vars are set. Otherwise the
// route falls back to Brevo, so the page keeps working during setup.
// ---------------------------------------------------------------------------
type Zoho = { clientId: string; clientSecret: string; refreshToken: string; apiDomain: string; accountsUrl: string }

function zohoConfig(): Zoho | null {
  const clientId = process.env.ZOHO_CLIENT_ID
  const clientSecret = process.env.ZOHO_CLIENT_SECRET
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN
  if (!clientId || !clientSecret || !refreshToken) return null
  return {
    clientId,
    clientSecret,
    refreshToken,
    apiDomain: (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in').replace(/\/$/, ''),
    accountsUrl: (process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.in').replace(/\/$/, ''),
  }
}

let cachedToken: { value: string; expires: number } | null = null

async function zohoAccessToken(z: Zoho): Promise<string | null> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.value
  const qs = new URLSearchParams({
    refresh_token: z.refreshToken,
    client_id: z.clientId,
    client_secret: z.clientSecret,
    grant_type: 'refresh_token',
  })
  try {
    const res = await fetch(`${z.accountsUrl}/oauth/v2/token?${qs.toString()}`, { method: 'POST' })
    const data = (await res.json()) as { access_token?: string; expires_in?: number; error?: string }
    if (!res.ok || !data.access_token) {
      console.error('[Webinar] Zoho token error:', data.error ?? res.status)
      return null
    }
    cachedToken = { value: data.access_token, expires: Date.now() + (data.expires_in ?? 3600) * 1000 }
    return cachedToken.value
  } catch (err) {
    console.error('[Webinar] Zoho token request failed:', err)
    return null
  }
}

/** Upsert one Contact in Bigin by email. Returns true on success. */
async function saveToBigin(z: Zoho, v: { name: string; email: string; phone: string; src: string }): Promise<boolean> {
  const token = await zohoAccessToken(z)
  if (!token) return false
  const parts = v.name.split(/\s+/)
  // Bigin requires Last_Name. A single word goes there.
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : parts[0]
  const firstName = parts.length > 1 ? parts[0] : ''

  const record: Record<string, unknown> = {
    Last_Name: lastName,
    Email: v.email,
    // Tags only add information. They never overwrite notes on an existing contact.
    Tag: [
      { name: 'Performance Conversation' },
      { name: CURRENT_EPISODE.id },
      { name: `src-${v.src}` },
    ],
  }
  if (firstName) record.First_Name = firstName
  if (v.phone) record.Mobile = v.phone

  try {
    const res = await fetch(`${z.apiDomain}/bigin/v2/Contacts/upsert`, {
      method: 'POST',
      headers: { Authorization: `Zoho-oauthtoken ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [record], duplicate_check_fields: ['Email'] }),
    })
    const body = (await res.json().catch(() => ({}))) as { data?: { code?: string; message?: string }[] }
    const first = body.data?.[0]
    if (!res.ok || !first || first.code !== 'SUCCESS') {
      console.error('[Webinar] Bigin upsert error:', res.status, JSON.stringify(body).slice(0, 400))
      return false
    }
    return true
  } catch (err) {
    console.error('[Webinar] Bigin request failed:', err)
    return false
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

  const zoho = zohoConfig()
  if (zoho) {
    const ok = await saveToBigin(zoho, { name, email, phone, src })
    if (!ok) {
      return NextResponse.json({ ok: false, error: 'Could not save your registration. Please try again.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  }

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
