'use client'

import { useEffect, useState } from 'react'
import { Page, TopBar, Btn, T, keyframes } from '../_ui'
import { GST_STATES, GSTIN_RE } from '@/lib/indiaGstStates'

/**
 * Corporate credit bundles — three fixed sizes, GST added on top. Nothing
 * self-serve above 500; the buyer emails PGS for more. Requires an OKR Ally
 * sign-in (the order is tied to the purchaser's user id). The designated org
 * admin is a separate field, so the buyer and the admin can be different people.
 */

const BUNDLES = [
  { id: 'b100', credits: 100, base: 6000 },
  { id: 'b200', credits: 200, base: 11000 },
  { id: 'b500', credits: 500, base: 25000 },
]
const gst = (b: number) => Math.round(b * 0.18)
const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RazorpayCtor = new (opts: any) => { open: () => void }

interface Me {
  authenticated: boolean
  user?: { name: string; email: string }
}

export default function CorporateClient() {
  const [me, setMe] = useState<Me | null>(null)
  const [bundle, setBundle] = useState('b200')
  const [companyName, setCompanyName] = useState('')
  const [gstin, setGstin] = useState('')
  const [address, setAddress] = useState('')
  const [state, setState] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/okr-ally/me')
      .then((r) => r.json())
      .then(setMe)
      .catch(() => setMe({ authenticated: false }))
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
    return () => {
      document.body.removeChild(s)
    }
  }, [])

  const gstinInvalid = gstin.trim().length > 0 && !GSTIN_RE.test(gstin.trim().toUpperCase())

  async function buy() {
    setMsg(null)
    if (!companyName.trim()) return setMsg({ kind: 'err', text: 'Enter the company name.' })
    if (gstinInvalid || !gstin.trim()) return setMsg({ kind: 'err', text: 'Enter a valid company GSTIN.' })
    if (address.trim().length < 10) return setMsg({ kind: 'err', text: 'Enter the registered address.' })
    if (!state) return setMsg({ kind: 'err', text: 'Select the state (place of supply).' })
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim()))
      return setMsg({ kind: 'err', text: 'Enter a valid designated-admin email.' })

    setBusy(true)
    try {
      const r = await fetch('/api/okr-ally/corporate/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          bundle,
          companyName: companyName.trim(),
          gstin: gstin.trim().toUpperCase(),
          registeredAddress: address.trim(),
          buyerState: state,
          adminEmail: adminEmail.trim().toLowerCase(),
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
        name: 'OKR Ally',
        description: `${order.credits} corporate review credits`,
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: '#1D9E75' },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const v = await fetch('/api/okr-ally/verify-payment', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(resp),
          })
          const vj = await v.json()
          if (vj.success) {
            setMsg({
              kind: 'ok',
              text:
                `Payment confirmed — ${order.credits} credits added to ${companyName.trim()}'s pool. ` +
                `${adminEmail.trim()} is now the company admin and can allocate them from the Company tab in OKR Ally. ` +
                (vj.invoiceUnissued
                  ? `Your GST invoice will follow shortly by email.`
                  : `The GST invoice is on its way by email.`),
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
    border: `1px solid ${T.hairline}`,
    borderRadius: 8,
    fontSize: 14,
    outline: 'none',
    background: '#fff',
  }
  const label: React.CSSProperties = { display: 'block', fontSize: 12.5, color: T.muted, margin: '10px 0 4px' }

  return (
    <Page>
      <style>{keyframes}</style>
      <TopBar />

      <h1 style={{ fontFamily: 'var(--font-lora), serif', fontSize: 22, fontWeight: 600, color: T.charcoal, margin: '0 0 6px' }}>
        Corporate credits
      </h1>
      <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, marginBottom: 18 }}>
        Buy a pool of review credits against your company GSTIN. A designated admin then allocates them
        to employee emails and can reclaim what&apos;s unused. One GST invoice, addressed to the company.
      </p>

      {me && !me.authenticated ? (
        <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 12, padding: 18 }}>
          <p style={{ fontSize: 14, color: T.charcoal, margin: 0 }}>
            Sign in to OKR Ally first, then come back here.
          </p>
          <div style={{ marginTop: 12 }}>
            <a href="/okr-ally">
              <Btn>Go to OKR Ally sign-in</Btn>
            </a>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
            {BUNDLES.map((b) => {
              const total = b.base + gst(b.base)
              const selected = bundle === b.id
              return (
                <button
                  key={b.id}
                  onClick={() => setBundle(b.id)}
                  style={{
                    textAlign: 'left',
                    background: selected ? T.emerald : T.card,
                    color: selected ? '#fff' : T.charcoal,
                    border: selected ? 'none' : `1px solid ${T.hairline}`,
                    borderRadius: 12,
                    padding: 16,
                    cursor: 'pointer',
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-lora), serif', fontWeight: 600, fontSize: 16 }}>
                    {b.credits} credits
                  </div>
                  <div style={{ fontSize: 12.5, opacity: 0.85 }}>{money(Math.round(b.base / b.credits))}/credit</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, fontFamily: 'var(--font-lora), serif' }}>
                    {money(total)}
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.8 }}>
                    {money(b.base)} + {money(gst(b.base))} GST
                  </div>
                </button>
              )
            })}
          </div>

          <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 18 }}>
            Need more than 500 credits? Email us at{' '}
            <a href="mailto:pgs@embiggen.co.in" style={{ color: T.emeraldDark, fontWeight: 600 }}>
              pgs@embiggen.co.in
            </a>{' '}
            to discuss.
          </p>

          <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: T.gold, textTransform: 'uppercase', letterSpacing: '.05em' }}>
              Company details
            </div>
            <label style={label}>Company name *</label>
            <input style={input} value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            <label style={label}>Company GSTIN *</label>
            <input
              style={{ ...input, borderColor: gstinInvalid ? '#DC2626' : T.hairline }}
              value={gstin}
              onChange={(e) => setGstin(e.target.value.toUpperCase())}
              placeholder="e.g. 29ABCDE1234F1Z5"
              maxLength={15}
            />
            {gstinInvalid && (
              <p style={{ fontSize: 11.5, color: '#B91C1C', margin: '2px 0 0' }}>
                Not a valid GSTIN — 15 characters.
              </p>
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
            <label style={label}>Designated admin email *</label>
            <input
              style={input}
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              placeholder="who will allocate the credits"
            />
            <p style={{ fontSize: 11.5, color: T.muted, margin: '4px 0 0' }}>
              Can be you or a colleague. They get a Company tab in OKR Ally to allocate and reclaim credits.
            </p>

            <div style={{ marginTop: 14 }}>
              <Btn onClick={buy} disabled={busy || gstinInvalid}>
                {busy ? 'Opening…' : 'Buy credits'}
              </Btn>
            </div>
          </div>

          {msg && (
            <div
              className="mt-4 text-sm rounded-lg px-4 py-3"
              style={
                msg.kind === 'ok'
                  ? { background: T.emeraldTint, color: T.emeraldDark, border: `1px solid ${T.emeraldBorder}` }
                  : { background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }
              }
            >
              {msg.text}
            </div>
          )}

          <p style={{ fontSize: 11.5, color: T.muted, marginTop: 14 }}>
            <a href="/okr-ally" style={{ color: T.emeraldDark, fontWeight: 600 }}>
              ← Back to OKR Ally
            </a>
          </p>
        </>
      )}
    </Page>
  )
}
