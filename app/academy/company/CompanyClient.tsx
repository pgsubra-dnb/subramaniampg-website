'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

interface Employee {
  assignmentId: string
  email: string
  name: string | null
  status: 'assigned' | 'revoked'
  enrolmentPending: boolean
  started: boolean
  completed: boolean
  assignedAt: string
}
interface CoursePool {
  courseSeatsId: string
  courseId: string
  courseSlug: string
  courseTitle: string
  purchased: number
  assigned: number
  available: number
  employees: Employee[]
}
interface Status {
  authenticated: boolean
  isAdmin: boolean
  organization?: { id: string; name: string; gstin: string }
  courses?: CoursePool[]
}

const brown = '#633806'
const ink = '#2C2C2A'
const muted = '#5F5E5A'

export default function CompanyClient() {
  const [status, setStatus] = useState<Status | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/academy/corporate/status')
      if (r.status === 401) {
        setStatus({ authenticated: false, isAdmin: false })
        return
      }
      setStatus(await r.json())
    } catch {
      setStatus({ authenticated: false, isAdmin: false })
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (!status) return <p style={{ color: muted }}>Loading…</p>

  if (!status.authenticated) {
    return (
      <div>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, color: ink }}>Your company’s seats</h1>
        <p style={{ color: muted, marginTop: 12 }}>
          Sign in with your admin email address to manage your team’s seats.
        </p>
        <Link
          href="/academy/login"
          style={{
            display: 'inline-block',
            marginTop: 14,
            background: brown,
            color: '#FAEEDA',
            padding: '10px 18px',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Go to sign in
        </Link>
      </div>
    )
  }

  if (!status.isAdmin) {
    return (
      <div>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, color: ink }}>Your company’s seats</h1>
        <p style={{ color: muted, marginTop: 12 }}>
          This email address doesn’t manage any company’s seats. If your company bought seats, the
          person named as admin at checkout manages them — or{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: brown, fontWeight: 600 }}>
            email us
          </a>
          .
        </p>
        <p style={{ marginTop: 14 }}>
          <Link href="/academy/company/buy" style={{ color: brown, fontWeight: 600 }}>
            Buy seats for your team →
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 24, color: ink, margin: 0 }}>
          {status.organization?.name}
        </h1>
        <span style={{ fontSize: 12, color: muted }}>GSTIN {status.organization?.gstin}</span>
      </div>

      <div style={{ display: 'flex', gap: 16, margin: '10px 0 24px', flexWrap: 'wrap' }}>
        <Link href="/academy/company/buy" style={{ color: brown, fontWeight: 600, fontSize: 13.5 }}>
          Buy more seats →
        </Link>
        <a
          href="/api/academy/corporate/report/pdf"
          style={{ color: brown, fontWeight: 600, fontSize: 13.5 }}
        >
          Download usage report (PDF) →
        </a>
      </div>

      {msg && (
        <div
          style={{
            marginBottom: 16,
            fontSize: 13.5,
            borderRadius: 8,
            padding: '10px 14px',
            background: msg.kind === 'ok' ? '#E1F5EE' : '#FBEAEA',
            color: msg.kind === 'ok' ? '#0F6E56' : '#B91C1C',
            border: `1px solid ${msg.kind === 'ok' ? '#B7E4D3' : '#F0C9C9'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      {(status.courses ?? []).length === 0 && (
        <p style={{ color: muted }}>
          No seats yet.{' '}
          <Link href="/academy/company/buy" style={{ color: brown, fontWeight: 600 }}>
            Buy some →
          </Link>
        </p>
      )}

      {(status.courses ?? []).map((c) => (
        <CoursePoolCard key={c.courseSeatsId} pool={c} onChange={load} setMsg={setMsg} />
      ))}
    </div>
  )
}

function CoursePoolCard({
  pool,
  onChange,
  setMsg,
}: {
  pool: CoursePool
  onChange: () => void
  setMsg: (m: { kind: 'ok' | 'err'; text: string } | null) => void
}) {
  const [email, setEmail] = useState('')
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [busy, setBusy] = useState(false)
  const [rowErrors, setRowErrors] = useState<{ row: number; email: string; error: string }[]>([])

  async function assignOne() {
    if (!email.trim()) return
    setBusy(true)
    setRowErrors([])
    setMsg(null)
    try {
      const r = await fetch('/api/academy/corporate/assign', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseSeatsId: pool.courseSeatsId, email: email.trim() }),
      })
      const j = await r.json()
      if (j.ok) {
        setMsg({
          kind: 'ok',
          text:
            `${j.email} assigned a seat` +
            (j.enrolled
              ? j.emailed
                ? ' and emailed a login link.'
                : ' — enrolled, but the email did not send. Use Resend.'
              : ' — enrolment is pending. Use Resend.'),
        })
        setEmail('')
        onChange()
      } else {
        setMsg({ kind: 'err', text: j.error || 'Could not assign that seat.' })
      }
    } finally {
      setBusy(false)
    }
  }

  async function assignBulk() {
    if (!bulkText.trim()) return
    setBusy(true)
    setRowErrors([])
    setMsg(null)
    try {
      const r = await fetch('/api/academy/corporate/assign/bulk', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ courseSeatsId: pool.courseSeatsId, text: bulkText }),
      })
      const j = await r.json()
      if (j.ok) {
        const pending = j.results.filter((x: { enrolled: boolean }) => !x.enrolled).length
        setMsg({
          kind: 'ok',
          text:
            `${j.assigned} seat${j.assigned === 1 ? '' : 's'} assigned.` +
            (pending ? ` ${pending} enrolment${pending === 1 ? '' : 's'} pending — use Resend.` : ''),
        })
        setBulkText('')
        setBulkOpen(false)
        onChange()
      } else {
        setRowErrors(j.errors || [])
        setMsg({ kind: 'err', text: 'Nothing was assigned — fix the rows below and try again.' })
      }
    } finally {
      setBusy(false)
    }
  }

  async function act(path: string, assignmentId: string, okText: string) {
    setBusy(true)
    setMsg(null)
    try {
      const r = await fetch(path, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ assignmentId }),
      })
      const j = await r.json()
      if (j.ok) {
        setMsg({ kind: 'ok', text: okText })
        onChange()
      } else {
        setMsg({ kind: 'err', text: j.error || 'That didn’t work.' })
      }
    } finally {
      setBusy(false)
    }
  }

  const active = pool.employees.filter((e) => e.status === 'assigned')

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #D3D1C7',
        borderRadius: 10,
        padding: 16,
        marginBottom: 18,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 6 }}>
        <h2 style={{ fontFamily: 'Lora, serif', fontSize: 18, color: ink, margin: 0 }}>{pool.courseTitle}</h2>
        <span style={{ fontSize: 12.5, color: muted }}>
          {pool.purchased} purchased · {pool.assigned} assigned ·{' '}
          <strong style={{ color: pool.available > 0 ? '#0F6E56' : '#B91C1C' }}>{pool.available} available</strong>
        </span>
      </div>

      {/* Assign */}
      <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && assignOne()}
          placeholder="employee@company.com"
          style={{
            flex: '1 1 220px',
            padding: '9px 12px',
            border: '1px solid #D3D1C7',
            borderRadius: 8,
            fontSize: 13.5,
            background: '#fff',
            color: ink,
          }}
        />
        <button
          onClick={assignOne}
          disabled={busy || pool.available < 1 || !email.trim()}
          style={{
            padding: '9px 16px',
            background: brown,
            color: '#FAEEDA',
            border: 'none',
            borderRadius: 8,
            fontSize: 13.5,
            fontWeight: 600,
            opacity: busy || pool.available < 1 || !email.trim() ? 0.6 : 1,
          }}
        >
          Assign
        </button>
      </div>

      <button
        onClick={() => setBulkOpen((v) => !v)}
        style={{ marginTop: 8, background: 'none', border: 'none', color: brown, fontSize: 12.5, cursor: 'pointer', padding: 0 }}
      >
        {bulkOpen ? 'Hide bulk assign' : 'Assign several at once'}
      </button>

      {bulkOpen && (
        <div style={{ marginTop: 8 }}>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            placeholder={'One email per line, or paste a CSV with an "email" column'}
            style={{
              width: '100%',
              minHeight: 90,
              padding: '9px 12px',
              border: '1px solid #D3D1C7',
              borderRadius: 8,
              fontSize: 13,
              fontFamily: 'ui-monospace, monospace',
              background: '#fff',
              color: ink,
              resize: 'vertical',
            }}
          />
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
            <input
              type="file"
              accept=".csv,text/csv,text/plain"
              onChange={async (e) => {
                const f = e.target.files?.[0]
                if (f) setBulkText(await f.text())
              }}
              style={{ fontSize: 12 }}
            />
            <a href="/api/academy/corporate/assign/template" style={{ fontSize: 12, color: brown }}>
              template.csv
            </a>
            <button
              onClick={assignBulk}
              disabled={busy || !bulkText.trim()}
              style={{
                marginLeft: 'auto',
                padding: '8px 16px',
                background: brown,
                color: '#FAEEDA',
                border: 'none',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                opacity: busy || !bulkText.trim() ? 0.6 : 1,
              }}
            >
              Assign all
            </button>
          </div>
          {rowErrors.length > 0 && (
            <ul style={{ marginTop: 8, fontSize: 12, color: '#B91C1C', paddingLeft: 18 }}>
              {rowErrors.map((e, i) => (
                <li key={i}>
                  {e.row > 0 ? `Line ${e.row}: ` : ''}
                  {e.email ? `${e.email} — ` : ''}
                  {e.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* People */}
      {active.length > 0 && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ textAlign: 'left', color: muted, fontSize: 11.5 }}>
                <th style={{ padding: '6px 8px 6px 0' }}>Employee</th>
                <th style={{ padding: '6px 8px' }}>Progress</th>
                <th style={{ padding: '6px 0' }} />
              </tr>
            </thead>
            <tbody>
              {active.map((e) => {
                const progress = e.enrolmentPending
                  ? 'Enrolment pending'
                  : e.completed
                    ? 'Completed'
                    : e.started
                      ? 'In progress'
                      : 'Not started'
                return (
                  <tr key={e.assignmentId} style={{ borderTop: '1px solid #EFEDE6' }}>
                    <td style={{ padding: '8px 8px 8px 0', color: ink }}>
                      {e.name ? (
                        <>
                          {e.name}
                          <span style={{ color: muted }}> &lt;{e.email}&gt;</span>
                        </>
                      ) : (
                        e.email
                      )}
                    </td>
                    <td style={{ padding: '8px', color: e.started || e.completed ? '#0F6E56' : muted }}>{progress}</td>
                    <td style={{ padding: '8px 0', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() =>
                          act('/api/academy/corporate/resend', e.assignmentId, `Login link re-sent to ${e.email}.`)
                        }
                        disabled={busy}
                        style={pillBtn}
                      >
                        {e.enrolmentPending ? 'Resend' : 'Resend link'}
                      </button>
                      <button
                        onClick={() =>
                          act(
                            '/api/academy/corporate/revoke',
                            e.assignmentId,
                            `${e.email}'s seat returned to the pool.`
                          )
                        }
                        disabled={busy || e.started || e.completed}
                        title={e.started || e.completed ? 'They have started — the seat can’t be reclaimed' : undefined}
                        style={{ ...pillBtn, color: e.started || e.completed ? '#B7B4AC' : '#B91C1C' }}
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

const pillBtn: React.CSSProperties = {
  background: 'none',
  border: '1px solid #D3D1C7',
  borderRadius: 999,
  padding: '3px 10px',
  fontSize: 11.5,
  color: '#5F5E5A',
  cursor: 'pointer',
  marginLeft: 6,
}
