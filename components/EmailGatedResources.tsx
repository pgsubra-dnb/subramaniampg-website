'use client'

import { useState, useEffect, useCallback } from 'react'

interface Resource {
  title: string
  filename: string
}

interface Props {
  resources: Resource[]
}

const LockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
)

const SmallArrow = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

export default function EmailGatedResources({ resources }: Props) {
  const [openResource, setOpenResource] = useState<Resource | null>(null)
  const [submitted, setSubmitted]       = useState(false)
  const [submitting, setSubmitting]     = useState(false)
  const [name, setName]                 = useState('')
  const [email, setEmail]               = useState('')
  const [unlocked, setUnlocked]         = useState<Set<string>>(new Set())

  useEffect(() => {
    try {
      const stored = localStorage.getItem('pgs_unlocked_resources')
      if (stored) setUnlocked(new Set(JSON.parse(stored) as string[]))
    } catch { /* ignore */ }
  }, [])

  const close = useCallback(() => {
    setOpenResource(null)
    setSubmitted(false)
    setSubmitting(false)
    setName('')
    setEmail('')
  }, [])

  useEffect(() => {
    if (!openResource) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [openResource, close])

  useEffect(() => {
    document.body.style.overflow = openResource ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [openResource])

  function triggerDownload(res: Resource) {
    const a = document.createElement('a')
    a.href = `/resources/gated/${encodeURIComponent(res.filename)}`
    a.download = res.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!openResource) return
    setSubmitting(true)

    await fetch('/api/save-resource', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, resourceTitle: openResource.title }),
    })

    const next = new Set(unlocked)
    next.add(openResource.title)
    setUnlocked(next)
    try {
      localStorage.setItem('pgs_unlocked_resources', JSON.stringify(Array.from(next)))
    } catch { /* ignore */ }

    triggerDownload(openResource)
    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((res) => {
          const isUnlocked = unlocked.has(res.title)
          return (
            <div
              key={res.title}
              className="flex flex-col p-7 rounded-2xl bg-white border shadow-sm"
              style={{ borderColor: '#E8E4DC' }}
            >
              {/* Icon */}
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0"
                style={{
                  backgroundColor: isUnlocked ? '#E1F5EE' : '#FAEEDA',
                  color:           isUnlocked ? '#0D6E4E' : '#633806',
                }}
              >
                {isUnlocked ? <DownloadIcon /> : <LockIcon />}
              </div>

              {/* Badge */}
              <span
                className="text-xs font-semibold px-3 py-1 rounded-full w-fit mb-4"
                style={{
                  backgroundColor: isUnlocked ? '#E1F5EE' : '#FAEEDA',
                  color:           isUnlocked ? '#0D6E4E' : '#633806',
                }}
              >
                {isUnlocked ? 'Unlocked' : 'Email Required'}
              </span>

              <h3 className="font-lora text-lg font-bold text-[#2C2C2A] mb-6 leading-snug flex-1">
                {res.title}
              </h3>

              {isUnlocked ? (
                <a
                  href={`/resources/gated/${encodeURIComponent(res.filename)}`}
                  download={res.filename}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-medium rounded-lg transition-colors hover:opacity-90"
                  style={{ backgroundColor: '#633806' }}
                >
                  Download
                  <DownloadIcon />
                </a>
              ) : (
                <button
                  onClick={() => { setOpenResource(res); setSubmitted(false) }}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 border text-sm font-medium rounded-lg transition-colors"
                  style={{ borderColor: '#633806', color: '#633806' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#633806'
                    e.currentTarget.style.color = '#ffffff'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                    e.currentTarget.style.color = '#633806'
                  }}
                >
                  Get access
                  <SmallArrow />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal */}
      {openResource && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
          onClick={close}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md relative shadow-2xl"
            style={{ maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={close}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full transition-colors"
              style={{ color: '#5F5E5A' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#F5F3EF')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
              </svg>
            </button>

            <div className="p-8">
              {!submitted ? (
                <>
                  <h3 className="font-lora text-xl font-bold text-[#2C2C2A] mb-1">Get free access</h3>
                  <p className="text-sm font-medium mb-1" style={{ color: '#633806' }}>
                    {openResource.title}
                  </p>
                  <p className="text-[#5F5E5A] text-sm leading-relaxed mb-7">
                    Enter your details and the download starts immediately.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-1.5">
                        Name
                      </label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg text-sm text-[#2C2C2A] outline-none transition-colors"
                        style={{ border: '1px solid #E8E4DC' }}
                        onFocus={e  => (e.currentTarget.style.borderColor = '#633806')}
                        onBlur={e   => (e.currentTarget.style.borderColor = '#E8E4DC')}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-1.5">
                        Email
                      </label>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-lg text-sm text-[#2C2C2A] outline-none transition-colors"
                        style={{ border: '1px solid #E8E4DC' }}
                        onFocus={e  => (e.currentTarget.style.borderColor = '#633806')}
                        onBlur={e   => (e.currentTarget.style.borderColor = '#E8E4DC')}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60"
                      style={{ backgroundColor: '#633806' }}
                    >
                      {submitting ? 'Saving…' : 'Download now'}
                    </button>
                  </form>

                  <p className="text-xs leading-relaxed mt-5" style={{ color: '#5F5E5A80' }}>
                    You will receive occasional insights from Subramaniam P G. Unsubscribe any time.
                  </p>
                </>
              ) : (
                <div className="text-center py-4">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
                    style={{ backgroundColor: '#E1F5EE' }}
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-7 h-7" style={{ color: '#1D9E75' }}>
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-lora text-xl font-bold text-[#2C2C2A] mb-3">
                    Your download has started
                  </h3>
                  <p className="text-[#5F5E5A] text-sm leading-relaxed mb-7">
                    If it didn&apos;t begin automatically,{' '}
                    <a
                      href={`/resources/gated/${encodeURIComponent(openResource.filename)}`}
                      download={openResource.filename}
                      className="underline font-medium"
                      style={{ color: '#633806' }}
                    >
                      click here
                    </a>
                    .
                  </p>
                  <button
                    onClick={close}
                    className="inline-flex items-center justify-center px-6 py-3 text-white text-sm font-medium rounded-lg transition-colors"
                    style={{ backgroundColor: '#633806' }}
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
