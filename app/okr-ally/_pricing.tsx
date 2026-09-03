'use client'

import { useEffect, useState } from 'react'
import { AllyRow, Btn, T } from './_ui'
import { GST_STATES, GSTIN_RE } from '@/lib/indiaGstStates'
import { type Brand, DEFAULT_BRAND, vocab, reviewCount } from '@/lib/okrAllyBrand'

interface Pack {
  id: string
  label: string
  credits: number
  base: number
  gst: number
  total: number
  perReview: number
}
interface Status {
  creditsRemaining: number
  personalCredits: number
  orgCredits: { name: string; credits: number }[]
  freeReviewAvailable: boolean
  packs: Pack[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RazorpayCtor = new (opts: any) => { open: () => void }

const money = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * Coupon codes aren't being issued right now, so a visible "enter a coupon code"
 * field just moves the "…where do I get one?" confusion to the checkout screen
 * (same reasoning as the Help copy). This only hides the input — the whole
 * coupon mechanism (validate-coupon, applyCoupon, price adjustment, the
 * one-per-account free-first-review coupon) is untouched. Flip to true if a
 * coupon is ever issued.
 */
const SHOW_COUPON_FIELD = false

export default function PricingTab({
  onBalanceChange,
  brand = DEFAULT_BRAND,
}: {
  onBalanceChange: (n: number) => void
  brand?: Brand
}) {
  const v = vocab(brand)
  const [status, setStatus] = useState<Status | null>(null)
  const [state, setState] = useState('')
  const [gstin, setGstin] = useState('')
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState<{ code: string; pricing: Record<string, Pack> } | null>(null)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/okr-ally/status')
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
    return () => {
      document.body.removeChild(s)
    }
  }, [])

  function priceFor(p: Pack): Pack {
    return couponApplied?.pricing[p.id] ?? p
  }

  async function applyCoupon() {
    if (!coupon.trim()) return
    setCouponMsg(null)
    const r = await fetch('/api/okr-ally/validate-coupon', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ code: coupon.trim() }),
    })
    const j = await r.json()
    if (j.valid) {
      const pricing: Record<string, Pack> = {}
      for (const row of j.pricing as { pack: string; credits: number; base: number; gst: number; total: number }[]) {
        const base = status!.packs.find((p) => p.id === row.pack)!
        pricing[row.pack] = { ...base, base: row.base, gst: row.gst, total: row.total }
      }
      setCouponApplied({ code: j.code, pricing })
      setCouponMsg(`${j.discountPercent}% off applied.`)
    } else {
      setCouponApplied(null)
      setCouponMsg(j.reason || 'That coupon is not valid.')
    }
  }

  const gstinInvalid = gstin.trim().length > 0 && !GSTIN_RE.test(gstin.trim().toUpperCase())

  async function buy(pack: Pack) {
    setMsg(null)
    if (!state) {
      setMsg({ kind: 'err', text: 'Choose your state — it sets the place of supply on the invoice.' })
      return
    }
    if (gstinInvalid) {
      setMsg({ kind: 'err', text: 'That GSTIN isn’t in the right format — 15 characters, e.g. 29ABCDE1234F1Z5. Clear it or fix it.' })
      return
    }
    setBusy(pack.id)
    try {
      const r = await fetch('/api/okr-ally/create-order', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pack: pack.id,
          brand,
          buyerState: state,
          buyerGstin: gstin.trim() || undefined,
          couponCode: couponApplied?.code,
        }),
      })
      const order = await r.json()
      if (!r.ok) {
        setMsg({ kind: 'err', text: order.applyAtSubmission ? order.error : order.error || 'Could not start the payment.' })
        setBusy(null)
        return
      }
      if (order.free) {
        setMsg({ kind: 'ok', text: `${reviewCount(brand, order.credits)} added.` })
        refresh()
        setBusy(null)
        return
      }

      const Razorpay = (window as unknown as { Razorpay: RazorpayCtor }).Razorpay
      const rzp = new Razorpay({
        key: order.keyId,
        amount: order.amount,
        currency: 'INR',
        name: v.product,
        description: reviewCount(brand, order.credits),
        order_id: order.orderId,
        prefill: order.prefill,
        theme: { color: T.primary },
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
              text: `Payment confirmed — ${reviewCount(brand, order.credits)} added. Your GST invoice is on its way by email.`,
            })
            refresh()
          } else {
            setMsg({ kind: 'err', text: 'Payment could not be verified. If you were charged, email pgs@embiggen.co.in.' })
          }
          setBusy(null)
        },
        modal: {
          ondismiss: () => {
            setMsg({ kind: 'err', text: 'Payment was not completed — you have not been charged.' })
            setBusy(null)
          },
        },
      })
      rzp.open()
    } catch {
      setMsg({ kind: 'err', text: 'Could not start the payment. Try again.' })
      setBusy(null)
    }
  }

  function refresh() {
    fetch('/api/okr-ally/status')
      .then((r) => r.json())
      .then((s: Status) => {
        setStatus(s)
        onBalanceChange(s.creditsRemaining)
      })
      .catch(() => {})
  }

  if (!status) return <p style={{ color: T.muted, fontSize: 14 }}>Loading…</p>

  return (
    <div>
      <AllyRow>
        You have <strong>{status.creditsRemaining}</strong>{' '}
        {status.creditsRemaining === 1 ? v.review : v.reviews}.
        {status.orgCredits.length > 0 && (
          <span style={{ display: 'block', marginTop: 4, fontSize: 12.5, opacity: 0.85 }}>
            {status.personalCredits} personal ·{' '}
            {status.orgCredits.map((o) => `${o.credits} from ${o.name}`).join(' · ')}. Company{' '}
            {v.reviews} are spent first.
          </span>
        )}
        {status.freeReviewAvailable && ` Your first review is free — it won't touch your ${v.reviews}.`}
      </AllyRow>

      {msg && (
        <div
          className="mb-4 text-sm rounded-lg px-4 py-3"
          style={
            msg.kind === 'ok'
              ? { background: T.emeraldTint, color: T.emeraldDark, border: `1px solid ${T.emeraldBorder}` }
              : { background: T.errorLight, color: T.error, border: `1px solid ${T.errorBorder}` }
          }
        >
          {msg.text}
        </div>
      )}

      <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
        {status.packs.map((p) => {
          const price = priceFor(p)
          return (
            <div
              key={p.id}
              style={{
                background: p.id === 'pack10' ? T.emerald : T.card,
                color: p.id === 'pack10' ? '#fff' : T.charcoal,
                border: p.id === 'pack10' ? 'none' : `1px solid ${T.hairline}`,
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, fontSize: 15 }}>{p.label}</div>
              <div style={{ fontSize: 12.5, opacity: 0.85 }}>
                {reviewCount(brand, p.credits)} · {money(price.perReview ?? p.base / p.credits)} each
              </div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, fontFamily: 'var(--font-inter), sans-serif' }}>
                {money(price.total)}
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.8 }}>
                {money(price.base)} + {money(price.gst)} GST
              </div>
              <button
                onClick={() => buy(p)}
                disabled={busy !== null || gstinInvalid}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '8px 0',
                  borderRadius: 8,
                  border: p.id === 'pack10' ? '1px solid rgba(255,255,255,.5)' : `1px solid ${T.emerald}`,
                  background: p.id === 'pack10' ? '#fff' : T.emerald,
                  color: p.id === 'pack10' ? T.emeraldDark : '#fff',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: busy ? 'not-allowed' : 'pointer',
                  opacity: busy && busy !== p.id ? 0.6 : 1,
                }}
              >
                {busy === p.id ? 'Opening…' : 'Buy'}
              </button>
            </div>
          )
        })}
      </div>

      <div style={{ background: T.card, border: `1px solid ${T.hairline}`, borderRadius: 12, padding: 16 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: T.gold, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10 }}>
          Billing details
        </div>
        <label style={{ display: 'block', fontSize: 12.5, color: T.muted, marginBottom: 4 }}>State (place of supply) *</label>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          style={{ width: '100%', padding: '9px 10px', borderRadius: 8, border: `1px solid ${T.hairline}`, fontSize: 13.5, background: '#fff', marginBottom: 10 }}
        >
          <option value="">Select your state…</option>
          {GST_STATES.map((s) => (
            <option key={s.code} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <label style={{ display: 'block', fontSize: 12.5, color: T.muted, marginBottom: 4 }}>GSTIN (optional — for input tax credit)</label>
        <input
          value={gstin}
          onChange={(e) => setGstin(e.target.value.toUpperCase())}
          placeholder="e.g. 29ABCDE1234F1Z5"
          maxLength={15}
          style={{
            width: '100%',
            padding: '9px 10px',
            borderRadius: 8,
            border: `1px solid ${gstinInvalid ? T.error : T.hairline}`,
            fontSize: 13.5,
            marginBottom: gstinInvalid ? 2 : 10,
          }}
        />
        {gstinInvalid && (
          <p style={{ fontSize: 11.5, color: T.error, margin: '0 0 10px' }}>
            Not a valid GSTIN — it&apos;s 15 characters: 2-digit state code, then the 10-character PAN, then 3 more.
          </p>
        )}
        {SHOW_COUPON_FIELD && (
          <>
            <label style={{ display: 'block', fontSize: 12.5, color: T.muted, marginBottom: 4 }}>Coupon code (optional)</label>
            <div className="flex gap-2">
              <input
                value={coupon}
                onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                placeholder="Code"
                style={{ flex: 1, padding: '9px 10px', borderRadius: 8, border: `1px solid ${T.hairline}`, fontSize: 13.5 }}
              />
              <Btn small variant="ghost" onClick={applyCoupon}>
                Apply
              </Btn>
            </div>
            {couponMsg && (
              <p style={{ fontSize: 12, color: couponApplied ? T.emeraldDark : T.error, margin: '6px 0 0' }}>{couponMsg}</p>
            )}
          </>
        )}
      </div>

      <p style={{ fontSize: 11.5, color: T.muted, marginTop: 12 }}>
        GST is 18%. A numbered GST invoice is emailed for every purchase. Your first review is free, one per account.
      </p>

      <a
        href={`${v.path}/corporate`}
        style={{
          display: 'block',
          marginTop: 18,
          textDecoration: 'none',
          background: T.emeraldTint,
          border: `1px solid ${T.emeraldBorder}`,
          borderRadius: 12,
          padding: 16,
        }}
      >
        <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, fontSize: 15, color: T.bubbleText }}>
          Looking for team or company {v.reviews}?
        </div>
        <div style={{ fontSize: 12.5, color: T.bubbleText, opacity: 0.85, marginTop: 4 }}>
          Buy a pool of 100, 200 or 500 {v.reviews} against your company GSTIN and hand them to your team.
          One GST invoice, one admin, clean cost reporting.
        </div>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: T.emeraldDark, marginTop: 8 }}>
          See corporate bundles →
        </div>
      </a>
    </div>
  )
}
