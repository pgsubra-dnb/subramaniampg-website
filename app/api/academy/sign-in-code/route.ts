import { NextRequest, NextResponse } from 'next/server'
import {
  getLearnerByEmail,
  generateSignInCode,
  storeSignInCode,
  sendBrevoEmail,
  renderAcademyEmail,
  escapeHtml,
  SIGN_IN_CODE_TTL_MS,
} from '@/lib/academy'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const TTL_MIN = Math.round(SIGN_IN_CODE_TTL_MS / 60000)

// In-memory sliding window, per serverless instance. Backstops abuse; the UI
// already gates resends behind a cooldown so ~4 per session is normal.
const MAX_CODES = 6
const WINDOW_MS = 15 * 60 * 1000
const hits = new Map<string, number[]>()
function allow(key: string, max: number): boolean {
  const now = Date.now()
  const recent = (hits.get(key) || []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= max) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    hits.forEach((v, k) => {
      if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k)
    })
  }
  return true
}

/**
 * Academy sign-in — step 1: email a one-time 6-digit code.
 *
 * The learner types the code back into the tab where they asked for it
 * (POST /api/academy/sign-in-code/verify), so sign-in never leaves that tab.
 * There is no magic-link URL and no token-in-URL path.
 *
 * To avoid revealing whether an email has an account, the response is always
 * `{ success: true }` — a code is only actually sent if a learnerRecord exists.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''

    if (!EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    if (!allow(`code:email:${email}`, MAX_CODES) || !allow(`code:ip:${ip}`, MAX_CODES * 3)) {
      return NextResponse.json(
        { error: 'Too many sign-in codes requested. Wait a few minutes, then try again.' },
        { status: 429 }
      )
    }

    const learner = await getLearnerByEmail(email)
    if (learner) {
      const code = generateSignInCode()
      await storeSignInCode(email, code)

      const name = escapeHtml(String(learner.name || '').split(' ')[0] || 'there')
      await sendBrevoEmail(
        email,
        `Your Academy sign-in code: ${code}`,
        renderAcademyEmail(
          'Your sign-in code',
          `
            <p style="margin:0 0 12px;color:#5F5E5A;">Hi ${name}, enter this code in the tab where you asked for it:</p>
            <p style="font-size:30px;font-weight:700;letter-spacing:6px;margin:16px 0;color:#2C2C2A;">${code}</p>
            <p style="font-size:13px;color:#888780;margin:0;">It expires in ${TTL_MIN} minutes and can be used once. If you did not request it, ignore this email.</p>
          `
        ),
        true // skipBcc — a sign-in code is not a payment event
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Academy sign-in-code error:', error)
    return NextResponse.json({ error: 'Failed to send sign-in code' }, { status: 500 })
  }
}
