'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { GST_STATES, GSTIN_RE } from '@/lib/indiaGstStates'

interface Course {
  id: string
  slug: string
  title: string
  price: number
  shortDescription: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RazorpayCtor = new (opts: any) => { open: () => void }

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function BuyClient({ courses }: { courses: Course[] }) {
  const [courseSlug, setCourseSlug] = useState(courses[0]?.slug ?? '')
  const [seats, setSeats] = useState(5)
  const [companyName, setCompanyName] = useState('')
  const [gstin, setGstin] = useState('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [coupon, setCoupon] = useState('')
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  const course = useMemo(() => courses.find((c) => c.slug === courseSlug), [courses, courseSlug])

  useEffect(() => {
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
    return () => {
      document.body.removeChild(s)
    }
  }, [])

  const gstinInvalid = gstin.trim().length > 0 && !GSTIN_RE.test(gstin.trim().toUpperCase())

  // Indicative price (server recomputes and may apply a coupon).
  const listPrice = (course?.price ?? 0) * seats
  const gst = Math.round(listPrice * 0.18)
  const total = listPrice + gst

  async function buy() {
    setMsg(null)
    if (!course) return setMsg({ kind: 'err', text: 'Pick a course.' })
    if (!Number.isInteger(seats) || seats < 1) return setMsg({ kind: 'err', text: 'Choose at least 1 seat.' })
    if (companyName.trim().length < 2) return setMsg({ kind: 'err', text: 'Enter the company name.' })
    if (gstinInvalid || !gstin.trim()) return setMsg({ kind: 'err', text: 'Enter a valid company GSTIN.' })
    if (address.trim().length < 10) return setMsg({ kind: 'err', text: 'Enter the registered address.' })
    if (!state) return setMsg({ kind: 'err', text: 'Select the state (place of supply).' })
    if (!EMAIL_RE.test(buyerEmail.trim())) return setMsg({ kind: 'err', text: 'Enter a valid billing email.' })
    if (!EMAIL_RE.test(adminEmail.trim())) return setMsg({ kind: 'err', text: 'Enter a valid designated-admin email.' })
    if (!terms) return setMsg({ kind: 'err', text: 'Please accept the Terms and Refund Policy.' })

    setBusy(true)
    try {
      const r = await fetch('/api/academy/corporate/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          courseSlug,
          seats,
          companyName: companyName.trim(),
          gstin: gstin.trim().toUpperCase(),
          registeredAddress: address.trim(),
          buyerState: state,
          buyerEmail: buyerEmail.trim().toLowerCase(),
          adminEmail: adminEmail.trim().toLowerCase(),
          couponCode: coupon.trim() || undefined,
        }),
      })
      const order = await r.json()
      if (!r.ok) {
        setMsg({ kind: 'err', text: order.error || 'Could not start the payment.' })
        setBusy(false)
        return
      }

      const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay
      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'Embiggen Academy',
        description: `${order.seats} seat${order.seats === 1 ? '' : 's'} — ${order.courseTitle}`,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: '#633806' },
        handler: async (resp: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) => {
          const vr = await fetch('/api/academy/corporate/verify-payment', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(resp),
          })
          const vj = await vr.json()
          if (vj.success) {
            setMsg({
              kind: 'ok',
              text:
                `Payment confirmed — ${vj.seats} seat${vj.seats === 1 ? '' : 's'} of ${vj.courseTitle} added. ` +
                `${vj.adminEmail} can now sign in at /academy/company to assign them. ` +
                (vj.invoiceUnissued
                  ? 'Your GST invoice will follow shortly by email.'
                  : 'The GST invoice is on its way by email.'),
            })
          } else {
            setMsg({
              kind: 'err',
              text: 'Payment could not be verified. If you were charged, email pgs@embiggen.co.in.',
            })
          }
          setBusy(false)
        },
        modal: {
          ondismiss: () => {
            setMsg({ kind: 'err', text: 'Payment was not completed — you have not been charged.' })
            setBusy(false)
          },
        },
      })
      rzp.open()
    } catch {
      setMsg({ kind: 'err', text: 'Could not start the payment. Try again.' })
      setBusy(false)
    }
  }

  const input: React.CSSProperties = {
    width: '100%',
    padding: '10px 12px',
    border: '1px solid #D3D1C7',
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
    color: '#2C2C2A',
  }
  const label: React.CSSProperties = { display: 'block', fontSize: 12.5, color: '#5F5E5A', margin: '10px 0 4px' }

  if (courses.length === 0) {
    return (
      <div>
        <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, color: '#2C2C2A' }}>Buy seats for your team</h1>
        <p style={{ color: '#5F5E5A', marginTop: 12 }}>
          No paid courses are open for enrolment right now. Email{' '}
          <a href="mailto:pgs@embiggen.co.in" style={{ color: '#633806', fontWeight: 600 }}>
            pgs@embiggen.co.in
          </a>
          .
        </p>
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'Lora, serif', fontSize: 26, color: '#2C2C2A', margin: '0 0 8px' }}>
        Buy Academy seats for your team
      </h1>
      <p style={{ color: '#5F5E5A', fontSize: 14, lineHeight: 1.6, marginBottom: 20 }}>
        Buy seats for one course against your company GSTIN. A designated admin then assigns
        each seat to a colleague&apos;s email — they&apos;re enrolled automatically and get their own
        login link. One GST invoice, addressed to the company.
      </p>

      <label style={label}>Course *</label>
      <select style={input} value={courseSlug} onChange={(e) => setCourseSlug(e.target.value)}>
        {courses.map((c) => (
          <option key={c.slug} value={c.slug}>
            {c.title} — {money(c.price)} / seat
          </option>
        ))}
      </select>

      <label style={label}>Number of seats *</label>
      <input
        style={{ ...input, maxWidth: 160 }}
        type="number"
        min={1}
        max={500}
        value={seats}
        onChange={(e) => setSeats(Math.max(1, Math.floor(Number(e.target.value) || 1)))}
      />
      <p style={{ fontSize: 11.5, color: '#888780', margin: '4px 0 0' }}>
        Need more than 500? Email pgs@embiggen.co.in.
      </p>

      <div style={{ background: '#F1EFE8', borderRadius: 10, padding: 14, margin: '16px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 4 }}>
          <span style={{ color: '#5F5E5A' }}>
            {seats} × {money(course?.price ?? 0)}
          </span>
          <span style={{ color: '#2C2C2A' }}>{money(listPrice)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 6 }}>
          <span style={{ color: '#5F5E5A' }}>GST (18%)</span>
          <span style={{ color: '#2C2C2A' }}>{money(gst)}</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 15,
            fontWeight: 700,
            borderTop: '1px solid #D3D1C7',
            paddingTop: 6,
            color: '#2C2C2A',
          }}
        >
          <span>Total</span>
          <span>{money(total)}</span>
        </div>
        <p style={{ fontSize: 11, color: '#888780', margin: '6px 0 0' }}>
          Indicative — a coupon, if any, is applied at payment.
        </p>
      </div>

      <div
        style={{
          background: '#fff',
          border: '1px solid #D3D1C7',
          borderRadius: 10,
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#633806',
            textTransform: 'uppercase',
            letterSpacing: '.05em',
          }}
        >
          Company details
        </div>

        <label style={label}>Company name *</label>
        <input style={input} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

        <label style={label}>Company GSTIN *</label>
        <input
          style={{ ...input, borderColor: gstinInvalid ? '#B91C1C' : '#D3D1C7' }}
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="e.g. 29ABCDE1234F1Z5"
          maxLength={15}
        />
        {gstinInvalid && (
          <p style={{ fontSize: 11.5, color: '#B91C1C', margin: '2px 0 0' }}>Not a valid GSTIN — 15 characters.</p>
        )}

        <label style={label}>Registered address *</label>
        <textarea
          style={{ ...input, resize: 'vertical', minHeight: 60 }}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />

        <label style={label}>State (place of supply) *</label>
        <select style={input} value={state} onChange={(e) => setState(e.target.value)}>
          <option value="">Select your state…</option>
          {GST_STATES.map((s) => (
            <option key={s.code} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>

        <label style={label}>Billing email *</label>
        <input
          style={input}
          value={buyerEmail}
          onChange={(e) => setBuyerEmail(e.target.value)}
          placeholder="where the GST invoice goes"
        />

        <label style={label}>Designated admin email *</label>
        <input
          style={input}
          value={adminEmail}
          onChange={(e) => setAdminEmail(e.target.value)}
          placeholder="who will assign seats"
        />
        <p style={{ fontSize: 11.5, color: '#888780', margin: '4px 0 0' }}>
          Can be you or a colleague. They sign in at{' '}
          <span style={{ fontFamily: 'ui-monospace, monospace' }}>/academy/company</span> to assign and
          reclaim seats.
        </p>

        <label style={label}>Coupon (optional)</label>
        <input
          style={{ ...input, maxWidth: 220 }}
          value={coupon}
          onChange={(e) => setCoupon(e.target.value.toUpperCase())}
        />

        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '14px 0 0', cursor: 'pointer' }}>
          <input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} style={{ marginTop: 3 }} />
          <span style={{ fontSize: 12, color: '#5F5E5A' }}>
            I have read and agree to the{' '}
            <Link href="/terms" target="_blank" style={{ color: '#633806' }}>
              Terms
            </Link>{' '}
            and{' '}
            <Link href="/refund-policy" target="_blank" style={{ color: '#633806' }}>
              Refund Policy
            </Link>
            .
          </span>
        </label>

        <button
          onClick={buy}
          disabled={busy || gstinInvalid}
          style={{
            marginTop: 14,
            width: '100%',
            padding: '12px 16px',
            background: '#633806',
            color: '#FAEEDA',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy || gstinInvalid ? 0.6 : 1,
          }}
        >
          {busy ? 'Opening…' : `Pay ${money(total)}`}
        </button>
      </div>

      {msg && (
        <div
          style={{
            marginTop: 16,
            fontSize: 13.5,
            borderRadius: 8,
            padding: '12px 14px',
            background: msg.kind === 'ok' ? '#E1F5EE' : '#FBEAEA',
            color: msg.kind === 'ok' ? '#0F6E56' : '#B91C1C',
            border: `1px solid ${msg.kind === 'ok' ? '#B7E4D3' : '#F0C9C9'}`,
          }}
        >
          {msg.text}
        </div>
      )}

      <p style={{ fontSize: 12, color: '#888780', marginTop: 16 }}>
        <Link href="/academy" style={{ color: '#633806', fontWeight: 600 }}>
          ← Back to the Academy
        </Link>
      </p>
    </div>
  )
}
