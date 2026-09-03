import { NextRequest, NextResponse } from 'next/server'
import { generateSignInCode, storeSignInCode, SIGN_IN_CODE_TTL_MS } from '@/lib/okrAllySanity'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { allow } from '@/lib/okrAllyRateLimit'
import { tokens } from '@/lib/okrAllyTokens'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// Code requests: the client offers up to 3 resends on a 60s cooldown, so ~4 per
// session is normal; this backstops abuse (in-memory, per instance).
const MAX_CODES = 6
const CODE_WINDOW_MS = 15 * 60 * 1000
const TTL_MIN = Math.round(SIGN_IN_CODE_TTL_MS / 60000)

/**
 * OKR Ally / Goal Ally email gate — step 1: send a 6-digit sign-in code.
 * Anyone may request one; the Neon user is created on first successful
 * verification (POST /api/okr-ally/sign-in-code/verify). There is no
 * magic-link URL — the code is typed back into the app.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const brand = toBrand(body.brand)
    const v = vocab(brand)

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (
      !allow(`sign-in-code:email:${email}`, MAX_CODES, CODE_WINDOW_MS) ||
      !allow(`sign-in-code:ip:${ip}`, MAX_CODES * 3, CODE_WINDOW_MS)
    ) {
      return NextResponse.json(
        { error: 'Too many sign-in codes requested. Wait a few minutes, then try again.' },
        { status: 429 }
      )
    }

    const code = generateSignInCode()
    await storeSignInCode(email, code)

    await sendBrevoEmail({
      to: email,
      toName: email.split('@')[0] || 'there',
      subject: `Your ${v.product} sign-in code: ${code}`,
      htmlContent: `
        <div style="font-family:Inter,Arial,sans-serif;color:${tokens.textPrimary};line-height:1.6;">
          <p>Here is your code to continue with <strong>${v.product}</strong>. Enter it in the tab where you asked for it.</p>
          <p style="font-size:32px;font-weight:700;letter-spacing:6px;margin:18px 0;color:${tokens.textPrimary};">${code}</p>
          <p style="font-size:13px;color:${tokens.textSecondary};">It expires in ${TTL_MIN} minutes and can be used once. If you did not request it, you can ignore this email.</p>
          <p style="font-size:13px;color:${tokens.textSecondary};">Subramaniam P G &middot; Embiggen Consulting LLP</p>
        </div>
      `,
      textContent:
        `Your ${v.product} sign-in code is ${code}\n\n` +
        `Enter it in the tab where you asked for it. It expires in ${TTL_MIN} minutes and can be used once.\n\n` +
        `If you did not request it, you can ignore this email.`,
      // Sign-in codes are not a payment event — PGS is not copied. Only
      // invoice / payment-confirmation emails BCC pgs@embiggen.co.in.
      skipBcc: true,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('OKR Ally sign-in-code error:', error)
    return NextResponse.json({ error: 'Failed to send sign-in code' }, { status: 500 })
  }
}
