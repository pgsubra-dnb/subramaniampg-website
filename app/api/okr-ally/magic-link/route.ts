import { NextRequest, NextResponse } from 'next/server'
import { generateToken, storeMagicToken } from '@/lib/okrAllySanity'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * OKR Ally email gate (screen flow, section 9, step 2).
 * Unlike the Academy magic-link route, anyone may request a link — OKR Ally
 * creates the user on first verification rather than requiring a pre-existing
 * learner record. Token primitives are reused from lib/academy.ts as-is.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const token = generateToken()
    await storeMagicToken(email, token)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
    const magicLink = `${siteUrl}/api/okr-ally/verify?token=${token}`

    await sendBrevoEmail({
      to: email,
      toName: email.split('@')[0] || 'there',
      subject: 'Your OKR Ally sign-in link',
      htmlContent: `
        <div style="font-family:Inter,Arial,sans-serif;color:#2C2C2A;line-height:1.6;">
          <p>Here is your link to continue with <strong>OKR Ally</strong>. It expires in 15 minutes and can be used once.</p>
          <p>
            <a href="${magicLink}" style="background:#1F6F54;color:#FAF8F5;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">
              Continue to OKR Ally
            </a>
          </p>
          <p style="font-size:13px;color:#6b6b66;">If you did not request this link, you can ignore this email.</p>
          <p style="font-size:13px;color:#6b6b66;">Subramaniam P G &middot; Embiggen Consulting LLP</p>
        </div>
      `,
      textContent:
        `Here is your link to continue with OKR Ally. It expires in 15 minutes and can be used once.\n\n` +
        `${magicLink}\n\nIf you did not request this link, you can ignore this email.`,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('OKR Ally magic-link error:', error)
    return NextResponse.json({ error: 'Failed to send sign-in link' }, { status: 500 })
  }
}
