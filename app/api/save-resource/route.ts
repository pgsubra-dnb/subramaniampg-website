import { NextResponse } from 'next/server'

const BASE = 'https://api.brevo.com/v3'

async function ensureAttribute(apiKey: string, name: string) {
  try {
    await fetch(`${BASE}/contacts/attributes/normal/${name}`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'text' }),
    })
    // 400 = already exists — fine, ignore it
  } catch (err) {
    console.error(`[Brevo] ensureAttribute ${name} failed:`, err)
  }
}

// Fetch the current RESOURCE_DOWNLOADED value for an existing contact.
// Returns empty string if the contact doesn't exist yet or has no value.
async function getExistingDownloads(apiKey: string, email: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/contacts/${encodeURIComponent(email)}`, {
      headers: { 'api-key': apiKey },
    })
    if (!res.ok) return ''
    const data = await res.json() as { attributes?: Record<string, unknown> }
    return (data.attributes?.RESOURCE_DOWNLOADED as string) ?? ''
  } catch {
    return ''
  }
}

export async function POST(request: Request) {
  const { name, email, resourceTitle } = await request.json()
  const apiKey = process.env.BREVO_API_KEY ?? ''

  const parts     = (name as string).trim().split(/\s+/)
  const firstName = parts[0] ?? ''
  const lastName  = parts.slice(1).join(' ')

  await ensureAttribute(apiKey, 'RESOURCE_DOWNLOADED')

  // Build an additive comma-separated list so multiple downloads by the
  // same contact are all recorded rather than the latest overwriting earlier ones.
  const existing     = await getExistingDownloads(apiKey, email)
  const alreadyInList = existing.split(', ').map(s => s.trim()).includes(resourceTitle)
  const resourceList  = alreadyInList || !existing
    ? existing || resourceTitle
    : `${existing}, ${resourceTitle}`

  try {
    const res = await fetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME:           firstName,
          LASTNAME:            lastName,
          RESOURCE_DOWNLOADED: resourceList,
        },
        updateEnabled: true,
      }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error('[Brevo] save-resource error:', err)
    }
  } catch (err) {
    console.error('[Brevo] save-resource request failed:', err)
  }

  return NextResponse.json({ ok: true })
}
