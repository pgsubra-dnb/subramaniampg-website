'use client'

import { useState } from 'react'
import { AllyRow, Btn, ScoreInfographic, ShareCard, Stars, T, TONE_COLOR, CRITERIA_ORDER, scoreTone } from './_ui'

interface OkrOption {
  label: string
  objective: string
  key_results: { text: string; status: string; initiatives: { action: string; owning_team: string }[] }[]
  rationale: string
}

export interface FullReport {
  submissionId: string
  status: string
  objective: string
  krs: { text: string; initiatives?: string[] }[]
  createdAt: string
  emailed: boolean
  rating: number | null
  feedbackText: string | null
  review: {
    reviewId: string
    criteria_scores: { criterion: string; score: number; weight: number; rationale: string }[]
    overall_score: number
    objective_feedback: { what_works: string; what_to_improve: string }
    key_result_feedback: { kr_reference: string; what_works: string; what_to_improve: string }[]
    suggested_okr_options: OkrOption[]
  } | null
}

const card: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.hairline}`,
  borderRadius: 16,
  padding: 22,
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: T.gold,
          marginBottom: 8,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  )
}

function FB({ works, improve }: { works: string; improve: string }) {
  return (
    <div style={{ fontSize: 13.5, lineHeight: 1.6, color: T.muted }}>
      <p style={{ margin: '0 0 6px' }}>
        <strong style={{ color: T.emeraldDark }}>What works.</strong> {works}
      </p>
      <p style={{ margin: 0 }}>
        <strong style={{ color: T.gold }}>What to improve.</strong> {improve}
      </p>
    </div>
  )
}

export default function ReportScreen({
  report,
  onStartAnother,
  bookingUrl,
  substackUrl,
  linkedinUrl,
}: {
  report: FullReport
  onStartAnother: () => void
  bookingUrl: string | null
  substackUrl: string | null
  linkedinUrl: string | null
}) {
  const r = report.review
  const [rating, setRating] = useState(report.rating ?? 0)
  const [text, setText] = useState(report.feedbackText ?? '')
  const [saved, setSaved] = useState(report.rating != null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  if (!r) {
    return (
      <AllyRow>This review isn&apos;t ready yet. Try reopening it from your History in a moment.</AllyRow>
    )
  }

  const fresh = r.suggested_okr_options.find((o) => o.label === 'Fresh Rewrite')
  const refined = r.suggested_okr_options.find((o) => o.label === 'Refined Original')

  async function submitFeedback() {
    if (rating < 1) {
      setErr('Please pick a star rating — it&apos;s the one thing I ask for.')
      return
    }
    setSaving(true)
    setErr(null)
    try {
      const res = await fetch('/api/okr-ally/feedback', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ reviewId: r!.reviewId, rating, feedbackText: text.trim() || null }),
      })
      if (res.ok) setSaved(true)
      else setErr((await res.json()).error || 'Could not save that. Try again.')
    } catch {
      setErr('Network problem saving your rating.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <AllyRow>
        Done. Your OKR scored <strong>{r.overall_score.toFixed(1)} / 10</strong>. Here&apos;s the breakdown,
        the feedback, and two ways to tighten it.
      </AllyRow>

      {/* score infographic — ring + radar + legend (shared with the PDF) */}
      <div style={{ ...card, marginBottom: 18 }}>
        <ScoreInfographic overallScore={r.overall_score} criteria={r.criteria_scores} />
        <p style={{ fontSize: 12.5, color: T.muted, fontStyle: 'italic', marginTop: 12 }}>
          Based only on what you gave me — thin context means a thinner review.
        </p>
      </div>

      <div style={{ ...card, marginBottom: 18 }}>
        <Section title="Why each criterion scored the way it did">
          {CRITERIA_ORDER.map((name) => r.criteria_scores.find((c) => c.criterion === name))
            .filter((c): c is NonNullable<typeof c> => !!c)
            .map((c) => (
              <div key={c.criterion} style={{ marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: TONE_COLOR[scoreTone(c.score)] }}>
                  {c.criterion} &nbsp;<span>{c.score}/10</span>
                </div>
                <p style={{ fontSize: 13, color: T.muted, lineHeight: 1.55, margin: '2px 0 0' }}>{c.rationale}</p>
              </div>
            ))}
        </Section>

        <Section title="Objective">
          <FB works={r.objective_feedback.what_works} improve={r.objective_feedback.what_to_improve} />
        </Section>

        <Section title="Key Results">
          {r.key_result_feedback.map((f, i) => (
            <div key={i} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: T.charcoal, marginBottom: 3 }}>{f.kr_reference}</div>
              <FB works={f.what_works} improve={f.what_to_improve} />
            </div>
          ))}
        </Section>
      </div>

      {/* suggested options */}
      <div className="mb-5">
        {refined && <OptionCard option={refined} />}
        {fresh && <OptionCard option={fresh} featured />}
      </div>

      {/* download + email */}
      <div style={{ ...card, marginBottom: 18 }}>
        <p style={{ fontSize: 13.5, color: T.muted, margin: '0 0 12px' }}>
          {report.emailed
            ? "The full report is in your inbox as a PDF."
            : "Download the full report as a PDF below."}
        </p>
        <div className="flex gap-2">
          <a href={`/api/okr-ally/report/${report.submissionId}`} target="_blank" rel="noopener noreferrer">
            <Btn>Download PDF</Btn>
          </a>
          <Btn variant="ghost" onClick={onStartAnother}>
            Review another OKR
          </Btn>
        </div>
      </div>

      {/* rating (required) */}
      <div style={{ ...card, marginBottom: 18 }}>
        {saved ? (
          <>
            <div style={{ fontSize: 13.5, color: T.charcoal, marginBottom: 6 }}>
              Thanks — you rated this <Stars value={rating} readOnly />
            </div>
            <ExitLinks bookingUrl={bookingUrl} substackUrl={substackUrl} linkedinUrl={linkedinUrl} />
          </>
        ) : (
          <>
            <div style={{ fontSize: 13.5, color: T.charcoal, marginBottom: 8 }}>
              How useful was this review? <span style={{ color: T.muted }}>(a rating helps me improve — required)</span>
            </div>
            <Stars value={rating} onChange={setRating} />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 2000))}
              rows={3}
              placeholder="Anything else? (optional)"
              style={{
                width: '100%',
                marginTop: 10,
                padding: '10px 12px',
                border: `1px solid ${T.hairline}`,
                borderRadius: 8,
                font: 'inherit',
                fontSize: 13.5,
                color: T.charcoal,
                outline: 'none',
                resize: 'vertical',
              }}
            />
            {err && (
              <p style={{ fontSize: 12.5, color: '#B91C1C', margin: '6px 0 0' }} dangerouslySetInnerHTML={{ __html: err }} />
            )}
            <div className="mt-2">
              <Btn small onClick={submitFeedback} disabled={saving}>
                {saving ? 'Saving…' : 'Submit rating'}
              </Btn>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function OptionCard({ option, featured }: { option: OkrOption; featured?: boolean }) {
  const bg = featured ? T.emerald : T.cream
  const fg = featured ? '#fff' : T.charcoal
  const sub = featured ? 'rgba(255,255,255,.85)' : T.muted
  return (
    <div
      style={{
        background: bg,
        color: fg,
        border: featured ? 'none' : `1px solid ${T.hairline}`,
        borderRadius: 14,
        padding: 20,
        marginBottom: 12,
      }}
    >
      <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', opacity: 0.85 }}>
        {option.label}
      </div>
      <div style={{ fontFamily: 'var(--font-lora), serif', fontSize: 16, fontWeight: 600, margin: '6px 0 10px', lineHeight: 1.35 }}>
        {option.objective}
      </div>
      {option.key_results.map((kr, i) => (
        <div key={i} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 13.5, lineHeight: 1.45 }}>
            {i + 1}. {kr.text}{' '}
            <span style={{ fontSize: 11, opacity: 0.7 }}>[{kr.status}]</span>
          </div>
          {kr.initiatives.map((it, k) => (
            <div key={k} style={{ fontSize: 12.5, color: sub, marginLeft: 12 }}>
              – {it.action} <span style={{ opacity: 0.75 }}>({it.owning_team})</span>
            </div>
          ))}
        </div>
      ))}
      <p style={{ fontSize: 12.5, color: sub, marginTop: 10, lineHeight: 1.55 }}>
        <strong>Why.</strong> {option.rationale}
      </p>
    </div>
  )
}

function ExitLinks({
  bookingUrl,
  substackUrl,
  linkedinUrl,
}: {
  bookingUrl: string | null
  substackUrl: string | null
  linkedinUrl: string | null
}) {
  const link = (href: string, label: string) => (
    <a href={href} target="_blank" rel="noopener noreferrer" style={{ color: T.emeraldDark, fontWeight: 600, textDecoration: 'none' }}>
      {label}
    </a>
  )
  return (
    <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${T.hairline}`, fontSize: 13.5, lineHeight: 2 }}>
      <ShareCard />
      <div style={{ color: T.muted, margin: '14px 0 4px' }}>If you want to go further:</div>
      <div className="flex flex-col">
        {bookingUrl && link(bookingUrl, 'Book a conversation with PGS →')}
        {link('/work/okr-consulting', 'OKR consulting →')}
        {link('/assessment', 'Leadership Execution Scale Assessment →')}
        {substackUrl && link(substackUrl, 'Subscribe on Substack →')}
        {linkedinUrl && link(linkedinUrl, 'Connect on LinkedIn →')}
      </div>
    </div>
  )
}
