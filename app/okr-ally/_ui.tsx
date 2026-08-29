'use client'

import Image from 'next/image'
import { ReactNode } from 'react'

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

export function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = size / 2 - 5
  const circ = 2 * Math.PI * r
  const frac = Math.max(0, Math.min(1, score / 10))
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={T.hairline} strokeWidth={7} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={T.emerald}
          strokeWidth={7}
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
          fontSize: size / 4,
          color: T.emeraldDark,
        }}
      >
        {score.toFixed(1)}
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

export const keyframes = `@keyframes okraIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`
