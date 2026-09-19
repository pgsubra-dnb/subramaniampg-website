'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { T, Btn, AVATAR } from './_ui'
import { type Brand, DEFAULT_BRAND, vocab } from '@/lib/okrAllyBrand'
import { howItWorks, orgAdmin, employee, type Shot, type Note, type Cta } from '@/lib/okrAllyHelpContent'

/**
 * Reusable slideshow used for three walkthroughs:
 *  - "How <Product> works" — opened from the intro screen before sign-in.
 *  - Org-admin — shown once on the first Company-tab visit, revisitable.
 *  - Employee — shown once when an org member first reaches the context screens.
 *
 * `Carousel` is the shared shell (dots, nav, keyboard, framing, Ally caption
 * bubble). Slides are `shot` (a product screenshot + caption), `note` (a short
 * headed message) or `cta` (the "How it works" closer with its own button) —
 * the slide DATA (howItWorks/orgAdmin/employee) lives in
 * lib/okrAllyHelpContent.ts, shared with the help chatbot's knowledge base.
 * This file is purely the rendering shell — entirely static, no API calls.
 *
 * All copy + the screenshot set are branded off `lib/okrAllyBrand.ts`: the
 * "How it works" shots come from `/okr-ally/walkthrough/*` or
 * `/goal-ally/walkthrough/*` (two captured sets of the same flow), and every
 * caption / heading reads in the brand's vocabulary.
 */

type Slide = Shot | Note | Cta

// ─── shared shell ─────────────────────────────────────────────────────────

function Carousel({
  title,
  slides,
  brand,
  onDismiss,
  dismissLabel = '← Back',
  doneLabel = 'Got it',
  ctaAction,
}: {
  title: string
  slides: Slide[]
  brand: Brand
  onDismiss: () => void
  dismissLabel?: string
  doneLabel?: string
  ctaAction?: () => void
}) {
  const [idx, setIdx] = useState(0)
  const last = slides.length - 1
  const slide = slides[idx]

  const go = useCallback((d: number) => setIdx((i) => Math.max(0, Math.min(last, i + d))), [last])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onDismiss()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onDismiss])

  return (
    <div style={{ animation: 'okraIn .3s ease both' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <button
          onClick={onDismiss}
          style={{ background: 'none', border: 'none', color: T.emeraldDark, fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          {dismissLabel}
        </button>
        <span style={{ fontSize: 12, color: T.muted }}>
          {idx + 1} / {slides.length}
        </span>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: 20,
          fontWeight: 600,
          color: T.charcoal,
          margin: '0 0 14px',
        }}
      >
        {title}
      </h1>

      <div style={{ minHeight: 320 }}>
        {slide.kind === 'shot' && <ShotView key={idx} slide={slide} />}
        {slide.kind === 'note' && <NoteView key={idx} slide={slide} />}
        {slide.kind === 'cta' && <CtaView key={idx} slide={slide} brand={brand} onAction={ctaAction} />}
      </div>

      <Dots idx={idx} count={slides.length} onDot={setIdx} />

      <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
        <Btn variant="ghost" onClick={() => go(-1)} disabled={idx === 0}>
          Back
        </Btn>
        {idx !== last ? (
          <Btn onClick={() => go(1)}>Next</Btn>
        ) : slide.kind !== 'cta' ? (
          <Btn onClick={onDismiss}>{doneLabel}</Btn>
        ) : null}
      </div>
    </div>
  )
}

// ─── the three walkthroughs (branded) ─────────────────────────────────────
// Slide DATA (howItWorks/orgAdmin/employee) now lives in
// lib/okrAllyHelpContent.ts, imported above — this file only renders it.

export default function Walkthrough({
  brand = DEFAULT_BRAND,
  onBack,
  onStart,
}: {
  brand?: Brand
  onBack: () => void
  onStart: () => void
}) {
  const v = vocab(brand)
  return (
    <Carousel
      title={`How ${v.product} works`}
      slides={howItWorks(v)}
      brand={brand}
      onDismiss={onBack}
      ctaAction={onStart}
    />
  )
}

export function OrgAdminWalkthrough({ brand = DEFAULT_BRAND, onClose }: { brand?: Brand; onClose: () => void }) {
  const v = vocab(brand)
  return (
    <Carousel
      title={`Running ${v.product} for your company`}
      slides={orgAdmin(v)}
      brand={brand}
      onDismiss={onClose}
      dismissLabel="← Close"
    />
  )
}

export function EmployeeWalkthrough({ brand = DEFAULT_BRAND, onClose }: { brand?: Brand; onClose: () => void }) {
  const v = vocab(brand)
  return (
    <Carousel
      title={`${v.product} at your company`}
      slides={employee(v)}
      brand={brand}
      onDismiss={onClose}
      dismissLabel="← Close"
    />
  )
}

// ─── slide renderers ──────────────────────────────────────────────────────

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        border: `1px solid ${T.hairline}`,
        borderRadius: 14,
        overflow: 'hidden',
        background: T.cream,
      }}
    >
      {/* Fixed height (not max-height): the screenshot <img> loads lazily and
          would otherwise reflow the carousel as it paints, making the nav
          buttons "unstable". A fixed viewport keeps the layout still and the
          image scrolls within it. */}
      <div style={{ height: 430, overflowY: 'auto' }}>{children}</div>
    </div>
  )
}

function ShotView({ slide }: { slide: Shot }) {
  return (
    <div style={{ animation: 'okraIn .3s ease both' }}>
      <Frame>
        {/* Static in-app screenshots — a plain <img> keeps `height:auto` honest
            regardless of the PNG's intrinsic size, so the okr-ally and goal-ally
            captures (which differ slightly in height) both render undistorted. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={slide.img}
          alt={slide.alt}
          loading="lazy"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Frame>
      <CaptionBubble>{slide.caption}</CaptionBubble>
    </div>
  )
}

function NoteView({ slide }: { slide: Note }) {
  return (
    <div style={{ animation: 'okraIn .3s ease both', padding: '8px 0' }}>
      <h2
        style={{
          fontFamily: 'var(--font-inter), sans-serif',
          fontSize: 18,
          fontWeight: 600,
          color: T.charcoal,
          margin: '0 0 4px',
        }}
      >
        {slide.heading}
      </h2>
      <CaptionBubble>{slide.body}</CaptionBubble>
    </div>
  )
}

function CtaView({ slide, brand, onAction }: { slide: Cta; brand: Brand; onAction?: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0', animation: 'okraIn .3s ease both' }}>
      <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: `3px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt={vocab(brand).product} width={68} height={68} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-inter), sans-serif', fontSize: 20, fontWeight: 600, color: T.charcoal, margin: 0 }}>
        {slide.heading}
      </h2>
      <p style={{ color: T.muted, marginTop: 10, lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', fontSize: 14 }}>
        {slide.body}
      </p>
      {onAction && (
        <>
          <div style={{ marginTop: 20 }}>
            <Btn onClick={onAction}>Start my free review</Btn>
          </div>
          <p style={{ marginTop: 10, fontSize: 12.5, color: T.muted }}>Your first review is free.</p>
        </>
      )}
    </div>
  )
}

function CaptionBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start" style={{ marginTop: 14 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: `2px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt="Ally" width={32} height={32} />
      </div>
      <div
        style={{
          background: T.emeraldTint,
          border: `1px solid ${T.emeraldBorder}`,
          borderRadius: '16px 16px 16px 4px',
          padding: '12px 16px',
          fontSize: 14,
          lineHeight: 1.55,
          color: T.bubbleText,
        }}
      >
        {children}
      </div>
    </div>
  )
}

function Dots({ idx, count, onDot }: { idx: number; count: number; onDot: (i: number) => void }) {
  return (
    <div className="flex justify-center" style={{ gap: 7, marginTop: 16 }}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          aria-label={`Go to slide ${i + 1}`}
          onClick={() => onDot(i)}
          style={{
            width: i === idx ? 20 : 7,
            height: 7,
            borderRadius: 4,
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            background: i === idx ? T.emerald : T.hairline,
            transition: 'width .2s, background .2s',
          }}
        />
      ))}
    </div>
  )
}
