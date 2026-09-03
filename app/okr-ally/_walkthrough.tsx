'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import { T, Btn, AVATAR } from './_ui'
import { type Brand, DEFAULT_BRAND, vocab, type BrandVocab } from '@/lib/okrAllyBrand'

/**
 * Reusable slideshow used for three walkthroughs:
 *  - "How <Product> works" — opened from the intro screen before sign-in.
 *  - Org-admin — shown once on the first Company-tab visit, revisitable.
 *  - Employee — shown once when an org member first reaches the context screens.
 *
 * `Carousel` is the shared shell (dots, nav, keyboard, framing, Ally caption
 * bubble). Slides are `shot` (a product screenshot + caption), `note` (a short
 * headed message) or `cta` (the "How it works" closer with its own button).
 * Entirely static — no API calls.
 *
 * All copy + the screenshot set are branded off `lib/okrAllyBrand.ts`: the
 * "How it works" shots come from `/okr-ally/walkthrough/*` or
 * `/goal-ally/walkthrough/*` (two captured sets of the same flow), and every
 * caption / heading reads in the brand's vocabulary.
 */

type Shot = {
  kind: 'shot'
  img: string
  alt: string
  caption: string
}
type Note = { kind: 'note'; heading: string; body: string }
type Cta = { kind: 'cta'; heading: string; body: string }
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

/** "How <Product> works" — the pre-sign-in product tour. `slug` selects the
 *  captured screenshot set (`okr-ally` | `goal-ally`); every caption reads in
 *  the brand's vocabulary. */
function howItWorks(v: BrandVocab): Slide[] {
  const slug = v.path.slice(1) // 'okr-ally' | 'goal-ally'
  const pair = v.key === 'okr_ally' ? 'an Objective and its Key Results' : 'a Goal and its Sub-goals'
  return [
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/01-intro.png`,
      alt: `The ${v.product} intro screen`,
      caption: `This is the front door. Bring the ${v.objective} and ${v.krPlural} you've already drafted — I don't write them from scratch. I score them against a fixed five-part rubric, tell you honestly what's working and what isn't, and hand back two rewrites. Your first review is free.`,
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/02-signin.png`,
      alt: 'The email sign-in step',
      caption: `First, your email. I send a one-time 6-digit code — no password to set or remember. It's how your reviews, ${v.reviews} and saved context stay tied to you between visits.`,
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/03-context-company.png`,
      alt: 'The first context question — about your company',
      caption:
        "Once you're in, a couple of quick basics — your name, your company — then three context questions. First: what your company does, who it serves, how big it is. The more detail here, the sharper the review, and I save it to your profile so you only write it once.",
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/04-context-business.png`,
      alt: 'The second context question — where the company is right now',
      caption: `Next, where the company is right now — its strategic direction, the challenges it's facing, the openings it sees, and the trends around it. Answer whichever of these matter to your ${v.objectiveLower}. This is the context that lets me judge whether your ${v.plan} is aimed at what actually counts this quarter.`,
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/05-context-role.png`,
      alt: 'The third context question — your own role',
      caption:
        "The last context question is your own role — what you're accountable for, and what you can and can't directly move. If any answer along the way is too thin to work with, I ask one focused follow-up before we continue. Answering these well is usually what lifts a review from generic to genuinely useful.",
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/06-objective.png`,
      alt: `Entering the ${v.objective}`,
      caption: `Now the ${v.objective} — one sentence naming the outcome you want by the end of the cycle, not an activity or a direction of travel. Send me the one you already drafted.`,
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/07-key-results.png`,
      alt: `Entering the ${v.krPlural}`,
      caption: `Then one to six ${v.krPlural}, each a measurable result in baseline-and-target form: a metric, where it starts, where you want it, and by when. You can add a few initiatives under any ${v.krShort}.`,
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/08-confirm.png`,
      alt: 'The confirm screen before submitting',
      caption: `One last look at everything I'm about to review — every line is still editable here. Then submit: one review, one ${v.review}, and it runs. A failed generation refunds automatically.`,
    },
    {
      kind: 'shot',
      img: `/${slug}/walkthrough/09-report.png`,
      alt: 'The report: score, criteria breakdown, feedback, and two rewrites',
      caption: `At the end you get an overall score, how it breaks down across the five criteria, what works and what to tighten on the ${v.objective} and every ${v.krShort}, and two full rewrites — one that repairs your draft, one built fresh from the outcome. It's on screen and in your inbox as a PDF.`,
    },
    {
      kind: 'cta',
      heading: "That's the whole conversation.",
      body: `Bring ${pair}, plus a few minutes for the context questions. I'll take it from there.`,
    },
  ]
}

function orgAdmin(v: BrandVocab): Slide[] {
  return [
    {
      kind: 'note',
      heading: `The ${v.review} pool`,
      body: `Your company bought a pool of ${v.reviews}. This tab shows how many were purchased, how many you've handed out, and how many are still available. The pool is the company's — it's tracked completely separately from anyone's personal ${v.reviews} and never touches them.`,
    },
    {
      kind: 'note',
      heading: `Handing ${v.reviews} to your team`,
      body: `Allocate any number of ${v.reviews} to a teammate by email. If they don't have an account yet, allocating creates one and emails them. Their reviews spend company ${v.reviews} first, and only fall back to personal ${v.reviews} once yours run out. You can reclaim whatever a person hasn't spent back into the pool at any time.`,
    },
    {
      kind: 'note',
      heading: 'Set the company context — and publish it',
      body: 'Everyone on your team runs their review on the company and business context you write here — they can\'t change it. Nothing goes live until you press "Confirm and publish". Until you do, no one on the team can submit a review, so set this up first. Republishing later applies to future reviews only; reviews already run keep the context they were run with.',
    },
    {
      kind: 'note',
      heading: 'Seeing usage',
      body: `The usage report shows, per person, what you allocated, what they've used on reviews, what's been reclaimed, and what's left — and gives you a PDF. Every figure is scoped to your company and is independent of that person's own ${v.product} account.`,
    },
  ]
}

function employee(v: BrandVocab): Slide[] {
  return [
    {
      kind: 'note',
      heading: 'Your company sets part of the context',
      body: "Your company admin has written the company and business context once, for the whole team. You'll see it as you go, but it's read-only — that's deliberate, so every review at your company runs on the same footing. You don't need to write it.",
    },
    {
      kind: 'note',
      heading: 'Your role is yours',
      body: "The one context question that's yours to answer is your own role — what you're accountable for, and what you can and can't directly move. Fill it in as fully as you can; alongside the company context, it's what makes the review specific to you rather than generic.",
    },
    {
      kind: 'note',
      heading: 'Everything else is the same',
      body: `From there it works exactly as it does for anyone: your ${v.objective}, your ${v.krPlural}, a confirm screen, then a scored report with feedback and two rewrites — on screen and in your inbox. Your company ${v.reviews} are spent first.`,
    },
  ]
}

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
