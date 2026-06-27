'use client'
import { useState } from 'react'

interface Props {
  courseId: string
  courseSlug: string
  courseTitle: string
  onClose: () => void
  onSuccess: () => void
}

export default function EnrolmentModal({ courseId, courseSlug, courseTitle, onClose }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    if (!name || !email) { setError('Name and email are required'); return }
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/academy/enrol', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, company, courseId, courseSlug }),
      })
      const data = await res.json()
      if (data.success) {
        await fetch('/api/academy/magic-link', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        setSent(true)
      } else {
        setError(data.error || 'Something went wrong')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(44,44,42,0.6)' }}>
      <div className="w-full max-w-md rounded-lg p-8" style={{ background: '#FAF8F5' }}>
        {!sent ? (
          <>
            <h2 className="text-2xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
              Enrol in {courseTitle}
            </h2>
            <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>
              Free. No password needed. We send your progress and certificate by email.
            </p>

            {[
              { label: 'Full name', value: name, set: setName, type: 'text', required: true },
              { label: 'Email address', value: email, set: setEmail, type: 'email', required: true },
              { label: 'Company (optional)', value: company, set: setCompany, type: 'text', required: false },
            ].map(({ label, value, set, type, required }) => (
              <div key={label} className="mb-4">
                <label className="block text-xs font-medium mb-1" style={{ color: '#2C2C2A' }}>
                  {label}
                </label>
                <input type={type} value={value} onChange={e => set(e.target.value)}
                  required={required}
                  className="w-full px-3 py-2 rounded border text-sm outline-none"
                  style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
              </div>
            ))}

            {error && <p className="text-sm mb-4" style={{ color: '#E24B4A' }}>{error}</p>}

            <div className="flex gap-3">
              <button onClick={handleSubmit} disabled={submitting}
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
          <div className="text-center py-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: '#E1F5EE' }}>
              <span style={{ color: '#1D9E75', fontSize: 28 }}>✓</span>
            </div>
            <h2 className="text-xl mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
              You are enrolled
            </h2>
            <p className="text-sm mb-2" style={{ color: '#5F5E5A' }}>
              We have sent a login link to
            </p>
            <p className="font-medium mb-4" style={{ color: '#633806' }}>{email}</p>
            <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>
              Click the link in that email to start learning. The link expires in 15 minutes.
            </p>
            <button onClick={onClose}
              className="px-6 py-2 rounded text-sm border"
              style={{ borderColor: '#D3D1C7', color: '#5F5E5A' }}>
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
