'use client'

import { useEffect, useRef, useState } from 'react'
import { AllyRow, Btn, T } from './_ui'
import { type Brand, DEFAULT_BRAND, vocab, reviewCount } from '@/lib/okrAllyBrand'
import { BUNDLES, gst } from '@/lib/okrAllyBundles'

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

export type Plan = 'corporate' | 'individual'
const PLANS: [Plan, string][] = [
  ['corporate', 'Corporate'],
  ['individual', 'Individual'],
]

/**
 * Coupon codes aren't being issued right now, so a visible "enter a coupon code"
 * field just moves the "…where do I get one?" confusion to the checkout screen
 * (same reasoning as the Help copy). This only hides the input — the whole
 * coupon mechanism (validate-coupon, applyCoupon, price adjustment, the
 * one-per-account free-first-review coupon) is untouched. Flip to true if a
 * coupon is ever issued. TEMPORARILY TRUE for the PCEP1 webinar coupon (valid to 10 Nov 2026). Set back to false after that.
 */
const SHOW_COUPON_FIELD = true

export default function PricingTab({
  onBalanceChange,
  brand = DEFAULT_BRAND,
  isDemo = false,
  initialPlan = 'corporate',
  signedIn = true,
  onRequireSignIn,
}: {
  onBalanceChange: (n: number) => void
  brand?: Brand
  /** Which rate card opens first — from `?plan=` in the URL; defaults to Corporate. */
  initialPlan?: Plan
  /** Signed-out visitors see the public rate card only — no balances, no coupon, and Buy asks them to sign in. */
  signedIn?: boolean
  onRequireSignIn?: (plan: Plan) => void
  /** Demo session — prices are shown for the audience, but buying is disabled. */
  isDemo?: boolean
}) {
  const v = vocab(brand)
  const [status, setStatus] = useState<Status | null>(null)
  const [coupon, setCoupon] = useState('')
  const [couponApplied, setCouponApplied] = useState<{ code: string; pricing: Record<string, Pack> } | null>(null)
  const [couponMsg, setCouponMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [plan, setPlan] = useState<Plan>(initialPlan)
  const tabRefs = useRef<Record<Plan, HTMLButtonElement | null>>({ corporate: null, individual: null })

  // Keep the URL in step with the selected rate card so the link is shareable
  // (…?tab=pricing&plan=corporate). Cleared again when leaving the Pricing tab.
  useEffect(() => {
    window.history.replaceState({}, '', `${v.path}?tab=pricing&plan=${plan}`)
  }, [plan, v.path])
  useEffect(
    () => () => {
      if (window.location.search.includes('plan=')) window.history.replaceState({}, '', v.path)
    },
    [v.path],
  )

  function onTabKey(e: React.KeyboardEvent, i: number) {
    const last = PLANS.length - 1
    const next =
      e.key === 'ArrowRight' ? (i === last ? 0 : i + 1)
      : e.key === 'ArrowLeft' ? (i === 0 ? last : i - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : -1
    if (next < 0) return
    e.preventDefault()
    setPlan(PLANS[next][0])
    tabRefs.current[PLANS[next][0]]?.focus()
  }

  useEffect(() => {
    if (!signedIn) {
      // Public read-only rate card — no user data.
      fetch('/api/okr-ally/pricing')
        .then((r) => r.json())
        .then((j: { packs: Pack[] }) =>
          setStatus({ creditsRemaining: 0, personalCredits: 0, orgCredits: [], freeReviewAvailable: false, packs: j.packs }),
        )
        .catch(() => {})
      return
    }
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
  }, [signedIn])

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


  async function buy(pack: Pack) {
    setMsg(null)
    if (!signedIn) {
      onRequireSignIn?.(plan)
      return
    }
    if (isDemo) {
      setMsg({ kind: 'err', text: 'Purchases are turned off in demo mode.' })
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
      {signedIn && (
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
      )}

      {isDemo && (
        <div
          className="mb-4 text-sm rounded-lg px-4 py-3"
          style={{ background: T.goldTint, color: T.gold, border: `1px solid ${T.gold}` }}
        >
          Demo mode — {v.reviews} are unlimited and nothing is charged. Prices below are for reference.
        </div>
      )}

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

      <div
        role="tablist"
        aria-label="Plan type"
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          marginBottom: 18,
          background: T.card,
          border: `1px solid ${T.hairline}`,
          borderRadius: 12,
        }}
      >
        {PLANS.map(([id, label], i) => {
          const active = plan === id
          return (
            <button
              key={id}
              ref={(el) => {
                tabRefs.current[id] = el
              }}
              role="tab"
              type="button"
              id={`plan-tab-${id}`}
              aria-selected={active}
              aria-controls={`plan-panel-${id}`}
              tabIndex={active ? 0 : -1}
              onClick={() => setPlan(id)}
              onKeyDown={(e) => onTabKey(e, i)}
              style={{
                flex: 1,
                minHeight: 44,
                padding: '10px 12px',
                borderRadius: 9,
                border: 'none',
                cursor: 'pointer',
                fontFamily: 'var(--font-inter), sans-serif',
                fontSize: 14,
                fontWeight: 700,
                background: active ? T.emerald : 'transparent',
                color: active ? '#fff' : T.muted,
                boxShadow: active ? '0 1px 3px rgba(0,0,0,.18)' : 'none',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" id="plan-panel-corporate" aria-labelledby="plan-tab-corporate" hidden={plan !== 'corporate'}>
        {plan === 'corporate' && (
          <>
            <p style={{ color: T.muted, fontSize: 14, lineHeight: 1.6, margin: '0 0 14px' }}>
              Buy a pool of {v.reviews} against your company GSTIN. A designated admin then allocates them
              to employee emails and can reclaim what&apos;s unused. One GST invoice, addressed to the company.
            </p>

            <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))' }}>
              {BUNDLES.map((b) => (
                <div
                  key={b.id}
                  style={{
                    background: b.id === 'b200' ? T.emerald : T.card,
                    color: b.id === 'b200' ? '#fff' : T.charcoal,
                    border: b.id === 'b200' ? 'none' : `1px solid ${T.hairline}`,
                    borderRadius: 12,
                    padding: 16,
                  }}
                >
                  <div style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, fontSize: 16 }}>
                    {reviewCount(brand, b.credits)}
                  </div>
                  <div style={{ fontSize: 12.5, opacity: 0.85 }}>{money(Math.round(b.base / b.credits))} each</div>
                  <div style={{ fontSize: 20, fontWeight: 700, marginTop: 8, fontFamily: 'var(--font-inter), sans-serif' }}>
                    {money(b.base + gst(b.base))}
                  </div>
                  <div style={{ fontSize: 11.5, opacity: 0.8 }}>
                    {money(b.base)} + {money(gst(b.base))} GST
                  </div>
                </div>
              ))}
            </div>

            <p style={{ fontSize: 12.5, color: T.muted, marginBottom: 14 }}>
              Need more than 500 {v.reviews}? Email us at{' '}
              <a href="mailto:pgs@embiggen.co.in" style={{ color: T.emeraldDark, fontWeight: 600 }}>
                pgs@embiggen.co.in
              </a>{' '}
              to discuss.
            </p>

            {!signedIn ? (
              <Btn onClick={() => onRequireSignIn?.('corporate')}>Buy {v.reviews}</Btn>
            ) : isDemo ? (
              <Btn onClick={() => setMsg({ kind: 'err', text: 'Purchases are turned off in demo mode.' })}>
                Buy {v.reviews}
              </Btn>
            ) : (
              <a href={`${v.path}/corporate`} style={{ textDecoration: 'none' }}>
                <Btn>Buy {v.reviews}</Btn>
              </a>
            )}
          </>
        )}
      </div>

      <div role="tabpanel" id="plan-panel-individual" aria-labelledby="plan-tab-individual" hidden={plan !== 'individual'}>
        {plan === 'individual' && (
          <>
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
                    disabled={busy !== null}
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
            <p style={{ fontSize: 12.5, color: T.muted, margin: '0 0 10px' }}>
              Your GST invoice is issued for Tamil Nadu: CGST 9% + SGST 9%.
            </p>
            {SHOW_COUPON_FIELD && signedIn && (
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
          </>
        )}
      </div>
    </div>
  )
}
