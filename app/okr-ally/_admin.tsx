'use client'

import { useCallback, useEffect, useState } from 'react'
import { AllyRow, Btn, ScoreRing, Stars, T } from './_ui'
import { OptionCard, Section, type OkrOption } from './_report'

// ─── shared types (mirror lib/okrAllyAdmin.ts JSON) ─────────────────────

interface ListItem {
  submissionId: string
  objective: string
  userName: string
  userEmail: string
  overallScore: number
  createdAt: string
  expertReviewCount: number
  emailStatus: 'none' | 'draft' | 'sent'
}

interface CtxField {
  raw_input?: string
  final_text?: string
  clarifying_question?: string | null
  clarifying_answer?: string | null
}

interface ExpertReview {
  okrOptionLabel: string
  rubricFeedback: Record<string, string>
  generalFeedback: string | null
  expertRating: number
}

interface AdminReview {
  submissionId: string
  reviewId: string
  userName: string
  userEmail: string
  createdAt: string
  objective: string
  krs: { text: string; initiatives?: string[] }[]
  contextSnapshot: {
    company_context?: CtxField
    business_context?: CtxField
    role_context?: CtxField
  }
  review: {
    criteriaScores: { criterion: string; score: number; weight: number; rationale: string }[]
    overallScore: number
    objectiveFeedback: { what_works: string; what_to_improve: string }
    keyResultFeedback: { kr_reference: string; what_works: string; what_to_improve: string }[]
    suggestedOkrOptions: OkrOption[]
  }
  expertReviews: ExpertReview[]
  email: { draftText: string; finalText: string | null; sentAt: string | null } | null
  rubricCriteria: string[]
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

const areaStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  border: `1px solid ${T.hairline}`,
  borderRadius: 8,
  font: 'inherit',
  fontSize: 13.5,
  color: T.charcoal,
  outline: 'none',
  resize: 'vertical',
}

// ══════════════════════════════════════════════════════════════════════
//  Admin tab — list of every completed review
// ══════════════════════════════════════════════════════════════════════

export function AdminList({ onOpen }: { onOpen: (submissionId: string) => void }) {
  const [items, setItems] = useState<ListItem[] | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/okr-ally/admin/reviews')
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error || r.statusText))))
      .then((d) => setItems(d.items ?? []))
      .catch((e) => setErr(String(e.message || e)))
  }, [])

  if (err) return <AllyRow>Couldn&apos;t load the admin list: {err}</AllyRow>
  if (!items) return <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>
  if (items.length === 0) return <AllyRow>No completed reviews yet.</AllyRow>

  const chip = (text: string, tone: 'muted' | 'gold' | 'emerald') => (
    <span
      style={{
        fontSize: 11,
        fontWeight: 600,
        padding: '2px 7px',
        borderRadius: 20,
        color: tone === 'muted' ? T.muted : tone === 'gold' ? T.gold : T.emeraldDark,
        background: tone === 'muted' ? T.cream : tone === 'gold' ? T.goldTint : T.emeraldTint,
      }}
    >
      {text}
    </span>
  )

  return (
    <div>
      <div style={{ fontSize: 12.5, color: T.muted, marginBottom: 12 }}>
        Every completed review. Open one to add expert feedback and draft a follow-up note.
      </div>
      {items.map((i) => (
        <button
          key={i.submissionId}
          onClick={() => onOpen(i.submissionId)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: T.card,
            border: `1px solid ${T.hairline}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            cursor: 'pointer',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div style={{ fontSize: 13.5, color: T.charcoal, lineHeight: 1.4 }}>{i.objective}</div>
            <div
              style={{
                flexShrink: 0,
                fontFamily: 'var(--font-lora), serif',
                fontWeight: 700,
                color: T.emeraldDark,
                fontSize: 15,
              }}
            >
              {i.overallScore.toFixed(1)}
            </div>
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, margin: '5px 0 8px' }}>
            {i.userName} · {i.userEmail} · {fmtDate(i.createdAt)}
          </div>
          <div className="flex gap-1.5">
            {chip(
              `✎ ${i.expertReviewCount}/2`,
              i.expertReviewCount === 2 ? 'emerald' : i.expertReviewCount === 1 ? 'gold' : 'muted'
            )}
            {chip(
              i.emailStatus === 'sent' ? '✉ sent' : i.emailStatus === 'draft' ? '✉ draft' : '✉ —',
              i.emailStatus === 'sent' ? 'emerald' : i.emailStatus === 'draft' ? 'gold' : 'muted'
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  Admin review screen
// ══════════════════════════════════════════════════════════════════════

export function AdminReviewScreen({
  submissionId,
  onBack,
}: {
  submissionId: string
  onBack: () => void
}) {
  const [data, setData] = useState<AdminReview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [savedLabels, setSavedLabels] = useState<Set<string>>(new Set())

  const load = useCallback(() => {
    fetch(`/api/okr-ally/admin/review/${submissionId}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error || r.statusText))))
      .then((d: AdminReview) => {
        setData(d)
        setSavedLabels(new Set(d.expertReviews.map((e) => e.okrOptionLabel)))
      })
      .catch((e) => setErr(String(e.message || e)))
  }, [submissionId])

  useEffect(load, [load])

  if (err) return <AllyRow>Couldn&apos;t load this review: {err}</AllyRow>
  if (!data) return <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>

  const bothSaved = savedLabels.has('Refined Original') && savedLabels.has('Fresh Rewrite')
  const ctx = data.contextSnapshot

  const ctxBlock = (label: string, f?: CtxField) => {
    const final = (f?.final_text || f?.raw_input || '').trim() || '(not provided)'
    const raw = (f?.raw_input || '').trim()
    const differs = raw && f?.final_text && raw !== f.final_text.trim()
    return (
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.gold }}>
          {label}
        </div>
        <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, margin: '2px 0 0', whiteSpace: 'pre-wrap' }}>{final}</p>
        {f?.clarifying_question && f?.clarifying_answer && (
          <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 0', fontStyle: 'italic' }}>
            Q: {f.clarifying_question} — A: {f.clarifying_answer}
          </p>
        )}
        {differs && <RawToggle raw={raw} />}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={onBack}
        style={{ background: 'none', border: 'none', color: T.emeraldDark, fontWeight: 600, cursor: 'pointer', fontSize: 13, marginBottom: 12, padding: 0 }}
      >
        ← All reviews
      </button>

      {/* header */}
      <div className="flex items-center gap-4" style={{ marginBottom: 16 }}>
        <ScoreRing score={data.review.overallScore} size={64} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14.5, color: T.charcoal }}>{data.userName}</div>
          <div style={{ fontSize: 12.5, color: T.muted }}>
            {data.userEmail} · {fmtDate(data.createdAt)}
          </div>
        </div>
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 16, padding: 20, marginBottom: 16 }}>
        <Section title="Submitted, verbatim">
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.gold }}>
            Objective
          </div>
          <p style={{ fontSize: 13.5, color: T.charcoal, lineHeight: 1.5, margin: '2px 0 10px', whiteSpace: 'pre-wrap' }}>
            {data.objective}
          </p>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.gold }}>
            Key Results
          </div>
          {data.krs.map((kr, i) => (
            <div key={i} style={{ fontSize: 13.5, color: T.charcoal, lineHeight: 1.5, marginTop: 4 }}>
              {i + 1}. {kr.text}
              {kr.initiatives?.map((it, k) => (
                <div key={k} style={{ fontSize: 12.5, color: T.muted, marginLeft: 14 }}>
                  – {it}
                </div>
              ))}
            </div>
          ))}
        </Section>

        <Section title="Context provided">
          {ctxBlock('Company', ctx.company_context)}
          {ctxBlock('Business', ctx.business_context)}
          {ctxBlock('Your role', ctx.role_context)}
        </Section>

        <Section title="The automated review">
          {data.review.criteriaScores.map((c) => (
            <div key={c.criterion} style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.charcoal }}>
                {c.criterion} · {c.score}/10
              </div>
              <p style={{ fontSize: 12.5, color: T.muted, lineHeight: 1.5, margin: '1px 0 0' }}>{c.rationale}</p>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
            <strong style={{ color: T.emeraldDark }}>Objective — works.</strong> {data.review.objectiveFeedback.what_works}
            <br />
            <strong style={{ color: T.gold }}>Objective — improve.</strong>{' '}
            {data.review.objectiveFeedback.what_to_improve}
          </div>
          {data.review.keyResultFeedback.map((f, i) => (
            <div key={i} style={{ marginTop: 6, fontSize: 12.5, color: T.muted, lineHeight: 1.55 }}>
              <strong style={{ color: T.charcoal }}>{f.kr_reference}</strong> — {f.what_works} <em>Improve:</em>{' '}
              {f.what_to_improve}
            </div>
          ))}
        </Section>
      </div>

      {/* per-option panels */}
      {data.review.suggestedOkrOptions.map((opt) => (
        <div key={opt.label} style={{ marginBottom: 18 }}>
          <OptionCard option={opt} featured={opt.label === 'Fresh Rewrite'} />
          <ExpertPanel
            reviewId={data.reviewId}
            label={opt.label}
            criteria={data.rubricCriteria}
            existing={data.expertReviews.find((e) => e.okrOptionLabel === opt.label) ?? null}
            onSaved={() => setSavedLabels((s) => new Set(s).add(opt.label))}
          />
        </div>
      ))}

      <ImprovementEmailPanel
        reviewId={data.reviewId}
        userEmail={data.userEmail}
        enabled={bothSaved}
        initial={data.email}
        onChanged={load}
      />
    </div>
  )
}

function RawToggle({ raw }: { raw: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 3 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: 'none', border: 'none', color: T.emeraldDark, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', padding: 0 }}
      >
        {open ? 'hide original' : 'show what they typed'}
      </button>
      {open && (
        <p style={{ fontSize: 12, color: T.muted, lineHeight: 1.5, margin: '2px 0 0', whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
          {raw}
        </p>
      )}
    </div>
  )
}

// ─── one option's feedback form ────────────────────────────────────────

function ExpertPanel({
  reviewId,
  label,
  criteria,
  existing,
  onSaved,
}: {
  reviewId: string
  label: string
  criteria: string[]
  existing: ExpertReview | null
  onSaved: () => void
}) {
  const [notes, setNotes] = useState<Record<string, string>>(existing?.rubricFeedback ?? {})
  const [general, setGeneral] = useState(existing?.generalFeedback ?? '')
  const [rating, setRating] = useState(existing?.expertRating ?? 0)
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState<'idle' | 'saved' | 'error'>(existing ? 'saved' : 'idle')
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    if (rating < 1) {
      setErr('Pick an expert rating (1–5).')
      return
    }
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/okr-ally/admin/expert-review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          okrOptionLabel: label,
          rubricFeedback: notes,
          generalFeedback: general.trim() || null,
          expertRating: rating,
        }),
      })
      if (res.ok) {
        setState('saved')
        onSaved()
      } else {
        setState('error')
        setErr((await res.json()).error || 'Save failed')
      }
    } catch {
      setState('error')
      setErr('Network problem saving.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      style={{
        border: `1px solid ${T.hairline}`,
        borderTop: 'none',
        borderRadius: '0 0 14px 14px',
        padding: 16,
        marginTop: -12,
        background: T.card,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.gold, marginBottom: 8 }}>
        Your feedback on “{label}”
      </div>
      {criteria.map((c) => (
        <div key={c} style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.charcoal }}>{c}</label>
          <textarea
            rows={2}
            value={notes[c] ?? ''}
            onChange={(e) => setNotes((n) => ({ ...n, [c]: e.target.value.slice(0, 1500) }))}
            style={{ ...areaStyle, marginTop: 2 }}
          />
        </div>
      ))}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: T.charcoal }}>General feedback on this option</label>
        <textarea rows={3} value={general} onChange={(e) => setGeneral(e.target.value.slice(0, 4500))} style={{ ...areaStyle, marginTop: 2 }} />
      </div>
      <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.charcoal }}>Expert rating</span>
        <Stars value={rating} onChange={setRating} />
      </div>
      {err && <p style={{ fontSize: 12, color: '#B91C1C', margin: '0 0 6px' }}>{err}</p>}
      <div className="flex items-center gap-3">
        <Btn small onClick={save} disabled={busy}>
          {busy ? 'Saving…' : state === 'saved' ? 'Update' : 'Save'}
        </Btn>
        {state === 'saved' && !busy && <span style={{ fontSize: 12, color: T.emeraldDark }}>Saved ✓</span>}
      </div>
    </div>
  )
}

// ─── improvement email ────────────────────────────────────────────────

function ImprovementEmailPanel({
  reviewId,
  userEmail,
  enabled,
  initial,
  onChanged,
}: {
  reviewId: string
  userEmail: string
  enabled: boolean
  initial: { draftText: string; finalText: string | null; sentAt: string | null } | null
  onChanged: () => void
}) {
  const [text, setText] = useState(initial?.finalText ?? initial?.draftText ?? '')
  const [hasDraft, setHasDraft] = useState(!!initial)
  const [sentAt, setSentAt] = useState(initial?.sentAt ?? null)
  const [busy, setBusy] = useState<'gen' | 'save' | 'send' | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function act(action: 'generate' | 'save' | 'send') {
    if (action === 'generate' && hasDraft && !confirm('Replace the current draft? Your edits will be lost.')) return
    setBusy(action === 'generate' ? 'gen' : action)
    setMsg(null)
    try {
      const res = await fetch('/api/okr-ally/admin/improvement-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, reviewId, finalText: text }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: j.error || 'Something went wrong.' })
        return
      }
      if (action === 'generate') {
        setText(j.draft)
        setHasDraft(true)
        setMsg({ kind: 'ok', text: 'Draft ready — edit it below, then send.' })
      } else if (action === 'save') {
        setMsg({ kind: 'ok', text: 'Draft saved.' })
      } else {
        setSentAt(j.sentAt || new Date().toISOString())
        setMsg({ kind: 'ok', text: `Sent to ${userEmail}.` })
      }
      onChanged()
    } catch {
      setMsg({ kind: 'err', text: 'Network problem.' })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 16, padding: 20 }}>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.gold, marginBottom: 6 }}>
        Improvement email
      </div>
      {sentAt ? (
        <p style={{ fontSize: 13, color: T.emeraldDark }}>
          Sent to {userEmail} on {fmtDate(sentAt)}.
        </p>
      ) : !enabled ? (
        <p style={{ fontSize: 13, color: T.muted }}>Save your feedback on both options to draft the follow-up note.</p>
      ) : (
        <>
          <p style={{ fontSize: 12.5, color: T.muted, margin: '0 0 10px' }}>
            Claude drafts this from your notes, in your voice, as added commentary — no score or rating referenced. Edit
            before sending. Goes to <strong style={{ color: T.charcoal }}>{userEmail}</strong>.
          </p>
          {!hasDraft ? (
            <Btn small onClick={() => act('generate')} disabled={busy !== null}>
              {busy === 'gen' ? 'Drafting…' : 'Draft improvement email'}
            </Btn>
          ) : (
            <>
              <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} style={areaStyle} />
              <div className="flex items-center gap-2" style={{ marginTop: 10, flexWrap: 'wrap' }}>
                <Btn small onClick={() => act('send')} disabled={busy !== null || !text.trim()}>
                  {busy === 'send' ? 'Sending…' : `Send to ${userEmail}`}
                </Btn>
                <Btn small variant="ghost" onClick={() => act('save')} disabled={busy !== null}>
                  {busy === 'save' ? 'Saving…' : 'Save draft'}
                </Btn>
                <Btn small variant="ghost" onClick={() => act('generate')} disabled={busy !== null}>
                  {busy === 'gen' ? 'Drafting…' : 'Re-draft'}
                </Btn>
              </div>
            </>
          )}
        </>
      )}
      {msg && (
        <p style={{ fontSize: 12.5, margin: '8px 0 0', color: msg.kind === 'ok' ? T.emeraldDark : '#B91C1C' }}>{msg.text}</p>
      )}
    </div>
  )
}
