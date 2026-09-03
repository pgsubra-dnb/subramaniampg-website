'use client'

import { useCallback, useEffect, useState } from 'react'
import { AllyRow, Btn, ScoreRing, Stars, T } from './_ui'
import { OptionCard, Section, type OkrOption } from './_report'
import { type Brand, DEFAULT_BRAND, vocab, reviewCount } from '@/lib/okrAllyBrand'

// ─── shared types (mirror lib/okrAllyAdmin.ts JSON) ─────────────────────

interface ListItem {
  submissionId: string
  objective: string
  userName: string
  userEmail: string
  companyName: string | null
  overallScore: number
  createdAt: string
  expertReviewCount: number
  emailStatus: 'none' | 'draft' | 'sent'
}

interface ListResponse {
  items: ListItem[]
  total: number
  page: number
  pageSize: number
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

const PAGE_SIZE = 20

export function AdminList({
  onOpen,
  brand = DEFAULT_BRAND,
}: {
  onOpen: (submissionId: string) => void
  brand?: Brand
}) {
  const [data, setData] = useState<ListResponse | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [company, setCompany] = useState('')
  const [email, setEmail] = useState('')
  const [page, setPage] = useState(1)

  // Debounce filter changes; reset to page 1 whenever a filter changes.
  const filterKey = `${q}|${company}|${email}`
  useEffect(() => {
    setPage(1)
  }, [filterKey])

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true)
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (company.trim()) params.set('company', company.trim())
      if (email.trim()) params.set('email', email.trim())
      params.set('page', String(page))
      params.set('pageSize', String(PAGE_SIZE))
      fetch(`/api/okr-ally/admin/reviews?${params}`)
        .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error || r.statusText))))
        .then((d: ListResponse) => {
          setData(d)
          setErr(null)
        })
        .catch((e) => setErr(String(e.message || e)))
        .finally(() => setLoading(false))
    }, 250)
    return () => clearTimeout(t)
  }, [q, company, email, page])

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const anyFilter = !!(q.trim() || company.trim() || email.trim())

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${T.hairline}`,
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
  }

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

  const showFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const showTo = Math.min(page * PAGE_SIZE, total)

  return (
    <div>
      <GrantCreditsPanel brand={brand} />

      <div style={{ fontSize: 12.5, color: T.muted, margin: '4px 0 10px' }}>
        Every completed review. Open one to add expert feedback and draft a follow-up note.
      </div>

      <div className="grid gap-2 mb-3" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        <input style={inputStyle} placeholder="Search objectives…" value={q} onChange={(e) => setQ(e.target.value)} />
        <input style={inputStyle} placeholder="Company name…" value={company} onChange={(e) => setCompany(e.target.value)} />
        <input style={inputStyle} placeholder="Email…" value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>

      {err ? (
        <AllyRow>Couldn&apos;t load the admin list: {err}</AllyRow>
      ) : loading && !data ? (
        <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>
      ) : items.length === 0 ? (
        <AllyRow>{anyFilter ? 'No reviews match those filters.' : 'No completed reviews yet.'}</AllyRow>
      ) : (
        <>
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
                opacity: loading ? 0.6 : 1,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div style={{ fontSize: 13.5, color: T.charcoal, lineHeight: 1.4 }}>{i.objective}</div>
                <div
                  style={{
                    flexShrink: 0,
                    fontFamily: 'var(--font-inter), sans-serif',
                    fontWeight: 700,
                    color: T.emeraldDark,
                    fontSize: 15,
                  }}
                >
                  {i.overallScore.toFixed(1)}
                </div>
              </div>
              <div style={{ fontSize: 11.5, color: T.muted, margin: '5px 0 8px' }}>
                {i.userName} · {i.userEmail}
                {i.companyName ? ` · ${i.companyName}` : ''} · {fmtDate(i.createdAt)}
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

          <div className="flex items-center justify-between" style={{ marginTop: 6, fontSize: 12.5, color: T.muted }}>
            <span>
              {showFrom}–{showTo} of {total}
            </span>
            <div className="flex items-center gap-2">
              <Btn small variant="ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1 || loading}>
                ← Prev
              </Btn>
              <span>
                {page} / {pageCount}
              </span>
              <Btn
                small
                variant="ghost"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={page >= pageCount || loading}
              >
                Next →
              </Btn>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════════
//  Manual credit grant
// ══════════════════════════════════════════════════════════════════════

function GrantCreditsPanel({ brand = DEFAULT_BRAND }: { brand?: Brand }) {
  const v = vocab(brand)
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [credits, setCredits] = useState('1')
  const [note, setNote] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'warn' | 'err'; text: string } | null>(null)

  async function grant() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/okr-ally/admin/grant-credits', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), credits: Number(credits), note: note.trim() || undefined, brand }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: j.error || 'Grant failed.' })
        return
      }
      const base = `${reviewCount(brand, Number(credits))} added to ${j.recipientEmail}. Balance now ${j.creditsRemaining}. ${
        j.emailed ? 'They have been emailed.' : 'Note: the notification email did not send.'
      }`
      setMsg({ kind: j.warning ? 'warn' : 'ok', text: j.warning ? `${base} ${j.warning}` : base })
      setEmail('')
      setCredits('1')
      setNote('')
    } catch {
      setMsg({ kind: 'err', text: 'Network problem — nothing was granted.' })
    } finally {
      setBusy(false)
    }
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '8px 10px',
    border: `1px solid ${T.hairline}`,
    borderRadius: 8,
    fontSize: 13,
    outline: 'none',
  }

  return (
    <div style={{ border: `1px solid ${T.hairline}`, borderRadius: 12, padding: 14, marginBottom: 14, background: T.card }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{ background: 'none', border: 'none', color: T.emeraldDark, fontWeight: 700, cursor: 'pointer', fontSize: 13, padding: 0 }}
      >
        {open ? '▾' : '▸'} Grant {v.reviews} to an account
      </button>
      {open && (
        <div style={{ marginTop: 12 }}>
          <div className="grid gap-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
            <input style={inputStyle} placeholder="account email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <input
              style={inputStyle}
              type="number"
              min={1}
              max={100}
              placeholder="how many"
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
            />
          </div>
          <input
            style={{ ...inputStyle, marginTop: 8 }}
            placeholder="note (optional — kept for the record, shown to them)"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <div style={{ marginTop: 10 }}>
            <Btn small onClick={grant} disabled={busy || !email.trim() || !credits}>
              {busy ? 'Granting…' : `Grant ${v.reviews}`}
            </Btn>
          </div>
          <p style={{ fontSize: 11.5, color: T.muted, marginTop: 8 }}>
            The recipient is always emailed. The account must have signed in at least once.
          </p>
          {msg && (
            <p
              style={{
                fontSize: 12.5,
                marginTop: 8,
                color: msg.kind === 'err' ? T.error : msg.kind === 'warn' ? T.gold : T.emeraldDark,
              }}
            >
              {msg.text}
            </p>
          )}
        </div>
      )}
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
  // per-option: 'unsaved' (never saved) | 'dirty' (saved, then edited) | 'saved'
  const [panelStatus, setPanelStatus] = useState<Record<string, 'unsaved' | 'dirty' | 'saved'>>({})

  const load = useCallback(() => {
    fetch(`/api/okr-ally/admin/review/${submissionId}`)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error || r.statusText))))
      .then((d: AdminReview) => {
        setData(d)
        setPanelStatus(
          Object.fromEntries(
            d.review.suggestedOkrOptions.map((o) => [
              o.label,
              d.expertReviews.some((e) => e.okrOptionLabel === o.label) ? 'saved' : 'unsaved',
            ])
          )
        )
      })
      .catch((e) => setErr(String(e.message || e)))
  }, [submissionId])

  useEffect(load, [load])

  if (err) return <AllyRow>Couldn&apos;t load this review: {err}</AllyRow>
  if (!data) return <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>

  const labels = data.review.suggestedOkrOptions.map((o) => o.label)
  const savedCount = labels.filter((l) => panelStatus[l] === 'saved').length
  const bothSaved = savedCount === labels.length
  const unsavedLabels = labels.filter((l) => panelStatus[l] !== 'saved')
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

      {/* progress banner — each panel saves on its own */}
      <div
        style={{
          border: `1px solid ${bothSaved ? T.emeraldBorder : T.warningBorder}`,
          background: bothSaved ? T.emeraldTint : T.goldTint,
          borderRadius: 12,
          padding: '10px 14px',
          marginBottom: 14,
          fontSize: 12.5,
          color: bothSaved ? T.emeraldDark : T.gold,
          lineHeight: 1.5,
        }}
      >
        Each option below has its own <strong>Save</strong> button. <strong>{savedCount} of {labels.length} saved.</strong>
        {!bothSaved && unsavedLabels.length > 0 && (
          <>
            {' '}
            Still to save: <strong>{unsavedLabels.join(' and ')}</strong>.
          </>
        )}
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
            status={panelStatus[opt.label] ?? 'unsaved'}
            onStatusChange={(s) => setPanelStatus((prev) => ({ ...prev, [opt.label]: s }))}
          />
        </div>
      ))}

      <ImprovementEmailPanel
        reviewId={data.reviewId}
        userEmail={data.userEmail}
        enabled={bothSaved}
        missingLabels={unsavedLabels}
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

function StatusPill({ status }: { status: 'unsaved' | 'dirty' | 'saved' }) {
  const map = {
    saved: { text: '✓ Saved', color: T.emeraldDark, bg: T.emeraldTint },
    dirty: { text: '● Unsaved edits', color: T.gold, bg: T.goldTint },
    unsaved: { text: '● Not saved yet', color: T.gold, bg: T.goldTint },
  } as const
  const s = map[status]
  return (
    <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20, color: s.color, background: s.bg }}>
      {s.text}
    </span>
  )
}

function ExpertPanel({
  reviewId,
  label,
  criteria,
  existing,
  status,
  onStatusChange,
}: {
  reviewId: string
  label: string
  criteria: string[]
  existing: ExpertReview | null
  status: 'unsaved' | 'dirty' | 'saved'
  onStatusChange: (s: 'unsaved' | 'dirty' | 'saved') => void
}) {
  const [notes, setNotes] = useState<Record<string, string>>(existing?.rubricFeedback ?? {})
  const [general, setGeneral] = useState(existing?.generalFeedback ?? '')
  const [rating, setRating] = useState(existing?.expertRating ?? 0)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Any edit after a save flips the parent's badge to "unsaved edits".
  const touch = () => {
    if (status === 'saved') onStatusChange('dirty')
  }

  const hasWrittenFeedback =
    Object.values(notes).some((v) => v.trim()) || general.trim().length > 0

  async function save() {
    if (rating < 1) {
      setErr('Pick an expert rating (1–5) for this option.')
      return
    }
    if (!hasWrittenFeedback) {
      setErr('Write at least one note (a criterion note or the general field) before saving this option.')
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
        onStatusChange('saved')
      } else {
        setErr((await res.json().catch(() => ({}))).error || `Save failed (${res.status}).`)
      }
    } catch {
      setErr('Network problem saving — nothing was saved. Try again.')
    } finally {
      setBusy(false)
    }
  }

  const unsaved = status !== 'saved'

  return (
    <div
      style={{
        border: `1px solid ${unsaved ? T.warningBorder : T.hairline}`,
        borderTop: 'none',
        borderRadius: '0 0 14px 14px',
        padding: 16,
        marginTop: -12,
        background: T.card,
      }}
    >
      <div className="flex items-center justify-between" style={{ marginBottom: 10 }}>
        <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.gold }}>
          Your feedback on “{label}”
        </span>
        <StatusPill status={status} />
      </div>
      {criteria.map((c) => (
        <div key={c} style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: T.charcoal }}>{c}</label>
          <textarea
            rows={2}
            value={notes[c] ?? ''}
            onChange={(e) => {
              setNotes((n) => ({ ...n, [c]: e.target.value.slice(0, 1500) }))
              touch()
            }}
            style={{ ...areaStyle, marginTop: 2 }}
          />
        </div>
      ))}
      <div style={{ marginBottom: 8 }}>
        <label style={{ fontSize: 12, fontWeight: 600, color: T.charcoal }}>General feedback on this option</label>
        <textarea
          rows={3}
          value={general}
          onChange={(e) => {
            setGeneral(e.target.value.slice(0, 4500))
            touch()
          }}
          style={{ ...areaStyle, marginTop: 2 }}
        />
      </div>
      <div className="flex items-center gap-3" style={{ marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.charcoal }}>Expert rating</span>
        <Stars
          value={rating}
          onChange={(v) => {
            setRating(v)
            touch()
          }}
        />
      </div>
      {err && <p style={{ fontSize: 12, color: T.error, margin: '0 0 6px' }}>{err}</p>}
      <div className="flex items-center gap-3">
        <Btn small onClick={save} disabled={busy}>
          {busy ? 'Saving…' : status === 'saved' ? `Update “${label}”` : `Save “${label}”`}
        </Btn>
        {status === 'saved' && !busy && <span style={{ fontSize: 12, color: T.emeraldDark }}>Saved ✓</span>}
        {status === 'dirty' && !busy && <span style={{ fontSize: 12, color: T.gold }}>Edited — save again</span>}
      </div>
    </div>
  )
}

// ─── improvement email ────────────────────────────────────────────────

function ImprovementEmailPanel({
  reviewId,
  userEmail,
  enabled,
  missingLabels,
  initial,
  onChanged,
}: {
  reviewId: string
  userEmail: string
  enabled: boolean
  missingLabels: string[]
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
        <p style={{ fontSize: 13, color: T.gold }}>
          {missingLabels.length >= 2
            ? 'Save your feedback on both options above to draft the follow-up note.'
            : missingLabels.length === 1
              ? `Still need your saved feedback on “${missingLabels[0]}” — scroll up and press its Save button.`
              : 'Save your feedback on both options above to draft the follow-up note.'}
        </p>
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
        <p style={{ fontSize: 12.5, margin: '8px 0 0', color: msg.kind === 'ok' ? T.emeraldDark : T.error }}>{msg.text}</p>
      )}
    </div>
  )
}
