'use client'

import { useMemo, useState } from 'react'
import { AllyRow, T } from './_ui'
import { type Brand, DEFAULT_BRAND, vocab } from '@/lib/okrAllyBrand'
import { topicsFor } from '@/lib/okrAllyHelpContent'

/**
 * In-app Help — written in Ally's first-person voice, grouped by topic, with
 * purely client-side search. No API calls: the content is built from
 * `topicsFor` (lib/okrAllyHelpContent.ts — plain data, shared with the help
 * chatbot's knowledge base), fully branded off `lib/okrAllyBrand.ts` so
 * /okr-ally and /goal-ally each read in their own vocabulary (Objective/Goal,
 * Key Result/Sub-goal, OKR/Goal Plan, OKR Review/Goal Review). Topic `id`s
 * stay stable across brands for search + e2e.
 */

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
