'use client'

import Image from 'next/image'
import { ReactNode, useEffect, useRef, useState } from 'react'

/** Design tokens from okr-ally-ui-mockup.html — the visual source of truth. */
export const T = {
  cream: '#FAF8F5',
  card: '#FFFFFF',
  charcoal: '#2C2C2A',
  muted: '#5F5E5A',
  hairline: '#E8E4DC',
  emerald: '#1D9E75',
  emeraldDark: '#0F6E56',
  emeraldTint: '#E1F5EE',
  emeraldBorder: '#CDEBE0',
  gold: '#633806',
  goldTint: '#FAEEDA',
  bubbleText: '#0D3D2F',
}

export const AVATAR = '/okr-ally/ally-avatar.png'

export function Page({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: T.cream, minHeight: '100vh' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '28px 24px 80px' }}>{children}</div>
    </div>
  )
}

export function TopBar({ right }: { right?: ReactNode }) {
  return (
    <div
      className="flex items-center justify-between mb-7 pb-4"
      style={{ borderBottom: `1px solid ${T.hairline}` }}
    >
      <div className="flex items-center gap-2">
        <div style={{ width: 30, height: 30, borderRadius: '50%', overflow: 'hidden', flexShrink: 0 }}>
          <Image src={AVATAR} alt="OKR Ally" width={30} height={30} />
        </div>
        <span style={{ fontFamily: 'var(--font-lora), serif', fontWeight: 600, color: T.charcoal, fontSize: 16 }}>
          OKR Ally
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: T.gold,
            background: T.goldTint,
            padding: '3px 8px',
            borderRadius: 20,
            marginLeft: 4,
          }}
        >
          Powered by AI
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm">{right}</div>
    </div>
  )
}

export function AllyRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 mb-4 items-end" style={{ animation: 'okraIn .35s ease both' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt="Ally" width={34} height={34} />
      </div>
      <div
        style={{
          background: T.emeraldTint,
          border: `1px solid ${T.emeraldBorder}`,
          borderRadius: '16px 16px 16px 4px',
          padding: '13px 17px',
          fontSize: 14.5,
          lineHeight: 1.55,
          maxWidth: 460,
          color: T.bubbleText,
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function UserRow({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-row-reverse gap-2.5 mb-4 items-end" style={{ animation: 'okraIn .35s ease both' }}>
      <div
        style={{
          background: T.emerald,
          color: '#fff',
          borderRadius: '16px 16px 4px 16px',
          padding: '13px 17px',
          fontSize: 14.5,
          lineHeight: 1.55,
          maxWidth: 460,
          whiteSpace: 'pre-wrap',
        }}
      >
        {children}
      </div>
    </div>
  )
}

export function Btn({
  children,
  onClick,
  disabled,
  variant = 'primary',
  type = 'button',
  small,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  small?: boolean
}) {
  const base: React.CSSProperties = {
    fontFamily: 'var(--font-inter), sans-serif',
    fontWeight: 600,
    fontSize: small ? 13 : 15,
    padding: small ? '8px 15px' : '12px 24px',
    borderRadius: 8,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: '1px solid transparent',
    opacity: disabled ? 0.5 : 1,
    transition: 'background .15s',
  }
  const styles: Record<string, React.CSSProperties> = {
    primary: { ...base, background: T.emerald, color: '#fff' },
    ghost: { ...base, background: 'transparent', color: T.emeraldDark, borderColor: T.hairline },
    danger: { ...base, background: 'transparent', color: '#9A3412', borderColor: '#F3D0BC' },
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={styles[variant]}>
      {children}
    </button>
  )
}

export function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max
  return (
    <span style={{ fontSize: 11.5, color: over ? '#B91C1C' : T.muted }}>
      {value.length} / {max}
    </span>
  )
}

export function Field({
  value,
  onChange,
  placeholder,
  max,
  multiline,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  max?: number
  multiline?: boolean
  autoFocus?: boolean
}) {
  const common: React.CSSProperties = {
    width: '100%',
    padding: '11px 13px',
    border: `1px solid ${T.hairline}`,
    borderRadius: 8,
    fontFamily: 'var(--font-inter), sans-serif',
    fontSize: 14,
    color: T.charcoal,
    background: T.card,
    outline: 'none',
    resize: multiline ? 'vertical' : 'none',
  }
  return multiline ? (
    <textarea
      autoFocus={autoFocus}
      rows={4}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(max ? e.target.value.slice(0, max + 40) : e.target.value)}
      style={common}
    />
  ) : (
    <input
      autoFocus={autoFocus}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(max ? e.target.value.slice(0, max + 40) : e.target.value)}
      style={common}
    />
  )
}

/** 0-10 score → band. Mirrors `scoreTone()` in lib/okrAllyReview.ts and the PDF. */
export type ScoreTone = 'low' | 'mid' | 'high'
export function scoreTone(score: number): ScoreTone {
  if (score < 4) return 'low'
  if (score < 7) return 'mid'
  return 'high'
}
export const TONE_COLOR: Record<ScoreTone, string> = {
  low: '#B91C1C',
  mid: T.gold,
  high: T.emerald,
}

// Score-radar treatment — a punchy emerald fill + a warm-grey grid, shared
// verbatim with the PDF (RADAR_FILL / RADAR_GRID in lib/okrAllyReport.ts) so
// the two surfaces don't drift.
export const RADAR_FILL = '#9FD9C7'
export const RADAR_GRID = '#B8B1A3'

/** Rubric criteria in canonical order — kept in sync with RUBRIC in lib/okrAllyReview.ts. */
export const CRITERIA_ORDER = [
  'Outcome vs Output',
  'Alignment',
  'Measurability',
  'Specificity',
  'Ambition vs Realism',
]

export function ScoreRing({
  score,
  size = 64,
  tone,
}: {
  score: number
  size?: number
  tone?: ScoreTone
}) {
  const r = size / 2 - size * 0.09
  const sw = size * 0.11
  const circ = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, score / 10))
  const color = TONE_COLOR[tone ?? scoreTone(score)]
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.hairline} strokeWidth={sw} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={sw}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-lora), serif',
          fontWeight: 600,
          fontSize: size / 3.4,
          color,
        }}
      >
        {score.toFixed(1)}
      </div>
    </div>
  )
}

export interface CriterionScore {
  criterion: string
  score: number
  weight: number
}

/**
 * The shared score infographic — an enlarged band-coloured overall ring, a
 * 5-axis radar over the rubric criteria, and a value legend. The generated
 * report PDF (lib/okrAllyReport.ts) draws the visually-matched version.
 */
export function ScoreInfographic({
  overallScore,
  criteria,
}: {
  overallScore: number
  criteria: CriterionScore[]
}) {
  const ordered = CRITERIA_ORDER.map(
    (name) => criteria.find((c) => c.criterion === name) ?? { criterion: name, score: 0, weight: 0 }
  )

  // radar geometry — viewBox is padded left/right so the axis labels
  // (which sit outside the pentagon) don't get clipped by the <svg> bounds.
  const cx = 120
  const cy = 100
  const R = 66
  const PAD_X = 52
  const ang = (i: number) => (-90 + i * 72) * (Math.PI / 180)
  const pt = (i: number, rad: number) => [cx + rad * Math.cos(ang(i)), cy + rad * Math.sin(ang(i))] as const
  const gridLevels = [2, 4, 6, 8, 10]
  const poly = (pts: readonly (readonly [number, number])[]) => pts.map((p) => p.join(',')).join(' ')
  const dataPts = ordered.map((c, i) => pt(i, R * Math.max(0, Math.min(1, c.score / 10))))

  return (
    <div>
      <div className="flex items-center gap-4" style={{ marginBottom: 6 }}>
        <ScoreRing score={overallScore} size={96} />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, color: T.charcoal }}>Overall score</div>
          <div style={{ fontSize: 12.5, color: T.muted }}>Weighted across the five criteria</div>
        </div>
      </div>

      <svg
        viewBox={`${-PAD_X} 12 ${240 + PAD_X * 2} 176`}
        width="100%"
        style={{ maxWidth: 400, display: 'block', margin: '6px auto 0' }}
      >
        {gridLevels.map((lvl) => (
          <polygon
            key={lvl}
            points={poly(ordered.map((_, i) => pt(i, (R * lvl) / 10)))}
            fill="none"
            stroke={RADAR_GRID}
            strokeWidth={lvl === 10 ? 1.6 : 1}
          />
        ))}
        {ordered.map((_, i) => {
          const [x, y] = pt(i, R)
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke={RADAR_GRID} strokeWidth={1} />
        })}
        <polygon
          points={poly(dataPts)}
          fill={RADAR_FILL}
          stroke={T.emeraldDark}
          strokeWidth={2.6}
          strokeLinejoin="round"
        />
        {dataPts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r={3.4} fill={T.emeraldDark} />
        ))}
        {ordered.map((c, i) => {
          const [x, y] = pt(i, R + 14)
          const cos = Math.cos(ang(i))
          const anchor = cos > 0.3 ? 'start' : cos < -0.3 ? 'end' : 'middle'
          const words = c.criterion.split(' ')
          const lines = words.length > 2 ? [words.slice(0, Math.ceil(words.length / 2)).join(' '), words.slice(Math.ceil(words.length / 2)).join(' ')] : [c.criterion]
          return (
            <text key={i} x={x} y={y} textAnchor={anchor} fontSize={10.5} fontWeight={600} fill={T.charcoal}>
              {lines.map((ln, k) => (
                <tspan key={k} x={x} dy={k === 0 ? 0 : 11}>
                  {ln}
                </tspan>
              ))}
            </text>
          )
        })}
      </svg>

      <div style={{ marginTop: 10 }}>
        {ordered.map((c) => {
          const color = TONE_COLOR[scoreTone(c.score)]
          return (
            <div
              key={c.criterion}
              className="flex items-center"
              style={{ fontSize: 12.5, padding: '5px 0', borderBottom: `1px solid ${T.hairline}` }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, marginRight: 8 }} />
              <span style={{ color: T.charcoal, flex: 1 }}>{c.criterion}</span>
              <span style={{ fontWeight: 700, color }}>{c.score}/10</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Client-side timed progress while the review generates. The /api/okr-ally/review
 * call is a single blocking request (~45-90s, no streaming), so the captions
 * advance on a timer that roughly tracks the real phases — a static screen for
 * that long reads as broken.
 */
const GENERATING_STEPS: { at: number; text: string }[] = [
  { at: 0, text: 'Reading your objective and the context you gave me…' },
  { at: 8000, text: 'Scoring it against the five rubric criteria…' },
  { at: 22000, text: 'Weighing each Key Result on its own…' },
  { at: 40000, text: 'Working through the Refined Original…' },
  { at: 58000, text: 'Drafting the Fresh Rewrite…' },
  { at: 76000, text: 'Almost there — putting your report together…' },
]

export function GeneratingIndicator() {
  const [idx, setIdx] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  useEffect(() => {
    timers.current = GENERATING_STEPS.slice(1).map((s, i) =>
      setTimeout(() => setIdx(i + 1), s.at)
    )
    return () => timers.current.forEach(clearTimeout)
  }, [])
  return (
    <div className="flex gap-2.5 mb-4 items-end" style={{ animation: 'okraIn .35s ease both' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt="Ally" width={34} height={34} />
      </div>
      <div
        style={{
          background: T.emeraldTint,
          border: `1px solid ${T.emeraldBorder}`,
          borderRadius: '16px 16px 16px 4px',
          padding: '13px 17px',
          fontSize: 14.5,
          lineHeight: 1.55,
          maxWidth: 460,
          color: T.bubbleText,
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ display: 'inline-flex', gap: 3 }}>
            {[0, 1, 2].map((n) => (
              <span
                key={n}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: T.emerald,
                  animation: `okraPulse 1.1s ease-in-out ${n * 0.18}s infinite`,
                }}
              />
            ))}
          </span>
          <span key={idx} style={{ animation: 'okraIn .3s ease both' }}>
            {GENERATING_STEPS[idx].text}
          </span>
        </div>
        <div style={{ fontSize: 12.5, color: T.muted, marginTop: 6 }}>
          This takes about a minute. You&apos;ll get it here and by email.
        </div>
      </div>
    </div>
  )
}

/** Thank-you + share prompt, shown on the exit block after rating and on the signed-out screen. */
export function ShareCard() {
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('https://subramaniampg.guru/okr-ally')
  useEffect(() => {
    if (typeof window !== 'undefined') setUrl(`${window.location.origin}/okr-ally`)
  }, [])

  const emailHref = `mailto:?subject=${encodeURIComponent('OKR Ally — a second pair of eyes on your OKRs')}&body=${encodeURIComponent(
    `I used OKR Ally to review an Objective and Key Results — it scores them against a clear rubric and rewrites them two ways. First review is free.\n\n${url}`
  )}`
  const linkedInHref = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`

  async function copy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard blocked — the email / LinkedIn options still work */
    }
  }

  const linkStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 600,
    color: T.emeraldDark,
    textDecoration: 'none',
    border: `1px solid ${T.hairline}`,
    borderRadius: 8,
    padding: '7px 12px',
    background: T.card,
    cursor: 'pointer',
  }

  return (
    <div>
      <div style={{ fontWeight: 700, fontSize: 14, color: T.charcoal }}>Thanks for spending time with Ally.</div>
      <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 10px' }}>
        Know someone whose OKRs could use a second pair of eyes?
      </p>
      <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
        <button type="button" onClick={copy} style={linkStyle}>
          {copied ? 'Copied ✓' : 'Copy link'}
        </button>
        <a href={emailHref} style={linkStyle}>
          Email it
        </a>
        <a href={linkedInHref} target="_blank" rel="noopener noreferrer" style={linkStyle}>
          Share on LinkedIn
        </a>
      </div>
    </div>
  )
}

export function Stars({
  value,
  onChange,
  readOnly,
}: {
  value: number
  onChange?: (v: number) => void
  readOnly?: boolean
}) {
  return (
    <span style={{ fontSize: 22, letterSpacing: 4, userSelect: 'none', display: 'inline-flex' }} role="radiogroup" aria-label="Rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          aria-checked={value === n}
          role="radio"
          onClick={readOnly ? undefined : () => onChange?.(n)}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            lineHeight: 1,
            cursor: readOnly ? 'default' : 'pointer',
            color: n <= value ? T.gold : T.hairline,
          }}
        >
          ★
        </button>
      ))}
    </span>
  )
}

export const keyframes = `@keyframes okraIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes okraPulse{0%,100%{opacity:.3;transform:scale(.8)}50%{opacity:1;transform:scale(1)}}`
