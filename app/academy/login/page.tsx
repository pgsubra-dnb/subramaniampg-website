'use client'
import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

const ERROR_MESSAGES: Record<string, string> = {
  'invalid-link': 'That login link isn’t valid. Please request a new one below.',
  'link-expired': 'That login link has expired. Links are only valid for 15 minutes — please request a new one below.',
  'not-found': 'We couldn’t find an account for that link. Please request a new one below.',
  'server-error': 'Something went wrong verifying that link. Please request a new one below.',
}

function LoginForm() {
  const searchParams = useSearchParams()
  const errorCode = searchParams.get('error')
  const errorMessage = errorCode ? (ERROR_MESSAGES[errorCode] || ERROR_MESSAGES['invalid-link']) : null

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    if (!email) return
    setSubmitting(true)
    await fetch('/api/academy/magic-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
    setSent(true)
    setSubmitting(false)
  }

  return (
    <div className="w-full max-w-md">
      {!sent ? (
        <>
          <p className="text-xs tracking-widest mb-2" style={{ color: '#1D9E75' }}>ACADEMY</p>
          <h1 className="text-3xl mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
            Return to your course
          </h1>

          {errorMessage && (
            <div className="mb-6 p-4 rounded text-sm"
              style={{ background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' }}>
              ⚠ {errorMessage}
            </div>
          )}

          <p className="text-sm mb-8" style={{ color: '#5F5E5A' }}>
            Enter your email and we will send you a login link. No password needed.
          </p>
          <label className="block text-xs font-medium mb-1" style={{ color: '#2C2C2A' }}>
            Email address
          </label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full px-4 py-3 rounded border text-sm outline-none mb-4"
            style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
          <button onClick={handleSubmit} disabled={!email || submitting}
            className="w-full py-3 rounded font-medium text-sm"
            style={{ background: '#633806', color: '#FAEEDA', opacity: !email || submitting ? 0.6 : 1 }}>
            {submitting ? 'Sending...' : 'Send login link'}
          </button>
        </>
      ) : (
        <div className="text-center">
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: '#E1F5EE' }}>
            <span style={{ color: '#1D9E75', fontSize: 24 }}>✓</span>
          </div>
          <h2 className="text-2xl mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
            Check your email
          </h2>
          <p className="text-sm" style={{ color: '#5F5E5A' }}>
            We sent a login link to {email}. The link expires in 15 minutes.
          </p>
        </div>
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
