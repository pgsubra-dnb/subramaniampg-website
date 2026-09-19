import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { SURFACES } from '@/lib/helpChatbot/surfaces'
import { isChatbotSurface } from '@/lib/helpChatbot/types'
import { allow } from '@/lib/okrAllyRateLimit'

export const dynamic = 'force-dynamic'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const WINDOW_MS = 60 * 60 * 1000
const MAX_PER_IP = 20
const MAX_PER_EMAIL = 8

/**
 * The chatbot's no-answer fallback: email PGS with the user cc'd, so a
 * normal reply-all reaches both. If the asker is signed in (OKR Ally / Goal
 * Ally), their session email is used and can't be overridden by the request
 * body — the website surface has no session, so it takes the typed email.
 */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!allow(`help-chat-escalate:ip:${ip}`, MAX_PER_IP, WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const surface = body.surface
  if (!isChatbotSurface(surface)) {
    return NextResponse.json({ error: 'Unknown surface.' }, { status: 400 })
  }
  const question = typeof body.question === 'string' ? body.question.trim().slice(0, 2000) : ''
  if (!question) {
    return NextResponse.json({ error: 'A question is required.' }, { status: 400 })
  }

  const sessionUser = await getSessionUser(req)
  const email = sessionUser?.email || (typeof body.userEmail === 'string' ? body.userEmail.trim().toLowerCase() : '')
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 })
  }
  if (!allow(`help-chat-escalate:email:${email}`, MAX_PER_EMAIL, WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many requests from this email. Try again later.' }, { status: 429 })
  }

  const cfg = SURFACES[surface]
  const sent = await sendBrevoEmail({
    to: cfg.routingEmail,
    toName: 'Subramaniam P G',
    subject: `Help chat — no answer found (${cfg.productName})`,
    htmlContent: `
      <div style="font-family:Inter,Arial,sans-serif;line-height:1.6;">
        <p>The ${cfg.productName} help chatbot couldn't answer this from its knowledge base:</p>
        <p style="background:#f5f2ea;padding:12px 14px;border-radius:8px;white-space:pre-wrap;">${question
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')}</p>
        <p>Asked by: ${email}${sessionUser ? ' (signed in)' : ' (typed, not signed in)'}</p>
        <p style="font-size:13px;color:#5F5E5A;">Reply-all reaches ${email} directly.</p>
      </div>`,
    textContent:
      `The ${cfg.productName} help chatbot couldn't answer this from its knowledge base:\n\n"${question}"\n\n` +
      `Asked by: ${email}${sessionUser ? ' (signed in)' : ' (typed, not signed in)'}\n` +
      `Reply-all reaches ${email} directly.`,
    cc: [{ email }],
    skipBcc: true,
  })

  if (!sent) {
    return NextResponse.json({ error: 'Could not send that right now. Try again in a moment.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
