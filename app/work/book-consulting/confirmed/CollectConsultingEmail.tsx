'use client'

import { useState } from 'react'

const BROWN = '#633806'
const CREAM = '#FAEEDA'
const INK = '#2C2C2A'
const MUTED = '#5F5E5A'
const HAIRLINE = '#E8E4DC'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export interface SignedCallbackParams {
  razorpay_payment_id: string
  razorpay_payment_link_id: string
  razorpay_payment_link_reference_id: string
  razorpay_payment_link_status: string
  razorpay_signature: string
}

/**
 * Shown on the confirmation page when the payment is verified and matched to a
 * session but Razorpay captured no email (common with UPI). Posts the email plus
 * the signed callback params to /api/consulting/complete-email, which re-verifies
 * the signature and finishes the GST invoice + booking-link email. On success we
 * reload — the page then renders the normal confirmed state.
 */
export default function CollectConsultingEmail({ params }: { params: SignedCallbackParams }) {
  const [email, setEmail] = useState('')
  const [state, setState] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    const value = email.trim()
    if (!EMAIL_RE.test(value)) {
      setError('Enter a valid email address.')
      setState('error')
      return
    }
    setState('submitting')
    setError(null)
    try {
      const res = await fetch('/api/consulting/complete-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...params, email: value }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        window.location.reload()
        return
      }
      setError(data.reason || 'Could not send your invoice. Try again, or email pgs@embiggen.co.in.')
      setState('error')
    } catch {
      setError('Network error. Try again, or email pgs@embiggen.co.in.')
      setState('error')
    }
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl p-5 mt-8"
      style={{ backgroundColor: '#fff', border: `1px solid ${HAIRLINE}` }}
    >
      <p className="text-sm font-medium" style={{ color: INK }}>
        Where should we send your GST invoice?
      </p>
      <p className="text-xs mt-1 mb-3" style={{ color: MUTED }}>
        Your payment didn&apos;t include an email address. Enter one and we&apos;ll send your GST
        invoice and a copy of the booking link.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') setState('idle')
          }}
          placeholder="you@example.com"
          disabled={state === 'submitting'}
          className="flex-1 rounded px-3 py-2 text-sm"
          style={{ border: `1px solid ${HAIRLINE}`, color: INK }}
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="rounded px-5 py-2 text-sm font-medium"
          style={{ backgroundColor: BROWN, color: CREAM, opacity: state === 'submitting' ? 0.6 : 1 }}
        >
          {state === 'submitting' ? 'Sending…' : 'Send my invoice'}
        </button>
      </div>
      {error && (
        <p className="text-xs mt-2" style={{ color: '#B91C1C' }}>
          {error}
        </p>
      )}
    </form>
  )
}
