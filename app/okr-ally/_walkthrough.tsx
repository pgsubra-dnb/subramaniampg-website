'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { T, Btn, AVATAR } from './_ui'

/**
 * "How it works" — a slideshow the visitor can open from the intro screen,
 * before signing in. Every slide is a real product screenshot (captured into
 * public/okr-ally/walkthrough/ against the live deployed flow) and the slides
 * follow the exact order a user experiences: intro → sign-in → the three
 * context questions → Objective → Key Results → confirm → report.
 *
 * Entirely static — no API calls, no video, no external assets.
 */

type Shot = {
  kind: 'shot'
  img: string
  w: number
  h: number
  alt: string
  caption: string
}
type Cta = { kind: 'cta'; heading: string; body: string }
type Slide = Shot | Cta

const SLIDES: Slide[] = [
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/01-intro.png',
    w: 1284,
    h: 1392,
    alt: 'The OKR Ally intro screen',
    caption:
      "This is the front door. Bring the Objective and Key Results you've already drafted — I don't write them from scratch. I score them against a fixed five-part rubric, tell you honestly what's working and what isn't, and hand back two rewrites. Your first review is free.",
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/02-signin.png',
    w: 1284,
    h: 604,
    alt: 'The email sign-in step',
    caption:
      "First, your email. I send a one-time sign-in link — no password to set or remember. It's how your reviews, credits and saved context stay tied to you between visits.",
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/03-context-company.png',
    w: 1284,
    h: 838,
    alt: 'The first context question — about your company',
    caption:
      'Once you\'re in, a couple of quick basics — your name, your company — then three context questions. First: what your company does, who it serves, how big it is. The more detail here, the sharper the review, and I save it to your profile so you only write it once.',
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/04-context-business.png',
    w: 1284,
    h: 842,
    alt: 'The second context question — where the company is right now',
    caption:
      'Next, where the company is right now — its strategic direction, the challenges it\'s facing, the openings it sees, and the trends around it. Answer whichever of these matter to your objective. This is the context that lets me judge whether your OKR is aimed at what actually counts this quarter.',
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/05-role-followup.png',
    w: 1284,
    h: 720,
    alt: 'The third context question, with Ally asking a follow-up',
    caption:
      "The last context question is your own role — what you're accountable for, and what you can and can't directly move. If any answer is too thin to work with, I ask one focused follow-up before we continue. You can always Skip, but answering is usually what lifts a review from generic to genuinely useful.",
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/06-objective.png',
    w: 1284,
    h: 574,
    alt: 'Entering the Objective',
    caption:
      'Now the Objective — one sentence naming the outcome you want by the end of the cycle, not an activity or a direction of travel. Send me the one you already drafted.',
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/07-key-results.png',
    w: 1284,
    h: 836,
    alt: 'Entering the Key Results',
    caption:
      'Then one to six Key Results, each a measurable result in baseline-and-target form: a metric, where it starts, where you want it, and by when. You can add a few initiatives under any Key Result.',
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/08-confirm.png',
    w: 1284,
    h: 2118,
    alt: 'The confirm screen before submitting',
    caption:
      "One last look at everything I'm about to review — every line is still editable here. Then submit: one review, one credit, and it runs. A failed generation refunds automatically.",
  },
  {
    kind: 'shot',
    img: '/okr-ally/walkthrough/09-report.png',
    w: 1284,
    h: 5366,
    alt: 'The report: score, criteria breakdown, feedback, and two rewrites',
    caption:
      "At the end you get an overall score, how it breaks down across the five criteria, what works and what to tighten on the Objective and every Key Result, and two full rewrites — one that repairs your draft, one built fresh from the outcome. It's on screen and in your inbox as a PDF.",
  },
  {
    kind: 'cta',
    heading: "That's the whole conversation.",
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
