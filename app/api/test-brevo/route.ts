import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

async function brevoGet(apiKey: string, path: string) {
  const res  = await fetch(`https://api.brevo.com/v3${path}`, {
    headers: { 'api-key': apiKey },
  })
  const data = await res.json()
  return { status: res.status, ok: res.ok, data }
}

export async function GET(request: Request) {
  const apiKey = process.env.BREVO_API_KEY ?? ''

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: 'BREVO_API_KEY not set' })
  }

  const keyPreview = apiKey.slice(0, 5)
  const { searchParams } = new URL(request.url)
  const email = searchParams.get('email') ?? 'pgs@embiggen.co.in'

  try {
    // 1 — account check
    const account = await brevoGet(apiKey, '/account')

    // 2 — list all contact attributes
    const attrs = await brevoGet(apiKey, '/contacts/attributes')

    // 3 — fetch the requested contact by email
    const encodedEmail = encodeURIComponent(email)
    const contact = await brevoGet(apiKey, `/contacts/${encodedEmail}`)

    return NextResponse.json({
      keyPreview,
      checkedEmail: email,
      account:    { status: account.status, email: account.data?.email },
      attributes: {
        status: attrs.status,
        assessmentAttrs: (attrs.data?.attributes ?? [])
          .filter((a: { name: string }) => a.name.startsWith('ASSESSMENT_'))
          .map((a: { name: string; type: string }) => ({ name: a.name, type: a.type })),
      },
      contact: {
        status:     contact.status,
        attributes: contact.data?.attributes ?? contact.data,
      },
    })
  } catch (err) {
    return NextResponse.json({ ok: false, keyPreview, error: String(err) })
  }
}
