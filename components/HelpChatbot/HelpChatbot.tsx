'use client'

/**
 * Shared help chatbot widget — mounted per-surface (app/okr-ally/layout.tsx,
 * app/goal-ally/layout.tsx, app/layout.tsx for the marketing site), each
 * pointing at its own knowledge base via the `surface` prop (see
 * lib/helpChatbot/surfaces.ts, which this file deliberately does NOT import
 * — that module pulls in server-only clients, e.g. the Sanity client for the
 * website KB, that must never reach the client bundle).
 *
 * Self-contained styling (no dependency on the OKR Ally app's `_ui.tsx`
 * token module) using the palette already shared across the marketing site
 * and the app: charcoal #2C2C2A, muted #5F5E5A, cream #FAF8F5, gold/CTA
 * #633806, emerald #1D9E75.
 */

import { useEffect, useRef, useState } from 'react'

export type ChatbotSurface = 'okr_ally' | 'goal_ally' | 'website'

const SURFACE_LABEL: Record<ChatbotSurface, string> = {
  okr_ally: 'OKR Ally',
  goal_ally: 'Goal Ally',
  website: 'Subramaniam P G',
}

const COLOR = {
  charcoal: '#2C2C2A',
  muted: '#5F5E5A',
  cream: '#FAF8F5',
  gold: '#633806',
  emerald: '#1D9E75',
  hairline: '#E8E4DC',
  error: '#B91C1C',
}

interface Turn {
  role: 'user' | 'assistant'
  content: string
  /** Only meaningful on the latest assistant turn — drives the escalate
   *  offer. Older turns keep whatever they resolved to. */
  foundAnswer?: boolean
}

export default function HelpChatbot({
  surface,
  initialEmail = null,
}: {
  surface: ChatbotSurface
  /** Prefill for the escalate email field — pass the signed-in user's email
   *  on OKR Ally / Goal Ally; leave null on the website (no session). */
  initialEmail?: string | null
}) {
  const [open, setOpen] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [escalateEmail, setEscalateEmail] = useState(initialEmail ?? '')
  const [escalated, setEscalated] = useState(false)
  const [escalating, setEscalating] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [turns, busy])

  const label = SURFACE_LABEL[surface]
  const lastAssistant = [...turns].reverse().find((t) => t.role === 'assistant')
  const offerEscalate = lastAssistant && lastAssistant.foundAnswer === false && !escalated

  async function send() {
    const question = input.trim()
    if (!question || busy) return
    setInput('')
    setErr(null)
    setEscalated(false)
    const next: Turn[] = [...turns, { role: 'user', content: question }]
    setTurns(next)
    setBusy(true)
    try {
      const res = await fetch('/api/help-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ surface, messages: next.map((t) => ({ role: t.role, content: t.content })) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        // leave the user's question in the transcript — only the input was
        // cleared, and losing the question too on a transient failure is bad UX
        setErr(j.error || 'Something went wrong. Try again.')
        return
      }
      setTurns([
        ...next,
        {
          role: 'assistant',
          content: j.foundAnswer ? j.answer : "I couldn't find that in what I know here.",
          foundAnswer: j.foundAnswer,
        },
      ])
    } catch {
      setErr('Network problem. Try again.')
    } finally {
      setBusy(false)
    }
  }

  async function escalate() {
    const email = escalateEmail.trim()
    if (!email) {
      setErr('Enter your email so a reply can reach you.')
      return
    }
    const question = [...turns].reverse().find((t) => t.role === 'user')?.content ?? ''
    setEscalating(true)
    setErr(null)
    try {
      const res = await fetch('/api/help-chat/escalate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ surface, question, userEmail: email }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(j.error || 'Could not send that. Try again.')
        return
      }
      setEscalated(true)
    } catch {
      setErr('Network problem — nothing was sent.')
    } finally {
      setEscalating(false)
    }
  }

  return (
    <div style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 1000 }}>
      {open && (
        <div
          style={{
            width: 'min(380px, 92vw)',
            height: 'min(560px, 72vh)',
            background: '#fff',
            border: `1px solid ${COLOR.hairline}`,
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(44,44,42,.18)',
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter, Arial, sans-serif',
          }}
        >
          <div
            style={{
              padding: '14px 16px',
              background: COLOR.charcoal,
              color: '#fff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{label} help</div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close"
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: 0 }}
            >
              ×
            </button>
          </div>

          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 14, background: COLOR.cream }}>
            {turns.length === 0 && (
              <p style={{ fontSize: 13, color: COLOR.muted, lineHeight: 1.5 }}>
                Ask anything about {label} — I answer only from what&apos;s actually documented here.
              </p>
            )}
            {turns.map((t, i) => (
              <div
                key={i}
                style={{
                  margin: '0 0 10px',
                  display: 'flex',
                  justifyContent: t.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '85%',
                    padding: '9px 12px',
                    borderRadius: 12,
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    background: t.role === 'user' ? COLOR.emerald : '#fff',
                    color: t.role === 'user' ? '#fff' : COLOR.charcoal,
                    border: t.role === 'user' ? 'none' : `1px solid ${COLOR.hairline}`,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {t.content}
                </div>
              </div>
            ))}
            {busy && <p style={{ fontSize: 12.5, color: COLOR.muted }}>Thinking…</p>}
            {err && <p style={{ fontSize: 12.5, color: COLOR.error }}>{err}</p>}

            {offerEscalate && !escalating && (
              <div
                style={{
                  marginTop: 4,
                  padding: 12,
                  border: `1px solid ${COLOR.hairline}`,
                  borderRadius: 10,
                  background: '#fff',
                }}
              >
                <p style={{ fontSize: 12.5, color: COLOR.charcoal, margin: '0 0 8px', lineHeight: 1.5 }}>
                  Want me to send this question to Subramaniam directly?
                </p>
                <input
                  type="email"
                  value={escalateEmail}
                  onChange={(e) => setEscalateEmail(e.target.value)}
                  placeholder="you@email.com"
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    marginBottom: 8,
                    border: `1px solid ${COLOR.hairline}`,
                    borderRadius: 8,
                    fontSize: 13,
                    outline: 'none',
                  }}
                />
                <button
                  onClick={escalate}
                  style={{
                    background: COLOR.gold,
                    color: '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Send to Subramaniam
                </button>
              </div>
            )}
            {escalated && (
              <p style={{ fontSize: 12.5, color: COLOR.emerald, marginTop: 4 }}>
                Sent — a reply will reach {escalateEmail} directly.
              </p>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `1px solid ${COLOR.hairline}` }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send()
                }
              }}
              placeholder="Ask a question…"
              disabled={busy}
              style={{
                flex: 1,
                padding: '9px 12px',
                border: `1px solid ${COLOR.hairline}`,
                borderRadius: 8,
                fontSize: 13.5,
                outline: 'none',
              }}
            />
            <button
              onClick={send}
              disabled={busy || !input.trim()}
              style={{
                background: COLOR.emerald,
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                padding: '9px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: busy || !input.trim() ? 0.6 : 1,
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close help chat' : 'Open help chat'}
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: COLOR.gold,
          color: '#fff',
          border: 'none',
          boxShadow: '0 6px 20px rgba(44,44,42,.28)',
          cursor: 'pointer',
          fontSize: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginLeft: 'auto',
        }}
      >
        {open ? '×' : '?'}
      </button>
    </div>
  )
}
