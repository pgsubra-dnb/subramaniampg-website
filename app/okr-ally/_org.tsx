'use client'

import { useCallback, useEffect, useState } from 'react'
import { AllyRow, Btn, T } from './_ui'

/**
 * Company Admin screen — visible only to `is_org_admin` (the tab itself is
 * hidden otherwise, and every /api/okr-ally/org/* route 403s a non-admin).
 *
 * Pool status, allocate-to-employee, reclaim-unused, and a per-employee usage
 * report (+ PDF). Every figure here is scoped to this one organization and is
 * completely independent of any employee's personal OKR Ally account.
 */

interface OrgStatus {
  organization: { id: string; name: string; gstin: string; registeredAddress: string }
  poolPurchased: number
  poolAllocated: number
  poolAvailable: number
  companyContext: string | null
  businessContext: string | null
  contextConfirmedAt: string | null
}

const CONTEXT_MAX = 1000

interface Report {
  organizationName: string
  email: string
  name: string | null
  allocated: number
  reclaimed: number
  used: number
  remaining: number
  ledger: { credits: number; at: string; kind: 'allocation' | 'reclaim' }[]
}

const input: React.CSSProperties = {
  width: '100%',
  padding: '9px 11px',
  border: `1px solid ${T.hairline}`,
  borderRadius: 8,
  fontSize: 13.5,
  outline: 'none',
}

const card: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.hairline}`,
  borderRadius: 12,
  padding: 16,
  marginBottom: 14,
}

const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

export default function OrgAdminScreen({ onPoolChange }: { onPoolChange?: () => void }) {
  const [status, setStatus] = useState<OrgStatus | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const load = useCallback(() => {
    fetch('/api/okr-ally/org/status')
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json()).error || r.statusText))))
      .then((s: OrgStatus) => {
        setStatus(s)
        setErr(null)
      })
      .catch((e) => setErr(String(e.message || e)))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const refresh = useCallback(() => {
    load()
    onPoolChange?.()
  }, [load, onPoolChange])

  if (err) return <p style={{ color: '#B91C1C', fontSize: 14 }}>{err}</p>
  if (!status) return <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>

  return (
    <div>
      <AllyRow>
        You&apos;re the admin for <strong>{status.organization.name}</strong>. Buy credits on the{' '}
        <a href="/okr-ally/corporate" style={{ color: T.emeraldDark, fontWeight: 600 }}>
          corporate page
        </a>
        , then hand them to your team here.
      </AllyRow>

      <div style={{ ...card, display: 'flex', gap: 18, flexWrap: 'wrap' }}>
        <PoolStat label="Purchased" value={status.poolPurchased} />
        <PoolStat label="Allocated" value={status.poolAllocated} />
        <PoolStat label="Available" value={status.poolAvailable} strong />
      </div>

      <ContextPanel status={status} onDone={refresh} />
      <AllocatePanel available={status.poolAvailable} onDone={refresh} />
      <ReclaimPanel onDone={refresh} />
      <ReportPanel />

      <p style={{ fontSize: 11.5, color: T.muted, marginTop: 4 }}>
        GSTIN {status.organization.gstin}. Company-allocated credits are tracked separately from each
        employee&apos;s personal credits and never touch them.
      </p>
    </div>
  )
}

function PoolStat({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: T.gold }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-lora), serif',
          fontSize: strong ? 26 : 22,
          fontWeight: 600,
          color: strong ? T.emeraldDark : T.charcoal,
        }}
      >
        {value}
      </div>
    </div>
  )
}

function Msg({ m }: { m: { kind: 'ok' | 'err'; text: string } | null }) {
  if (!m) return null
  return (
    <p style={{ fontSize: 12.5, marginTop: 8, color: m.kind === 'err' ? '#B91C1C' : T.emeraldDark }}>{m.text}</p>
  )
}

const textarea: React.CSSProperties = { ...input, minHeight: 90, lineHeight: 1.5, resize: 'vertical', fontFamily: 'inherit' }

function ContextPanel({ status, onDone }: { status: OrgStatus; onDone: () => void }) {
  const [company, setCompany] = useState(status.companyContext ?? '')
  const [business, setBusiness] = useState(status.businessContext ?? '')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const dirty =
    company.trim() !== (status.companyContext ?? '').trim() ||
    business.trim() !== (status.businessContext ?? '').trim()
  const published = status.contextConfirmedAt !== null

  async function publish() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/okr-ally/org/context', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ companyContext: company.trim(), businessContext: business.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: j.error || 'Could not publish.' })
        return
      }
      setMsg({ kind: 'ok', text: 'Published. Your team can run reviews with this context now.' })
      onDone()
    } catch {
      setMsg({ kind: 'err', text: 'Network problem — nothing was published.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: T.charcoal, marginBottom: 4 }}>
        Company context for your team
      </div>
      <p style={{ fontSize: 12, color: T.muted, margin: '0 0 12px', lineHeight: 1.5 }}>
        Every employee runs their review on the company and business context you set here — they can&apos;t
        change it, and each only adds their own role. Nothing takes effect until you publish.
      </p>

      <label style={{ display: 'block', fontSize: 12.5, color: T.muted, margin: '0 0 4px' }}>
        Company context — what the company does, who it serves, roughly how big it is
      </label>
      <textarea
        style={textarea}
        maxLength={CONTEXT_MAX}
        value={company}
        onChange={(e) => setCompany(e.target.value)}
        placeholder="A few sentences."
      />
      <label style={{ display: 'block', fontSize: 12.5, color: T.muted, margin: '12px 0 4px' }}>
        Business context — strategic direction, current challenges, opportunities, trends
      </label>
      <textarea
        style={textarea}
        maxLength={CONTEXT_MAX}
        value={business}
        onChange={(e) => setBusiness(e.target.value)}
        placeholder="A few sentences."
      />

      <p style={{ fontSize: 11.5, color: T.muted, margin: '10px 0 0', lineHeight: 1.5 }}>
        {published ? (
          <>Published {fmtDate(status.contextConfirmedAt!)}. Republishing updates it for future reviews only —
          reviews already run keep the context they were run with.</>
        ) : (
          <>Not published yet — your team can&apos;t run reviews until you publish this.</>
        )}
      </p>

      <div style={{ marginTop: 10 }}>
        <Btn
          small
          onClick={publish}
          disabled={busy || !company.trim() || !business.trim() || (published && !dirty)}
        >
          {busy ? 'Publishing…' : published ? (dirty ? 'Confirm and publish changes' : 'Published') : 'Confirm and publish'}
        </Btn>
      </div>
      <Msg m={msg} />
    </div>
  )
}

function AllocatePanel({ available, onDone }: { available: number; onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [credits, setCredits] = useState('1')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function allocate() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/okr-ally/org/allocate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), credits: Number(credits) }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: j.error || 'Allocation failed.' })
        return
      }
      setMsg({
        kind: 'ok',
        text:
          `${j.credits} credit${j.credits === 1 ? '' : 's'} allocated to ${j.email} ` +
          `(their company balance: ${j.employeeOrgBalance}; pool left: ${j.poolAvailable}). ` +
          (j.emailed ? 'They have been emailed.' : 'Note: the notification email did not send.'),
      })
      setEmail('')
      setCredits('1')
      onDone()
    } catch {
      setMsg({ kind: 'err', text: 'Network problem — nothing was allocated.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: T.charcoal, marginBottom: 10 }}>
        Allocate credits to an employee
      </div>
      <div className="grid gap-2" style={{ gridTemplateColumns: '2fr 1fr' }}>
        <input style={input} placeholder="employee email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input
          style={input}
          type="number"
          min={1}
          placeholder="credits"
          value={credits}
          onChange={(e) => setCredits(e.target.value)}
        />
      </div>
      <div style={{ marginTop: 10 }}>
        <Btn small onClick={allocate} disabled={busy || !email.trim() || !credits || Number(credits) < 1}>
          {busy ? 'Allocating…' : 'Allocate'}
        </Btn>
        <span style={{ fontSize: 11.5, color: T.muted, marginLeft: 10 }}>{available} available in the pool</span>
      </div>
      <p style={{ fontSize: 11.5, color: T.muted, marginTop: 8 }}>
        Creates the account if it doesn&apos;t exist. The employee is emailed. Their reviews spend these
        before any personal credits.
      </p>
      <Msg m={msg} />
    </div>
  )
}

function ReclaimPanel({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  async function reclaim() {
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch('/api/okr-ally/org/reclaim', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setMsg({ kind: 'err', text: j.error || 'Reclaim failed.' })
        return
      }
      setMsg({
        kind: 'ok',
        text:
          j.reclaimed > 0
            ? `Reclaimed ${j.reclaimed} unused credit${j.reclaimed === 1 ? '' : 's'} from ${j.email}. Pool now: ${j.poolAvailable}.`
            : `${j.email} has no unused credits to reclaim. Credits already spent on reviews are not clawed back.`,
      })
      setEmail('')
      onDone()
    } catch {
      setMsg({ kind: 'err', text: 'Network problem — nothing was reclaimed.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: T.charcoal, marginBottom: 10 }}>
        Reclaim unused credits
      </div>
      <div className="flex gap-2">
        <input style={input} placeholder="employee email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Btn small variant="ghost" onClick={reclaim} disabled={busy || !email.trim()}>
          {busy ? 'Reclaiming…' : 'Reclaim'}
        </Btn>
      </div>
      <p style={{ fontSize: 11.5, color: T.muted, marginTop: 8 }}>
        Returns only what&apos;s still unused to the pool. Spent credits stay spent.
      </p>
      <Msg m={msg} />
    </div>
  )
}

function ReportPanel() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [report, setReport] = useState<Report | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function run() {
    setBusy(true)
    setErr(null)
    setReport(null)
    try {
      const res = await fetch(`/api/okr-ally/org/report?email=${encodeURIComponent(email.trim())}`)
      const j = await res.json().catch(() => ({}))
      if (!res.ok) {
        setErr(j.error || 'Could not load the report.')
        return
      }
      setReport(j as Report)
    } catch {
      setErr('Network problem loading the report.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div style={card}>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: T.charcoal, marginBottom: 10 }}>Usage report</div>
      <div className="flex gap-2">
        <input style={input} placeholder="employee email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Btn small onClick={run} disabled={busy || !email.trim()}>
          {busy ? 'Loading…' : 'View'}
        </Btn>
      </div>
      {err && <p style={{ fontSize: 12.5, color: '#B91C1C', marginTop: 8 }}>{err}</p>}
      {report && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 13, color: T.charcoal, marginBottom: 8 }}>
            {report.name ? `${report.name} · ` : ''}
            {report.email}
          </div>
          <div className="grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, textAlign: 'center' }}>
            <Fig label="Allocated" value={report.allocated} />
            <Fig label="Used" value={report.used} />
            <Fig label="Reclaimed" value={report.reclaimed} />
            <Fig label="Remaining" value={report.remaining} strong />
          </div>
          {report.ledger.length > 0 && (
            <div style={{ marginTop: 12 }}>
              {report.ledger.map((e, i) => (
                <div
                  key={i}
                  className="flex justify-between"
                  style={{ fontSize: 12, color: T.muted, padding: '4px 0', borderTop: `1px solid ${T.hairline}` }}
                >
                  <span>{fmtDate(e.at)}</span>
                  <span>
                    {e.kind === 'allocation' ? `Allocated ${e.credits}` : `Reclaimed ${-e.credits}`}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <a
              href={`/api/okr-ally/org/report/pdf?email=${encodeURIComponent(report.email)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Btn small variant="ghost">
                Download PDF
              </Btn>
            </a>
          </div>
          <p style={{ fontSize: 11, color: T.muted, marginTop: 8 }}>
            {report.organizationName} only — nothing from this person&apos;s personal account.
          </p>
        </div>
      )}
    </div>
  )
}

function Fig({ label, value, strong }: { label: string; value: number; strong?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: T.gold }}>
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-lora), serif',
          fontSize: 20,
          fontWeight: 600,
          color: strong ? T.emeraldDark : T.charcoal,
        }}
      >
        {value}
      </div>
    </div>
  )
}
