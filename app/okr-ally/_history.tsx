'use client'

import { useEffect, useMemo, useState } from 'react'
import { AllyRow, T } from './_ui'
import { type Brand, DEFAULT_BRAND, reviewCount } from '@/lib/okrAllyBrand'

interface Item {
  submissionId: string
  objective: string
  status: 'pending' | 'complete' | 'failed_refunded'
  overallScore: number | null
  createdAt: string
  rated: boolean
}

interface Purchase {
  credits: number
  date: string
  razorpayPaymentId: string | null
}
interface Invoice {
  id: string
  invoiceNumber: string
  total: number
  placeOfSupply: string
  date: string
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: '.06em',
        textTransform: 'uppercase',
        color: T.gold,
        margin: '22px 0 10px',
      }}
    >
      {children}
    </div>
  )
}

export default function HistoryTab({
  onOpen,
  brand = DEFAULT_BRAND,
}: {
  onOpen: (submissionId: string) => void
  brand?: Brand
}) {
  const [items, setItems] = useState<Item[] | null>(null)
  const [account, setAccount] = useState<{ purchases: Purchase[]; invoices: Invoice[] } | null>(null)
  const [q, setQ] = useState('')

  useEffect(() => {
    fetch('/api/okr-ally/history')
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]))
    fetch('/api/okr-ally/account')
      .then((r) => r.json())
      .then((d) => setAccount({ purchases: d.purchases ?? [], invoices: d.invoices ?? [] }))
      .catch(() => setAccount({ purchases: [], invoices: [] }))
  }, [])

  const filtered = useMemo(() => {
    if (!items) return []
    const t = q.trim().toLowerCase()
    return t ? items.filter((i) => i.objective.toLowerCase().includes(t)) : items
  }, [items, q])

  if (!items) return <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>

  return (
    <div>
      <SectionHeading>Reviews</SectionHeading>
      {items.length === 0 ? (
        <AllyRow>Nothing here yet — your past reviews will show up in this tab.</AllyRow>
      ) : (
        <>
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
                      fontFamily: 'var(--font-inter), sans-serif',
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
                {fmtDate(i.createdAt)}
                {i.status === 'complete' && !i.rated && ' · unrated'}
              </div>
            </button>
          ))}
          {filtered.length === 0 && <p style={{ fontSize: 13, color: T.muted }}>No objectives match “{q}”.</p>}
        </>
      )}

      <SectionHeading>Purchases</SectionHeading>
      {!account ? (
        <p style={{ color: T.muted, fontSize: 13 }}>Loading…</p>
      ) : account.purchases.length === 0 ? (
        <p style={{ fontSize: 13, color: T.muted }}>No purchases yet — your first review is free.</p>
      ) : (
        account.purchases.map((p, k) => (
          <div
            key={k}
            className="flex items-center justify-between"
            style={{
              background: T.card,
              border: `1px solid ${T.hairline}`,
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 10,
              fontSize: 13.5,
            }}
          >
            <span style={{ color: T.charcoal }}>
              Bought {reviewCount(brand, p.credits)}
            </span>
            <span style={{ color: T.muted, fontSize: 12 }}>{fmtDate(p.date)}</span>
          </div>
        ))
      )}

      <SectionHeading>Invoices</SectionHeading>
      {!account ? (
        <p style={{ color: T.muted, fontSize: 13 }}>Loading…</p>
      ) : account.invoices.length === 0 ? (
        <p style={{ fontSize: 13, color: T.muted }}>No invoices yet.</p>
      ) : (
        account.invoices.map((inv) => (
          <div
            key={inv.id}
            style={{
              background: T.card,
              border: `1px solid ${T.hairline}`,
              borderRadius: 12,
              padding: '12px 14px',
              marginBottom: 10,
            }}
          >
            <div className="flex items-center justify-between" style={{ fontSize: 13.5 }}>
              <span style={{ color: T.charcoal, fontWeight: 600 }}>{inv.invoiceNumber}</span>
              <span style={{ color: T.charcoal }}>Rs. {inv.total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="flex items-center justify-between" style={{ marginTop: 4 }}>
              <span style={{ fontSize: 11.5, color: T.muted }}>
                {fmtDate(inv.date)} · {inv.placeOfSupply}
              </span>
              <a
                href={`/api/okr-ally/invoice/${inv.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12.5, fontWeight: 600, color: T.emeraldDark, textDecoration: 'none' }}
              >
                Download PDF →
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
