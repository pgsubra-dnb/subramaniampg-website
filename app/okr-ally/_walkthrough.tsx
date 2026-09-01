'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { T, Btn, AVATAR } from './_ui'

/**
 * "How it works" — a slideshow the visitor can open from the intro screen,
 * before signing in. Real product screenshots (captured into
 * public/okr-ally/walkthrough/) walk the flow end to end; the last few slides
 * are before/after pairs that make the "write with more detail" point concrete.
 *
 * Entirely static — no API calls, no video, no external assets. Caption and
 * comparison copy is a first draft in Ally's voice, meant to be edited here.
 */

type Shot = {
  kind: 'shot'
  img: string
  w: number
  h: number
  alt: string
  caption: string
}
type Compare = {
  kind: 'compare'
  heading: string
  /** optional context line shown above the two cards (e.g. the question being answered) */
  inAnswerTo?: string
  worse: { label: string; text: string }
  better: { label: string; text: string }
  caption: string
}
type Cta = { kind: 'cta'; heading: string; body: string }
type Slide = Shot | Compare | Cta

const SLIDES: Slide[] = [
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/01-intro.png',
    w: 1284,
    h: 1520,
    alt: 'The OKR Ally intro screen',
    caption:
      "This is the front door. Bring the Objective and Key Results you've already drafted — I don't write them from scratch. I score them against a fixed five-part rubric, tell you honestly what's working and what isn't, and hand back two rewrites. Your first review is free.",
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/02-context.png',
    w: 1284,
    h: 958,
    alt: 'Answering the company-context question, with a worked example typed in',
    caption:
      'First I ask about your company, how the objective ladders up, and your own role. Detail is everything here — the more specific you are, the sharper my review. This is what a strong company answer looks like: what you do, who you serve, your size and stage, all in a few lines.',
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/03-clarify.png',
    w: 1284,
    h: 886,
    alt: 'Ally asking a follow-up question when an answer is too thin',
    caption:
      "If an answer is too thin to work with, I ask one focused follow-up before we move on. You can always Skip — but answering it is usually what lifts a review from generic to genuinely useful.",
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/04-report.png',
    w: 1284,
    h: 3280,
    alt: 'The report screen: score ring, criteria radar, feedback, and two rewrites',
    caption:
      "At the end you get an overall score, a breakdown across all five criteria, what works and what to tighten on the objective and every Key Result, and two full rewrites — one that repairs your draft, one built fresh from the outcome. It's on screen and in your inbox as a PDF.",
  },
  {
    kind: 'compare',
    heading: 'A weak Objective vs a strong one',
    worse: { label: 'Weaker', text: 'Improve the customer onboarding experience.' },
    better: {
      label: 'Stronger',
      text: 'New customers reach first value on their own, without needing to contact support.',
    },
    caption:
      'An Objective names the outcome you want — the state of the world once you’ve succeeded — not an activity or a direction of travel. "Improve" is a direction. The stronger version says what is actually different when the quarter goes well.',
  },
  {
    kind: 'compare',
    heading: 'A thin business-context answer vs a full one',
    inAnswerTo:
      "“How does this objective connect to your organisation's broader goals or priorities, and what impact is it meant to have?”",
    worse: { label: 'Thin', text: "It's one of our company priorities this quarter." },
    better: {
      label: 'Full',
      text: 'Our board goal for the year is to lift net revenue retention from 104% to 115%. The biggest lever is getting customers onto our compliance module — they renew at nearly double the rate. This objective is meant to make that module the default, not an add-on people discover late.',
    },
    caption:
      'The full answer tells me which company goal your objective ladders up to, the mechanism you’re betting on, and the impact you expect. That is what lets me judge whether your Key Results measure the thing that actually matters.',
  },
  {
    kind: 'compare',
    heading: 'A vague Key Result vs a specified one',
    worse: { label: 'Vague', text: 'Significantly increase customer satisfaction.' },
    better: { label: 'Specified', text: 'Raise onboarding NPS from 32 to 45 by 31 March.' },
    caption:
      'A Key Result needs a metric, a starting point, a target and a date. Without the baseline I can’t tell whether your target is ambitious or trivial — and nor can your team in week six.',
  },
  {
    kind: 'cta',
    heading: "That's the whole loop.",
    body: "Bring an Objective and its Key Results, plus a few minutes for the context questions. I'll take it from there.",
  },
]

export default function Walkthrough({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  const [idx, setIdx] = useState(0)
  const last = SLIDES.length - 1
  const slide = SLIDES[idx]

  const go = useCallback(
    (d: number) => setIdx((i) => Math.max(0, Math.min(last, i + d))),
    [last]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
      else if (e.key === 'Escape') onBack()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, onBack])

  return (
    <div style={{ animation: 'okraIn .3s ease both' }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
        <button
          onClick={onBack}
          style={{ background: 'none', border: 'none', color: T.emeraldDark, fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: 0 }}
        >
          ← Back
        </button>
        <span style={{ fontSize: 12, color: T.muted }}>
          {idx + 1} / {SLIDES.length}
        </span>
      </div>

      <h1
        style={{
          fontFamily: 'var(--font-lora), serif',
          fontSize: 20,
          fontWeight: 600,
          color: T.charcoal,
          margin: '0 0 14px',
        }}
      >
        How OKR Ally works
      </h1>

      <div style={{ minHeight: 420 }}>
        {slide.kind === 'shot' && <ShotView key={idx} slide={slide} />}
        {slide.kind === 'compare' && <CompareView key={idx} slide={slide} />}
        {slide.kind === 'cta' && <CtaView key={idx} slide={slide} onStart={onStart} />}
      </div>

      <Dots idx={idx} count={SLIDES.length} onDot={setIdx} />

      <div className="flex items-center justify-between" style={{ marginTop: 16 }}>
        <Btn variant="ghost" onClick={() => go(-1)} disabled={idx === 0}>
          Back
        </Btn>
        {idx !== last && <Btn onClick={() => go(1)}>Next</Btn>}
      </div>
    </div>
  )
}

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
      <div style={{ maxHeight: 430, overflowY: 'auto' }}>{children}</div>
    </div>
  )
}

function ShotView({ slide }: { slide: Shot }) {
  return (
    <div style={{ animation: 'okraIn .3s ease both' }}>
      <Frame>
        <Image
          src={slide.img}
          alt={slide.alt}
          width={slide.w}
          height={slide.h}
          sizes="(max-width: 640px) 100vw, 592px"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        />
      </Frame>
      <CaptionBubble>{slide.caption}</CaptionBubble>
    </div>
  )
}

function CompareView({ slide }: { slide: Compare }) {
  return (
    <div style={{ animation: 'okraIn .3s ease both' }}>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 17, fontWeight: 600, color: T.charcoal, margin: '0 0 6px' }}>
        {slide.heading}
      </h2>
      {slide.inAnswerTo && (
        <p style={{ fontSize: 12.5, color: T.muted, fontStyle: 'italic', margin: '0 0 12px', lineHeight: 1.5 }}>
          In answer to: {slide.inAnswerTo}
        </p>
      )}
      <div className="flex" style={{ gap: 12, flexWrap: 'wrap', marginTop: slide.inAnswerTo ? 0 : 6 }}>
        <CompareCard tone="worse" label={slide.worse.label} text={slide.worse.text} />
        <CompareCard tone="better" label={slide.better.label} text={slide.better.text} />
      </div>
      <CaptionBubble>{slide.caption}</CaptionBubble>
    </div>
  )
}

function CompareCard({ tone, label, text }: { tone: 'worse' | 'better'; label: string; text: string }) {
  const better = tone === 'better'
  return (
    <div
      style={{
        flex: '1 1 220px',
        border: `1px solid ${better ? T.emeraldBorder : '#F0D9D9'}`,
        background: better ? T.emeraldTint : '#FBF1F1',
        borderRadius: 12,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 700,
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          color: better ? T.emeraldDark : '#A23B3B',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 13.5, lineHeight: 1.5, color: T.charcoal }}>{text}</div>
    </div>
  )
}

function CtaView({ slide, onStart }: { slide: Cta; onStart: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '28px 0', animation: 'okraIn .3s ease both' }}>
      <div style={{ width: 68, height: 68, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 16px', border: `3px solid ${T.emerald}` }}>
        <Image src={AVATAR} alt="OKR Ally" width={68} height={68} />
      </div>
      <h2 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 20, fontWeight: 600, color: T.charcoal, margin: 0 }}>
        {slide.heading}
      </h2>
      <p style={{ color: T.muted, marginTop: 10, lineHeight: 1.6, maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', fontSize: 14 }}>
        {slide.body}
      </p>
      <div style={{ marginTop: 20 }}>
        <Btn onClick={onStart}>Start my free review</Btn>
      </div>
      <p style={{ marginTop: 10, fontSize: 12.5, color: T.muted }}>Your first review is free.</p>
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
