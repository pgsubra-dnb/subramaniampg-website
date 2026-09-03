'use client'

import { useMemo, useState } from 'react'
import { AllyRow, T } from './_ui'
import { type Brand, DEFAULT_BRAND, vocab, type BrandVocab } from '@/lib/okrAllyBrand'

/**
 * In-app Help — written in Ally's first-person voice, grouped by topic, with
 * purely client-side search. No API calls: the content is built from `topicsFor`
 * below, fully branded off `lib/okrAllyBrand.ts` so /okr-ally and /goal-ally each
 * read in their own vocabulary (Objective/Goal, Key Result/Sub-goal, OKR/Goal
 * Plan, OKR Review/Goal Review). Topic `id`s stay stable across brands for search
 * + e2e.
 */

type QA = { q: string; a: string }
type Topic = { id: string; title: string; blurb: string; items: QA[] }

function topicsFor(v: BrandVocab): Topic[] {
  const plan = v.plan // "OKR" | "Goal Plan"
  const planPlural = v.planPlural // "OKRs" | "Goal Plans"
  const objLower = v.objectiveLower // "objective" | "goal"
  const krPluralLower = v.krPlural.toLowerCase() // "key results" | "sub-goals"
  const review = v.review // "OKR Review" | "Goal Review"
  const reviews = v.reviews // "OKR Reviews" | "Goal Reviews"

  return [
    {
      id: 'scoring',
      title: 'How scoring works',
      blurb: 'What the number means, and how I get to it.',
      items: [
        {
          q: `Why not just use Claude or ChatGPT for this?`,
          a: `You can absolutely paste your ${plan} into a general AI chatbot and ask it to critique it. What you'd get back would be generic, though, since a general assistant has no fixed standard to score you against. I score every ${plan} against the same five-criteria rubric every time, the same one from Subramaniam's own consulting practice and his book, so your result is comparable across different ${objLower}s and different quarters. I also ask follow-up questions when your context is thin, generate a formal PDF report you can keep, and for reviews that come in below a certain quality, Subramaniam himself sometimes adds his own note directly. A general chatbot can't do any of that consistently, because it isn't built around one person's specific coaching standard.`,
        },
        {
          q: `How do you score my ${plan}?`,
          a: `I read your ${objLower}, ${krPluralLower} and initiatives together with the context you gave me, then score five things: Outcome vs Output, Alignment, Measurability, Specificity, and Ambition vs Realism. Each gets a 0–10 with a short reason. Your overall score is a weighted blend of the five — Outcome vs Output and Alignment count for the most, because a ${plan} that measures activity or points nowhere is the most common way these go wrong.`,
        },
        {
          q: `What does the score actually mean?`,
          a: `It's a read on how well the ${plan} is written — not a verdict on your strategy or your team. A lower score means I found room to tighten the wording, sharpen the measures, or reconnect the ${objLower} to the bigger picture. The report tells you exactly where.`,
        },
        {
          q: `Why did my score change after I edited one line?`,
          a: `The five criteria interact. Rewriting a ${v.krLower} into clear baseline-and-target form can lift Measurability and Specificity at the same time, and that moves the weighted total.`,
        },
        {
          q: `Do you compare me to other companies?`,
          a: `No. I judge only what you wrote, plus the context you gave me. I don't pull in outside knowledge about your industry or your competitors, and I don't invent detail.`,
        },
        {
          q: `What are the two options in my report?`,
          a: `I give you two rewrites. The refined version stays close to your original and fixes it in place. The fresh version rebuilds the ${plan} from the outcome up. Take whichever fits, or borrow from both.`,
        },
        {
          q: `Why don't the two suggested rewrites get their own score?`,
          a: `I only score what you actually wrote and submitted, that's the real assessment. The two rewrites are there to show you what a stronger version could look like, but scoring them would just be me grading my own suggestions, not a genuine independent check. If you want a real score for a rewritten version, the honest way to get one is to actually use it as your ${plan} and submit it fresh.`,
        },
        {
          q: `Can I see the review again later?`,
          a: `Yes. Every completed review — with its score, both rewrites and the PDF — stays in your History tab.`,
        },
      ],
    },
    {
      id: 'credits',
      title: `${review} packs`,
      blurb: `Buying reviews and invoices.`,
      items: [
        {
          q: `How do ${reviews} work?`,
          a: `One ${review} is one full pass over your ${plan}. You buy ${reviews} in packs from the Pricing & Plans tab, and each ${plan} you submit spends one.`,
        },
        {
          q: `What do the packs cost?`,
          a: `A single review is ₹100, a 5-pack is ₹375 (₹75 a review), and a 10-pack is ₹500 (₹50 a review) — all plus 18% GST. The larger packs bring the price per review down.`,
        },
        {
          q: `Do ${reviews} expire?`,
          a: `No. They stay in your account until you use them.`,
        },
        {
          q: `Do I get an invoice?`,
          a: `Yes. Every purchase generates a GST invoice. It is emailed to you and also listed in your History tab, where you can download it again any time.`,
        },
        {
          q: `My payment went through but I have no ${reviews}.`,
          a: `Give it a moment and refresh — the confirmation can lag by a few seconds. If they still are not there, email pgs@embiggen.co.in with your payment reference and it will be sorted out.`,
        },
      ],
    },
    {
      id: 'corporate',
      title: `Corporate & team ${reviews}`,
      blurb: `A shared pool of ${reviews} for your company, handed out by one admin.`,
      items: [
        {
          q: `How does a company buy ${reviews}?`,
          a: `If several people at your company want to run their ${planPlural} through me, buy a shared pool instead of individual packs. Sign in, open the Pricing & Plans tab, and follow “Looking for team or company ${reviews}?” — or go straight to subramaniampg.guru${v.path}/corporate. Pick a bundle, enter your company name, GSTIN and registered address, choose the state for the invoice, and name the person who will manage the pool (the “designated admin” — that can be you or a colleague). Pay by card or UPI. The GST invoice is made out to the company, not to you personally.`,
        },
        {
          q: `What are the bundles?`,
          a: `Three fixed sizes: 100 ${reviews} for ₹6,000, 200 for ₹11,000, or 500 for ₹25,000 — all plus 18% GST, so ₹7,080, ₹12,980 and ₹29,500 to pay. That is ₹60, ₹55 and ₹50 a review as the pool gets bigger. Need more than 500? Email pgs@embiggen.co.in to discuss — there is no self-serve option above 500.`,
        },
        {
          q: `How does the admin hand ${reviews} out?`,
          a: `The designated admin gets a Company tab in ${v.product}. It shows the pool — purchased, allocated, and still available — and lets them allocate any number to an employee's email. If that person has no ${v.product} account yet, allocating creates one; either way they are emailed to say the ${reviews} are waiting. The pool goes down by whatever is allocated.`,
        },
        {
          q: `When an employee runs a review, which ${reviews} does it use?`,
          a: `Their company-allocated ${reviews} are spent first, automatically. A review only falls back to any personal ${reviews} they bought themselves once the company pool is used up. The two balances are always kept separate and shown separately.`,
        },
        {
          q: `Can the admin take unused ${reviews} back?`,
          a: `Yes. “Reclaim unused ${reviews}” on the Company tab takes back whatever an employee has not spent yet and returns it to the pool. ${reviews} already used on reviews stay used — reclaim never claws those back and never takes a balance below zero. The admin can also pull a per-employee usage report (with a PDF) showing exactly what the company allocated, what was used, and what is left.`,
        },
        {
          q: `I already use ${v.product} personally. What happens if my company makes me an admin or gives me ${reviews}?`,
          a: `Nothing happens to your personal account. Your own ${reviews}, your past reviews, your saved company and role context, your history — all of it stays exactly as it was. Being made an org admin only adds the Company tab. Being allocated company ${reviews} only adds a separate company balance alongside your personal one, and your reviews simply spend the company ${reviews} first. It is purely additive.`,
        },
        {
          q: `Who can see the company's usage?`,
          a: `The designated admin sees the pool and each employee's company-${review.toLowerCase()} figures — allocated, used, remaining — and nothing about anyone's personal ${v.product} account. Employees don't see the pool or other people's allocations.`,
        },
      ],
    },
    {
      id: 'free-review',
      title: 'The free first review',
      blurb: 'Your first review is on the house.',
      items: [
        {
          q: `Is my first review really free?`,
          a: `Yes — your first review is free, once per account. It is the full review, not a cut-down version.`,
        },
        {
          q: `How do I claim it?`,
          a: `Nothing to do. When you have no ${reviews} and you are still eligible, I apply the free review automatically the moment you submit.`,
        },
        {
          q: `It charged me a ${review} instead.`,
          a: `The free review is a one-time thing per account. If you have already used it, later reviews need a ${review}. If you believe that is wrong, email pgs@embiggen.co.in.`,
        },
        {
          q: `Does the free review still get an invoice?`,
          a: `Yes. A GST invoice is generated even when the amount is ₹0, and it is emailed to you like any other.`,
        },
      ],
    },
    {
      id: 'personal-review',
      title: `When PGS reviews your ${plan} himself`,
      blurb: 'The occasional personal note on top of my review.',
      items: [
        {
          q: `I got an email from PGS about my ${plan}.`,
          a: `Sometimes PGS reads a review personally and sends you a short note in his own words — a second pair of eyes on top of mine. It is commentary and suggestions, never a score or a grade.`,
        },
        {
          q: `Can I get PGS to personally review my ${plan}?`,
          a: `Yes — that's a paid one-to-one conversation with PGS, separate from my automated review. Book it at subramaniampg.guru/work/book-consulting (“A Conversation with PGS”): ₹1,180 for 30 minutes, ₹2,360 for 60 minutes, or ₹3,540 for 90 minutes. Those are GST-inclusive — the amount you actually pay. Bring your ${plan} and context and he'll work through it with you live.`,
        },
        {
          q: `Who can see what I submit?`,
          a: `Your submissions are visible to PGS, as the person behind ${v.product}, so he can review them and help. They are not shared more widely. The privacy policy has the full detail on how your data is handled.`,
        },
      ],
    },
  ]
}

function norm(s: string) {
  return s.toLowerCase()
}

export default function HelpTab({ brand = DEFAULT_BRAND }: { brand?: Brand }) {
  const v = vocab(brand)
  const [q, setQ] = useState('')
  const TOPICS = useMemo(() => topicsFor(v), [v])

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
  }, [q, TOPICS])

  return (
    <div>
      <AllyRow>
        Anything you want to know about how I work — scoring, {v.reviews}, the free review, or when
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
                fontFamily: 'var(--font-inter), sans-serif',
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
