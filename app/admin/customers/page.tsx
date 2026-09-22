'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
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
  currentAdminEmail: string | null
}

interface OrgOverrideMember {
  id: string
  email: string
  name: string
  isOrgAdmin: boolean
}

interface OrgOverrideStatus {
  organizationId: string
  organizationName: string
  currentAdminEmail: string | null
  members: OrgOverrideMember[]
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
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const patchCustomer = (customerId: string, currentAdminEmail: string) => {
    setState((s) =>
      s.phase === 'ready'
        ? {
            ...s,
            data: {
              ...s.data,
              customers: s.data.customers.map((c) =>
                c.customerId === customerId ? { ...c, currentAdminEmail } : c
              ),
            },
          }
        : s
    )
  }

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
          quiet since buying. Reporting is read-only; a corporate row&apos;s admin can be changed
          below for the unreachable-admin override case.
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
                    <th style={th}>Admin</th>
                    <th style={th}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c) => (
                    <Fragment key={c.customerId}>
                      <tr>
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
                        <td style={td}>{c.type === 'corporate' ? c.currentAdminEmail ?? '—' : '—'}</td>
                        <td style={td}>
                          {c.type === 'corporate' && (
                            <button
                              type="button"
                              onClick={() => setExpandedId(expandedId === c.customerId ? null : c.customerId)}
                              style={{
                                background: 'none',
                                border: `1px solid ${T.border}`,
                                borderRadius: 6,
                                padding: '4px 10px',
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: T.textPrimary,
                                cursor: 'pointer',
                              }}
                            >
                              {expandedId === c.customerId ? 'Close' : 'Change admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedId === c.customerId && (
                        <tr>
                          <td style={{ ...td, whiteSpace: 'normal' }} colSpan={11}>
                            <OrgAdminOverridePanel
                              organizationId={c.customerId}
                              organizationName={c.customerName}
                              onChanged={(newAdminEmail) => patchCustomer(c.customerId, newAdminEmail)}
                              onClose={() => setExpandedId(null)}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td style={{ ...td, color: T.textSecondary }} colSpan={11}>
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

// ─── Change admin (manual override) ─────────────────────────────────────
//
// The unreachable-admin escape hatch: the Company tab's own self-serve
// transfer (app/okr-ally/_org.tsx) only works if the CURRENT admin is signed
// in to do it. When they can't be reached, that screen already tells the
// customer to email pgs@embiggen.co.in — this panel is that override, done
// here instead of by hand against the database. Immediate for both an
// existing org member and a brand-new email; no accept step, since PGS is
// vouching for the change (normally after confirming it with the client).

const overrideInput: React.CSSProperties = {
  padding: '7px 10px',
  border: `1px solid ${T.border}`,
  borderRadius: 8,
  fontSize: 13.5,
  outline: 'none',
  minWidth: 260,
}

function OrgAdminOverridePanel({
  organizationId,
  organizationName,
  onChanged,
  onClose,
}: {
  organizationId: string
  organizationName: string
  onChanged: (newAdminEmail: string) => void
  onClose: () => void
}) {
  const [status, setStatus] = useState<OrgOverrideStatus | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [note, setNote] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch(`/api/okr-ally/admin/org/${organizationId}`, { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Request failed (${r.status})`))))
      .then((j: OrgOverrideStatus) => {
        if (!cancelled) setStatus(j)
      })
      .catch((e) => {
        if (!cancelled) setLoadError(String(e.message || e))
      })
    return () => {
      cancelled = true
    }
  }, [organizationId])

  async function setAdmin() {
    const target = email.trim().toLowerCase()
    if (!target) return
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/okr-ally/admin/org/override-admin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ organizationId, newAdminEmail: target, note: note.trim() || undefined }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: j.error || 'Could not change the admin.' })
        setBusy(false)
        setConfirming(false)
        return
      }
      setMsg({
        kind: 'ok',
        text:
          `${j.newAdminEmail} is now the admin for ${organizationName}` +
          (j.wasNewAccount ? ' (new account created).' : '.') +
          (j.emailed ? '' : ' Notification email did not send — tell them directly.'),
      })
      onChanged(j.newAdminEmail)
      setEmail('')
      setNote('')
      setConfirming(false)
      setStatus((s) =>
        s
          ? {
              ...s,
              currentAdminEmail: j.newAdminEmail,
              members: s.members.map((m) => ({ ...m, isOrgAdmin: m.email === j.newAdminEmail })),
            }
          : s
      )
    } catch {
      setMsg({ kind: 'err', text: 'Network problem — nothing was changed.' })
    } finally {
      setBusy(false)
    }
  }

  const otherMembers = (status?.members ?? []).filter((m) => !m.isOrgAdmin)

  return (
    <div
      style={{
        background: T.background,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: 16,
        maxWidth: 640,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: T.textPrimary }}>
          Change admin — {organizationName}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: T.textSecondary, fontSize: 12.5, cursor: 'pointer' }}
        >
          Close
        </button>
      </div>
      <p style={{ fontSize: 12, color: T.textSecondary, margin: '0 0 12px', lineHeight: 1.5 }}>
        Manual override for when the current admin can&apos;t be reached to hand it over themselves.
        Takes effect immediately — no invite or acceptance step, unlike the customer&apos;s own Company
        tab. Works for an existing org member or a brand-new email.
      </p>

      {loadError && <p style={{ color: T.error, fontSize: 13 }}>{loadError}</p>}

      {status && (
        <>
          <p style={{ fontSize: 12.5, color: T.textSecondary, marginBottom: 10 }}>
            Current admin: <strong>{status.currentAdminEmail ?? 'none'}</strong>
          </p>

          {otherMembers.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', fontSize: 12, color: T.textSecondary, marginBottom: 4 }}>
                Existing members
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {otherMembers.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setEmail(m.email)}
                    style={{
                      background: email === m.email ? T.textPrimary : 'none',
                      color: email === m.email ? T.surface : T.textPrimary,
                      border: `1px solid ${T.border}`,
                      borderRadius: 999,
                      padding: '3px 10px',
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    {m.name} ({m.email})
                  </button>
                ))}
              </div>
            </div>
          )}

          <label style={{ display: 'block', fontSize: 12, color: T.textSecondary, margin: '0 0 4px' }}>
            New admin&apos;s email (pick a member above, or type any email — existing or brand new)
          </label>
          <input
            style={{ ...overrideInput, width: '100%', marginBottom: 8 }}
            placeholder="new-admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setConfirming(false)
            }}
          />
          <label style={{ display: 'block', fontSize: 12, color: T.textSecondary, margin: '0 0 4px' }}>
            Note (optional — included in both notification emails)
          </label>
          <input
            style={{ ...overrideInput, width: '100%', marginBottom: 10 }}
            placeholder="e.g. requested by outgoing admin over email, 2026-09-22"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          {!confirming ? (
            <button
              type="button"
              onClick={() => setConfirming(true)}
              disabled={busy || !email.trim()}
              style={{
                background: T.textPrimary,
                color: T.surface,
                border: 'none',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: busy || !email.trim() ? 'default' : 'pointer',
                opacity: busy || !email.trim() ? 0.6 : 1,
              }}
            >
              Set as admin now
            </button>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: T.error, fontWeight: 600 }}>
                Make {email.trim()} the admin immediately, no confirmation from them?
              </span>
              <button
                type="button"
                onClick={setAdmin}
                disabled={busy}
                style={{
                  background: T.error,
                  color: T.surface,
                  border: 'none',
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  fontWeight: 600,
                  cursor: busy ? 'default' : 'pointer',
                }}
              >
                {busy ? 'Setting…' : 'Yes, set it'}
              </button>
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={busy}
                style={{
                  background: 'none',
                  border: `1px solid ${T.border}`,
                  borderRadius: 8,
                  padding: '7px 12px',
                  fontSize: 12.5,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </>
      )}

      {msg && (
        <p style={{ marginTop: 12, fontSize: 13, color: msg.kind === 'ok' ? T.success : T.error }}>{msg.text}</p>
      )}
    </div>
  )
}
