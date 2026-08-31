'use client'

import { useMemo, useState } from 'react'
import { AllyRow, T } from './_ui'

/**
 * In-app Help — written in Ally's first-person voice, grouped by topic, with
 * purely client-side search. No API calls: the content lives in TOPICS below.
 */

type QA = { q: string; a: string }
type Topic = { id: string; title: string; blurb: string; items: QA[] }

const TOPICS: Topic[] = [
  {
    id: 'scoring',
    title: 'How scoring works',
    blurb: 'What the number means, and how I get to it.',
    items: [
      {
        q: 'Why not just use Claude or ChatGPT for this?',
        a: "You can absolutely paste your OKR into a general AI chatbot and ask it to critique it. What you'd get back would be generic, though, since a general assistant has no fixed standard to score you against. I score every OKR against the same five-criteria rubric every time, the same one from Subramaniam's own consulting practice and his book, so your result is comparable across different objectives and different quarters. I also ask follow-up questions when your context is thin, generate a formal PDF report you can keep, and for reviews that come in below a certain quality, Subramaniam himself sometimes adds his own note directly. A general chatbot can't do any of that consistently, because it isn't built around one person's specific coaching standard.",
      },
      {
        q: 'How do you score my OKR?',
        a: "I read your objective, key results and initiatives together with the context you gave me, then score five things: Outcome vs Output, Alignment, Measurability, Specificity, and Ambition vs Realism. Each gets a 0–10 with a short reason. Your overall score is a weighted blend of the five — Outcome vs Output and Alignment count for the most, because an OKR that measures activity or points nowhere is the most common way these go wrong.",
      },
      {
        q: 'What does the score actually mean?',
        a: "It's a read on how well the OKR is written — not a verdict on your strategy or your team. A lower score means I found room to tighten the wording, sharpen the measures, or reconnect the objective to the bigger picture. The report tells you exactly where.",
      },
      {
        q: 'Why did my score change after I edited one line?',
        a: 'The five criteria interact. Rewriting a key result into clear baseline-and-target form can lift Measurability and Specificity at the same time, and that moves the weighted total.',
      },
      {
        q: 'Do you compare me to other companies?',
        a: "No. I judge only what you wrote, plus the context you gave me. I don't pull in outside knowledge about your industry or your competitors, and I don't invent detail.",
      },
      {
        q: 'What are the two options in my report?',
        a: 'I give you two rewrites. The refined version stays close to your original and fixes it in place. The fresh version rebuilds the OKR from the outcome up. Take whichever fits, or borrow from both.',
      },
      {
        q: 'Can I see the review again later?',
        a: 'Yes. Every completed review — with its score, both rewrites and the PDF — stays in your History tab.',
      },
    ],
  },
  {
    id: 'credits',
    title: 'Credit packs',
    blurb: 'Buying reviews, invoices, and coupons.',
    items: [
      {
        q: 'How do credits work?',
        a: 'One credit buys one full review. You buy credits in packs from the Pricing & Plans tab, and each review you submit spends one.',
      },
      {
        q: 'What do the packs cost?',
        a: 'A single review is ₹50, a 5-pack is ₹125, and a 10-pack is ₹200 — all plus 18% GST. The larger packs bring the price per review down.',
      },
      {
        q: 'Do credits expire?',
        a: "No. They stay in your account until you use them.",
      },
      {
        q: 'Do I get an invoice?',
        a: 'Yes. Every purchase generates a GST invoice. It is emailed to you and also listed in your History tab, where you can download it again any time.',
      },
      {
        q: 'I have a coupon code.',
        a: 'Enter it on the Pricing & Plans tab before you pay. Percentage-off coupons apply to pack purchases, and each coupon can be used once per account.',
      },
      {
        q: 'My payment went through but I have no credits.',
        a: 'Give it a moment and refresh — the confirmation can lag by a few seconds. If the credits still are not there, email pgs@embiggen.co.in with your payment reference and it will be sorted out.',
      },
    ],
  },
  {
    id: 'free-review',
    title: 'The free first review',
    blurb: 'Your first review is on the house.',
    items: [
      {
        q: 'Is my first review really free?',
        a: 'Yes — your first review is free, once per account. It is the full review, not a cut-down version.',
      },
      {
        q: 'How do I claim it?',
        a: "You don't need a code. When you have no credits and you are still eligible, I apply the free review automatically the moment you submit.",
      },
      {
        q: 'It charged me a credit instead.',
        a: 'The free review is a one-time thing per account. If you have already used it, later reviews need a credit. If you believe that is wrong, email pgs@embiggen.co.in.',
      },
      {
        q: 'Does the free review still get an invoice?',
        a: 'Yes. A GST invoice is generated even when the amount is ₹0, and it is emailed to you like any other.',
      },
    ],
  },
  {
    id: 'personal-review',
    title: 'When PGS reviews your OKR himself',
    blurb: 'The occasional personal note on top of my review.',
    items: [
      {
        q: 'I got an email from PGS about my OKR.',
        a: "Sometimes PGS reads a review personally and sends you a short note in his own words — a second pair of eyes on top of mine. It is commentary and suggestions, never a score or a grade.",
      },
      {
        q: 'Can I ask for a personal review?',
        a: "There is no formal request flow for that yet. If you want PGS's direct input, book a conversation with him — the link is on your report — or email pgs@embiggen.co.in.",
      },
      {
        q: 'Who can see what I submit?',
        a: 'Your submissions are visible to PGS, as the person behind OKR Ally, so he can review them and help. They are not shared more widely. The privacy policy has the full detail on how your data is handled.',
      },
    ],
  },
]

function norm(s: string) {
  return s.toLowerCase()
}

export default function HelpTab() {
  const [q, setQ] = useState('')

  const filtered = useMemo(() => {
    const t = norm(q.trim())
    if (!t) return TOPICS
    return TOPICS.map((topic) => {
      const topicHit = norm(topic.title).includes(t) || norm(topic.blurb).includes(t)
      const items = topicHit
        ? topic.items
        : topic.items.filter((it) => norm(it.q).includes(t) || norm(it.a).includes(t))
      return { ...topic, items }
    }).filter((topic) => topic.items.length > 0)
  }, [q])

  return (
    <div>
      <AllyRow>
        Anything you want to know about how I work — scoring, credits, the free review, or when
        PGS steps in himself. Search below, or just scroll.
      </AllyRow>

      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search help…"
        aria-label="Search help"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${T.hairline}`,
          borderRadius: 8,
          fontSize: 14,
          margin: '14px 0 8px',
          outline: 'none',
        }}
      />

      {filtered.length === 0 ? (
        <p style={{ color: T.muted, fontSize: 14, marginTop: 16 }}>
          Nothing matches “{q.trim()}”. Try a different word, or email{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: T.emeraldDark, fontWeight: 600 }}>
            pgs@embiggen.co.in
          </a>
          .
        </p>
      ) : (
        filtered.map((topic) => (
          <section key={topic.id} style={{ marginTop: 22 }}>
            <h3
              style={{
                fontFamily: 'var(--font-lora), serif',
                fontSize: 16,
                fontWeight: 700,
                color: T.charcoal,
                margin: '0 0 2px',
              }}
            >
              {topic.title}
            </h3>
            <p style={{ fontSize: 12.5, color: T.muted, margin: '0 0 12px' }}>{topic.blurb}</p>

            <div style={{ border: `1px solid ${T.hairline}`, borderRadius: 10, overflow: 'hidden' }}>
              {topic.items.map((it, i) => (
                <details
                  key={it.q}
                  style={{
                    borderTop: i === 0 ? 'none' : `1px solid ${T.hairline}`,
                    background: T.card,
                  }}
                >
                  <summary
                    style={{
                      cursor: 'pointer',
                      listStyle: 'none',
                      padding: '12px 14px',
                      fontSize: 13.5,
                      fontWeight: 600,
                      color: T.charcoal,
                    }}
                  >
                    {it.q}
                  </summary>
                  <p
                    style={{
                      padding: '0 14px 14px',
                      margin: 0,
                      fontSize: 13.5,
                      lineHeight: 1.6,
                      color: T.muted,
                    }}
                  >
                    {it.a}
                  </p>
                </details>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
