'use client'
import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  'link-retired':
    'Login links have been replaced with a 6-digit code. Enter your email below and we’ll send you one.',
  'link-expired': 'That login link has expired. Enter your email below for a fresh sign-in code.',
  'invalid-link': 'That login link isn’t valid. Enter your email below for a sign-in code.',
  'not-found': 'We couldn’t find an account for that link. Enter your registered email below.',
  'server-error': 'Something went wrong. Enter your email below for a new sign-in code.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const initialError = errorCode ? ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['invalid-link'] : null

  // Where to land after sign-in. Only same-site Academy paths are honoured
  // (the API re-checks); default is the dashboard.
  const redirectTo = searchParams.get('next') || searchParams.get('redirect') || '/academy/dashboard'

  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(initialError)
  const [cooldown, setCooldown] = useState(0)
  const codeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === 'code') codeInputRef.current?.focus()
  }, [step])

  async function sendCode() {
    if (!email) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/academy/sign-in-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.success) {
        setStep('code')
        setCooldown(60)
      } else {
        setError(data.error || 'Could not send a sign-in code. Try again in a moment.')
      }
    } catch {
      setError('Could not send a sign-in code. Try again in a moment.')
    } finally {
      setSubmitting(false)
    }
  }

  async function verifyCode() {
    if (!/^\d{6}$/.test(code)) {
      setError('Enter the 6-digit code from the email.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/academy/sign-in-code/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, redirect: redirectTo }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok && data.ok) {
        window.location.assign(data.redirect || '/academy/dashboard')
      } else {
        setError(data.error || 'That code isn’t right. Check it and try again.')
      }
    } catch {
      setError('Something went wrong signing you in. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-md">
      <p className="text-xs tracking-widest mb-2" style={{ color: '#1D9E75' }}>ACADEMY</p>
      <h1 className="text-3xl mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
        Return to your course
      </h1>

      {error && (
        <div className="mb-6 p-4 rounded text-sm"
          style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
          ⚠ {error}
        </div>
      )}

      {step === 'email' ? (
        <>
          <p className="text-sm mb-8" style={{ color: '#5F5E5A' }}>
            Enter your email and we’ll send you a 6-digit sign-in code. No password needed.
          </p>
          <label className="block text-xs font-medium mb-1" style={{ color: '#2C2C2A' }}>
            Email address
          </label>
          <input type="email" value={email} autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendCode() }}
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded border text-sm outline-none mb-4"
            style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
          <button onClick={sendCode} disabled={!email || submitting}
            className="w-full py-3 rounded font-medium text-sm"
            style={{ background: '#633806', color: '#FAEEDA', opacity: !email || submitting ? 0.6 : 1 }}>
            {submitting ? 'Sending…' : 'Send sign-in code'}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below — it expires in 15 minutes.
          </p>
          <label className="block text-xs font-medium mb-1" style={{ color: '#2C2C2A' }}>
            Sign-in code
          </label>
          <input ref={codeInputRef} type="text" inputMode="numeric" autoComplete="one-time-code"
            value={code} maxLength={6}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={(e) => { if (e.key === 'Enter') verifyCode() }}
            placeholder="123456"
            className="w-full px-4 py-3 rounded border outline-none mb-4 tracking-[0.4em] text-lg"
            style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
          <button onClick={verifyCode} disabled={code.length !== 6 || submitting}
            className="w-full py-3 rounded font-medium text-sm"
            style={{ background: '#633806', color: '#FAEEDA', opacity: code.length !== 6 || submitting ? 0.6 : 1 }}>
            {submitting ? 'Signing you in…' : 'Sign in'}
          </button>
          <div className="flex items-center justify-between mt-4 text-xs" style={{ color: '#888780' }}>
            <button onClick={() => { setStep('email'); setCode(''); setError(null) }}
              style={{ color: '#633806' }}>
              Use a different email
            </button>
            <button onClick={sendCode} disabled={cooldown > 0 || submitting}
              style={{ color: cooldown > 0 ? '#B4B2A9' : '#633806' }}>
              {cooldown > 0 ? `Resend code (${cooldown}s)` : 'Resend code'}
            </button>
          </div>
          <p className="text-xs mt-3" style={{ color: '#888780' }}>
            Didn’t get it? Check your spam or junk folder.
          </p>
        </>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6"
      style={{ background: '#FAF8F5' }}>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  )
}
