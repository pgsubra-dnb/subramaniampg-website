'use client'

import { useEffect, useMemo, useState } from 'react'
import { AllyRow, T } from './_ui'

interface Item {
  submissionId: string
  objective: string
  status: 'pending' | 'complete' | 'failed_refunded'
  overallScore: number | null
  createdAt: string
  rated: boolean
}

export default function HistoryTab({ onOpen }: { onOpen: (submissionId: string) => void }) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/okr-ally/history')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
  }, [])

  const filtered = useMemo(() => {
    if (!items) return []
    const t = q.trim().toLowerCase()
    // filters against the Objective text only — no KRs, context, or scores
    return t ? items.filter((i) => i.objective.toLowerCase().includes(t)) : items
  }, [items, q])

  if (!items) return <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>

  if (items.length === 0) {
    return <AllyRow>Nothing here yet — your past reviews will show up in this tab.</AllyRow>
  }

  return (
    <div>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search your objectives…"
        style={{
          width: '100%',
          padding: '10px 12px',
          border: `1px solid ${T.hairline}`,
          borderRadius: 8,
          fontSize: 14,
          marginBottom: 14,
          outline: 'none',
        }}
      />
      {filtered.map((i) => (
        <button
          key={i.submissionId}
          onClick={() => i.status === 'complete' && onOpen(i.submissionId)}
          style={{
            display: 'block',
            width: '100%',
            textAlign: 'left',
            background: T.card,
            border: `1px solid ${T.hairline}`,
            borderRadius: 12,
            padding: 14,
            marginBottom: 10,
            cursor: i.status === 'complete' ? 'pointer' : 'default',
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div style={{ fontSize: 13.5, color: T.charcoal, lineHeight: 1.4 }}>{i.objective}</div>
            {i.status === 'complete' && i.overallScore != null ? (
              <div
                style={{
                  flexShrink: 0,
                  fontFamily: 'var(--font-lora), serif',
                  fontWeight: 700,
                  color: T.emeraldDark,
                  fontSize: 15,
                }}
              >
                {i.overallScore.toFixed(1)}
              </div>
            ) : (
              <span style={{ flexShrink: 0, fontSize: 11.5, color: T.muted }}>
                {i.status === 'pending' ? 'in progress' : 'not completed'}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>
            {new Date(i.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            {i.status === 'complete' && !i.rated && ' · unrated'}
          </div>
        </button>
      ))}
      {filtered.length === 0 && (
        <p style={{ fontSize: 13, color: T.muted }}>No objectives match “{q}”.</p>
      )}
    </div>
  )
}
