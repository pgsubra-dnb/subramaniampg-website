'use client'

import { useEffect, useMemo, useState } from 'react'
import { tokens as T } from '@/lib/okrAllyTokens'

// ─── shared types (mirror lib/okrAllyAdmin.ts JSON) ─────────────────────

type CustomerStatus = 'active' | 'low_use' | 'purchased_not_used'

interface CustomerRow {
  customerId: string
  type: 'individual' | 'corporate'
  customerName: string
  amountPaid: number
  creditsPurchased: number
  creditsUsed: number
  usersInAccount: number
  lastActivity: string | null
  status: CustomerStatus
  firstPurchaseDate: string | null
}

interface Summary {
  totalCustomers: number
  totalUsers: number
  totalRevenue: number
  purchasedNotUsedCount: number
}

interface ApiResponse {
  customers: CustomerRow[]
  summary: Summary
}

type LoadState =
  | { phase: 'loading' }
  | { phase: 'unauthorized' }
  | { phase: 'forbidden' }
  | { phase: 'error'; message: string }
  | { phase: 'ready'; data: ApiResponse }

const STATUS_FILTERS: { value: 'all' | CustomerStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'low_use', label: 'Low use' },
  { value: 'purchased_not_used', label: 'Purchased not used' },
]

const STATUS_LABEL: Record<CustomerStatus, string> = {
  active: 'Active',
  low_use: 'Low use',
  purchased_not_used: 'Purchased not used',
}

const STATUS_COLOR: Record<CustomerStatus, { fg: string; bg: string; border: string }> = {
  active: { fg: T.success, bg: T.successLight, border: T.successBorder },
  low_use: { fg: T.warning, bg: T.warningLight, border: T.warningBorder },
  purchased_not_used: { fg: T.error, bg: T.errorLight, border: T.errorBorder },
}

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

const fmtMoney = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`

function StatusBadge({ status }: { status: CustomerStatus }) {
  const c = STATUS_COLOR[status]
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12.5,
        fontWeight: 600,
        color: c.fg,
        background: c.bg,
        border: `1px solid ${c.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: '1 1 180px',
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: '14px 16px',
      }}
    >
      <div style={{ fontSize: 12.5, color: T.textSecondary, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary }}>{value}</div>
    </div>
  )
}

const th: React.CSSProperties = {
  textAlign: 'left',
  padding: '10px 12px',
  fontSize: 12,
  fontWeight: 600,
  color: T.textSecondary,
  textTransform: 'uppercase',
  letterSpacing: 0.3,
  borderBottom: `1px solid ${T.border}`,
  whiteSpace: 'nowrap',
}

const td: React.CSSProperties = {
  padding: '10px 12px',
  fontSize: 13.5,
  color: T.textPrimary,
  borderBottom: `1px solid ${T.border}`,
  whiteSpace: 'nowrap',
}

export default function AdminCustomersPage() {
  const [state, setState] = useState<LoadState>({ phase: 'loading' })
  const [statusFilter, setStatusFilter] = useState<'all' | CustomerStatus>('all')

  useEffect(() => {
    let cancelled = false
    fetch('/api/okr-ally/admin/customers', { credentials: 'same-origin' })
      .then(async (res) => {
        if (cancelled) return
        if (res.status === 401) return setState({ phase: 'unauthorized' })
        if (res.status === 403) return setState({ phase: 'forbidden' })
        if (!res.ok) return setState({ phase: 'error', message: `Request failed (${res.status})` })
        const data = (await res.json()) as ApiResponse
        setState({ phase: 'ready', data })
      })
      .catch((err) => {
        if (!cancelled) setState({ phase: 'error', message: String(err) })
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (state.phase !== 'ready') return []
    if (statusFilter === 'all') return state.data.customers
    return state.data.customers.filter((c) => c.status === statusFilter)
  }, [state, statusFilter])

  return (
    <div
      style={{
        minHeight: '100vh',
        background: T.background,
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
        padding: '32px 24px 80px',
      }}
    >
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>
          Customers
        </h1>
        <p style={{ fontSize: 13.5, color: T.textSecondary, marginBottom: 24 }}>
          Every individual and corporate customer — purchases, credit usage, and who has gone
          quiet since buying. Read-only.
        </p>

        {state.phase === 'loading' && (
          <div style={{ color: T.textSecondary, fontSize: 14 }}>Loading…</div>
        )}

        {state.phase === 'unauthorized' && (
          <div
            style={{
              background: T.warningLight,
              border: `1px solid ${T.warningBorder}`,
              color: T.warning,
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 14,
            }}
          >
            Not signed in. Sign in as admin at{' '}
            <a href="/okr-ally" style={{ color: T.warning, fontWeight: 600 }}>
              /okr-ally
            </a>{' '}
            first, then reload this page.
          </div>
        )}

        {state.phase === 'forbidden' && (
          <div
            style={{
              background: T.errorLight,
              border: `1px solid ${T.errorBorder}`,
              color: T.error,
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 14,
            }}
          >
            This account is not an admin.
          </div>
        )}

        {state.phase === 'error' && (
          <div
            style={{
              background: T.errorLight,
              border: `1px solid ${T.errorBorder}`,
              color: T.error,
              borderRadius: 10,
              padding: '14px 16px',
              fontSize: 14,
            }}
          >
            {state.message}
          </div>
        )}

        {state.phase === 'ready' && (
          <>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 22 }}>
              <StatCard label="Total customers" value={String(state.data.summary.totalCustomers)} />
              <StatCard label="Total users" value={String(state.data.summary.totalUsers)} />
              <StatCard label="Total revenue" value={fmtMoney(state.data.summary.totalRevenue)} />
              <StatCard
                label="Purchased not used"
                value={String(state.data.summary.purchasedNotUsedCount)}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <label style={{ fontSize: 13, color: T.textSecondary }}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | CustomerStatus)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  fontSize: 13.5,
                  color: T.textPrimary,
                  background: T.surface,
                }}
              >
                {STATUS_FILTERS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
              <span style={{ fontSize: 12.5, color: T.textSecondary }}>
                {filtered.length} of {state.data.customers.length}
              </span>
            </div>

            <div
              style={{
                background: T.surface,
                border: `1px solid ${T.border}`,
                borderRadius: 10,
                overflowX: 'auto',
              }}
            >
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={th}>Customer</th>
                    <th style={th}>Type</th>
                    <th style={th}>Amount paid</th>
                    <th style={th}>Credits purchased</th>
                    <th style={th}>Credits used</th>
                    <th style={th}>Users</th>
                    <th style={th}>Last activity</th>
                    <th style={th}>Status</th>
                    <th style={th}>First purchase</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <tr key={c.customerId}>
                      <td style={{ ...td, fontWeight: 600 }}>{c.customerName}</td>
                      <td style={td}>{c.type === 'individual' ? 'Individual' : 'Corporate'}</td>
                      <td style={td}>{fmtMoney(c.amountPaid)}</td>
                      <td style={td}>{c.creditsPurchased}</td>
                      <td style={td}>{c.creditsUsed}</td>
                      <td style={td}>{c.usersInAccount}</td>
                      <td style={td}>{fmtDate(c.lastActivity)}</td>
                      <td style={td}>
                        <StatusBadge status={c.status} />
                      </td>
                      <td style={td}>{fmtDate(c.firstPurchaseDate)}</td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td style={{ ...td, color: T.textSecondary }} colSpan={9}>
                        No customers match this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
