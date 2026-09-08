'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

interface Props {
  courseId: string
  courseSlug: string
  courseTitle: string
  price: number
  isEnrolled?: boolean
  onClose: () => void
  onSuccess: () => void
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

export default function EnrolmentModal({ courseId, courseSlug, courseTitle, price, isEnrolled, onClose }: Props) {
  const testPrice = process.env.NEXT_PUBLIC_TEST_COURSE_PRICE
  const effectivePrice = testPrice !== undefined ? Number(testPrice) : price

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // 'form' → collecting details; 'code' → 6-digit code entry (same tab);
  // 'done' → enrolled but we couldn't send a code, fall back to the login page.
  const [phase, setPhase] = useState<'form' | 'code' | 'done'>('form')
  const [code, setCode] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const [doneMessage, setDoneMessage] = useState('')
  const codeInputRef = useRef<HTMLInputElement>(null)

  // Paid flow state
  const [showCouponField, setShowCouponField] = useState(false)
  const [couponCode, setCouponCode] = useState('')
  const [couponError, setCouponError] = useState('')
  const [couponApplied, setCouponApplied] = useState(false)
  const [discountPercent, setDiscountPercent] = useState(0)
  const [termsAgreed, setTermsAgreed] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState('')

  const isPaid = effectivePrice > 0

  const discountedPrice = Math.round(effectivePrice * (1 - discountPercent / 100))
  const gst = Math.round(discountedPrice * 0.18)
  const total = discountedPrice + gst
  const isFreeAfterCoupon = couponApplied && discountPercent === 100

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (phase === 'code') codeInputRef.current?.focus()
  }, [phase])

  // Load Razorpay script when paid flow is active
  useEffect(() => {
    if (!isPaid) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
    return () => { document.body.removeChild(script) }
  }, [isPaid])

  async function handleApplyCoupon() {
    if (!couponCode.trim()) return
    setCouponError('')
    const res = await fetch('/api/validate-coupon', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: couponCode, courseSlug }),
    })
    const data = await res.json()
    if (data.valid) {
      setDiscountPercent(data.discountPercent)
      setCouponApplied(true)
      setCouponError('')
    } else {
      setCouponApplied(false)
      setDiscountPercent(0)
      setCouponError(data.reason || 'Invalid coupon')
    }
  }

  /** Request a 6-digit sign-in code for `email` and move to the code step.
   *  Falls back to the 'done' panel if the code email can't be sent. */
  async function sendCodeAndAdvance(fallbackMessage: string) {
    setCooldown(60)
    try {
      const res = await fetch('/api/academy/sign-in-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setPhase('code')
        return
      }
    } catch {
      /* fall through */
    }
    setDoneMessage(fallbackMessage)
    setPhase('done')
  }

  async function resendCode() {
    if (cooldown > 0) return
    setError('')
    setCooldown(60)
    await fetch('/api/academy/sign-in-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => {})
  }

  async function submitCode() {
    if (!/^\d{6}$/.test(code)) { setError('Enter the 6-digit code from the email.'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/academy/sign-in-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, redirect: `/academy/${courseSlug}` }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        window.location.assign(data.redirect || `/academy/${courseSlug}`)
      } else {
        setError(data.error || 'That code isn’t right. Check it and try again.')
      }
    } catch {
      setError('Something went wrong signing you in. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // Free course flow
  async function handleFreeSubmit() {
    if (!name || !email) { setError('Name and email are required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/academy/enrol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, courseId, courseSlug, courseTitle }),
      })
      const data = await res.json()
      if (data.success) {
        await sendCodeAndAdvance('You are enrolled. Open the course and choose “Log in” to get your sign-in code.')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // 100% coupon — enrol directly, skip name collection
  async function handleFreeEnrol() {
    if (!email) { setError('Email is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/academy/enrol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: email.split('@')[0], email, company: '', courseId, courseSlug, courseTitle }),
      })
      const data = await res.json()
      if (data.success) {
        await sendCodeAndAdvance('You are enrolled. Open the course and choose “Log in” to get your sign-in code.')
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePayNow() {
    if (!email) { setError('Email is required'); return }
    setSubmitting(true)
    setError('')
    setPaymentMessage('')
    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseSlug, discountPercent, email }),
      })
      const order = await orderRes.json()

      if (!orderRes.ok || order.error) {
        setError('Could not initiate payment. Please try again.')
        setSubmitting(false)
        return
      }

      if (order.free) {
        await handleFreeEnrol()
        return
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: 'INR',
        name: 'Embiggen Consulting LLP',
        description: courseTitle,
        order_id: order.orderId,
        prefill: { email },
        theme: { color: '#633806' },
        handler: async function (response: {
          razorpay_order_id: string
          razorpay_payment_id: string
          razorpay_signature: string
        }) {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              email,
              courseSlug,
            }),
          })
          const verifyData = await verifyRes.json()
          if (verifyData.success) {
            // verify-payment has already emailed a 6-digit code.
            setCooldown(60)
            setPhase('code')
            setPaymentMessage('Payment successful. We’ve emailed you a 6-digit sign-in code.')
          } else {
            setError('Payment verification failed. Please contact pgs@embiggen.co.in.')
          }
          setSubmitting(false)
        },
        modal: {
          ondismiss: function () {
            setPaymentMessage('Payment was not completed. You have not been charged.')
            setSubmitting(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch {
      setError('Could not initiate payment. Please try again.')
      setSubmitting(false)
    }
  }

  // Returning learner flow — email only, send a sign-in code
  async function handleReturningSubmit() {
    if (!email) { setError('Email is required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/academy/sign-in-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setCooldown(60)
        setPhase('code')
      } else {
        setError(data.error || 'Could not send a sign-in code. Please try again.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Code entry (same tab) ───────────────────────────────────────
  if (phase === 'code') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(44,44,42,0.6)' }}>
        <div className="w-full max-w-md rounded-lg p-8" style={{ background: '#FAF8F5' }}>
          <h2 className="text-xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
            Enter your sign-in code
          </h2>
          <p className="text-sm mb-5" style={{ color: '#5F5E5A' }}>
            {paymentMessage ? `${paymentMessage} ` : ''}We sent a 6-digit code to <strong>{email}</strong>.
            It expires in 15 minutes.
          </p>
          <input ref={codeInputRef} type="text" inputMode="numeric" autoComplete="one-time-code"
            value={code} maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => { if (e.key === 'Enter') submitCode() }}
            placeholder="123456"
            className="w-full px-4 py-3 rounded border outline-none mb-4 text-lg tracking-[0.4em]"
            style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
          {error && <p className="text-sm mb-4" style={{ color: '#E24B4A' }}>{error}</p>}
          <button onClick={submitCode} disabled={code.length !== 6 || submitting}
            className="w-full py-3 rounded text-sm font-medium"
            style={{ background: '#633806', color: '#FAEEDA', opacity: code.length !== 6 || submitting ? 0.6 : 1 }}>
            {submitting ? 'Signing you in…' : 'Sign in'}
          </button>
          <div className="flex items-center justify-between mt-4 text-xs" style={{ color: '#888780' }}>
            <span>Didn’t get it? Check spam or junk.</span>
            <button onClick={resendCode} disabled={cooldown > 0}
              style={{ color: cooldown > 0 ? '#B4B2A9' : '#633806' }}>
              {cooldown > 0 ? `Resend (${cooldown}s)` : 'Resend code'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Enrolled, but the code email couldn't be sent ───────────────
  if (phase === 'done') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(44,44,42,0.6)' }}>
        <div className="w-full max-w-md rounded-lg p-8 text-center" style={{ background: '#FAF8F5' }}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#E1F5EE' }}>
            <span style={{ color: '#1D9E75', fontSize: 28 }}>✓</span>
          </div>
          <h2 className="text-xl mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
            You are enrolled
          </h2>
          <p className="text-sm mb-5" style={{ color: '#5F5E5A' }}>{doneMessage}</p>
          <a href={`/academy/${courseSlug}`}
            className="inline-block px-6 py-2 rounded text-sm font-medium"
            style={{ background: '#633806', color: '#FAEEDA' }}>
            Go to the course
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,44,42,0.6)' }}>
      <div className="w-full max-w-md rounded-lg p-8" style={{ background: '#FAF8F5', maxHeight: '90vh', overflowY: 'auto' }}>
        <h2 className="text-2xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          Enrol in {courseTitle}
        </h2>

        {isEnrolled ? (
          // ── Returning learner — email confirmation only ────────────
          <>
            <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>
              Enter your registered email address and we’ll send you a 6-digit sign-in code.
            </p>
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: '#2C2C2A' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm outline-none"
                style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
            </div>
            {error && <p className="text-sm mb-4" style={{ color: '#E24B4A' }}>{error}</p>}
            <div className="flex gap-3">
              <button onClick={handleReturningSubmit} disabled={submitting || !email}
                className="flex-1 py-3 rounded text-sm font-medium"
                style={{ background: '#633806', color: '#FAEEDA', opacity: (submitting || !email) ? 0.6 : 1 }}>
                {submitting ? 'Sending...' : 'Send sign-in code'}
              </button>
              <button onClick={onClose}
                className="px-4 py-3 rounded text-sm border"
                style={{ borderColor: '#D3D1C7', color: '#5F5E5A' }}>
                Cancel
              </button>
            </div>
          </>
        ) : !isPaid ? (
          // ── Free course flow ──────────────────────────────────────
          <>
            <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>
              Free. No password needed. We send your progress and certificate by email.
            </p>

            {[
              { label: 'Full name', value: name, set: setName, type: 'text', required: true },
              { label: 'Email address', value: email, set: setEmail, type: 'email', required: true },
              { label: 'Company (optional)', value: company, set: setCompany, type: 'text', required: false },
            ].map(({ label, value, set, type, required }) => (
              <div key={label} className="mb-4">
                <label className="block text-xs font-medium mb-1" style={{ color: '#2C2C2A' }}>{label}</label>
                <input type={type} value={value} onChange={e => set(e.target.value)}
                  required={required}
                  className="w-full px-3 py-2 rounded border text-sm outline-none"
                  style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
              </div>
            ))}

            {error && <p className="text-sm mb-4" style={{ color: '#E24B4A' }}>{error}</p>}

            <div className="flex gap-3">
              <button onClick={handleFreeSubmit} disabled={submitting}
                className="flex-1 py-3 rounded text-sm font-medium"
                style={{ background: '#633806', color: '#FAEEDA', opacity: submitting ? 0.6 : 1 }}>
                {submitting ? 'Enrolling...' : 'Start learning'}
              </button>
              <button onClick={onClose}
                className="px-4 py-3 rounded text-sm border"
                style={{ borderColor: '#D3D1C7', color: '#5F5E5A' }}>
                Cancel
              </button>
            </div>

            <p className="text-xs mt-4 text-center" style={{ color: '#888780' }}>
              Already enrolled? <a href="/academy/login" style={{ color: '#633806' }}>Log in here</a>
            </p>
          </>
        ) : (
          // ── Paid course flow ──────────────────────────────────────
          <>
            <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>
              No password needed. After payment we email a 6-digit sign-in code you enter right here.
            </p>

            {/* Email */}
            <div className="mb-4">
              <label className="block text-xs font-medium mb-1" style={{ color: '#2C2C2A' }}>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded border text-sm outline-none"
                style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
            </div>

            {/* Base price + coupon link */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium" style={{ color: '#2C2C2A' }}>₹{effectivePrice}</span>
              {!showCouponField && (
                <button onClick={() => setShowCouponField(true)}
                  className="text-xs" style={{ color: '#1D9E75' }}>
                  Have a coupon?
                </button>
              )}
            </div>

            {/* Coupon field */}
            {showCouponField && (
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={e => { setCouponCode(e.target.value); setCouponApplied(false); setDiscountPercent(0) }}
                    placeholder="Enter coupon code"
                    className="flex-1 px-3 py-2 rounded border text-sm outline-none"
                    style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
                  <button onClick={handleApplyCoupon}
                    className="px-4 py-2 rounded text-sm font-medium"
                    style={{ background: '#1D9E75', color: '#fff' }}>
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs mt-1" style={{ color: '#1D9E75' }}>
                    ✓ {discountPercent}% discount applied
                  </p>
                )}
                {couponError && (
                  <p className="text-xs mt-1" style={{ color: '#E24B4A' }}>{couponError}</p>
                )}
              </div>
            )}

            {/* Price breakdown */}
            <div className="mb-4 p-3 rounded text-sm" style={{ background: '#F1EFE8' }}>
              <div className="flex justify-between mb-1">
                <span style={{ color: '#5F5E5A' }}>Course fee</span>
                <span style={{ color: '#2C2C2A' }}>₹{discountedPrice}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span style={{ color: '#5F5E5A' }}>GST (18%)</span>
                <span style={{ color: '#2C2C2A' }}>₹{gst}</span>
              </div>
              <div className="flex justify-between pt-2 font-semibold" style={{ borderTop: '1px solid #D3D1C7' }}>
                <span style={{ color: '#2C2C2A' }}>Total</span>
                <span style={{ color: '#2C2C2A' }}>₹{total}</span>
              </div>
            </div>

            {/* Terms checkbox */}
            <label className="flex items-start gap-2 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={termsAgreed}
                onChange={e => setTermsAgreed(e.target.checked)}
                className="mt-0.5 shrink-0" />
              <span className="text-xs" style={{ color: '#5F5E5A' }}>
                I have read and agree to the{' '}
                <Link href="/terms" target="_blank" style={{ color: '#633806' }}>Terms and Conditions</Link>
                {' '}and{' '}
                <Link href="/refund-policy" target="_blank" style={{ color: '#633806' }}>Refund Policy</Link>.
              </span>
            </label>

            {error && <p className="text-sm mb-3" style={{ color: '#E24B4A' }}>{error}</p>}
            {paymentMessage && <p className="text-sm mb-3" style={{ color: '#E24B4A' }}>{paymentMessage}</p>}

            <div className="flex gap-3">
              <button
                onClick={isFreeAfterCoupon ? handleFreeEnrol : handlePayNow}
                disabled={submitting || !termsAgreed || !email}
                className="flex-1 py-3 rounded text-sm font-medium"
                style={{
                  background: '#633806',
                  color: '#FAEEDA',
                  opacity: (submitting || !termsAgreed || !email) ? 0.6 : 1,
                }}>
                {submitting ? 'Processing...' : isFreeAfterCoupon ? 'Enrol' : 'Pay Now'}
              </button>
              <button onClick={onClose}
                className="px-4 py-3 rounded text-sm border"
                style={{ borderColor: '#D3D1C7', color: '#5F5E5A' }}>
                Cancel
              </button>
            </div>

            <p className="text-xs mt-4 text-center" style={{ color: '#888780' }}>
              Already enrolled? <a href="/academy/login" style={{ color: '#633806' }}>Log in here</a>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
