'use client'

import { useState } from 'react'
import { CURRENT_EPISODE } from '@/lib/webinarEpisodes'

export default function RegisterForm({ src }: { src: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const ep = CURRENT_EPISODE

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setState('sending')
    const f = new FormData(e.currentTarget)
    try {
      const res = await fetch('/api/webinar-register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: f.get('name'),
          email: f.get('email'),
          phone: f.get('phone'),
          website: f.get('website'),
          src,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        setState('idle')
        return
      }
      setState('done')
    } catch {
      setError('Network problem. Please try again.')
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="pc-card" role="status">
        <h2 className="pc-card-title">You are in.</h2>
        <p className="pc-card-text">
          Join live on {ep.dateLabel}, {ep.timeLabel.split(' | ')[0]}. The Goal Ally coupon is shared only during the session.
        </p>
        <a className="pc-btn" href={ep.links.linkedin} target="_blank" rel="noopener noreferrer">Join on LinkedIn</a>
        <div className="pc-alt">
          <a href={ep.links.youtube} target="_blank" rel="noopener noreferrer">Watch on YouTube</a>
          <a href={ep.links.facebook} target="_blank" rel="noopener noreferrer">Watch on Facebook</a>
        </div>
      </div>
    )
  }

  return (
    <form className="pc-card" onSubmit={onSubmit} noValidate>
      <h2 className="pc-card-title">Save your spot</h2>
      <label className="pc-label" htmlFor="pc-name">Name <span aria-hidden="true">*</span></label>
      <input id="pc-name" name="name" className="pc-input" autoComplete="name" required />
      <label className="pc-label" htmlFor="pc-email">Email <span aria-hidden="true">*</span></label>
      <input id="pc-email" name="email" type="email" className="pc-input" autoComplete="email" required />
      <label className="pc-label" htmlFor="pc-phone">Phone (optional)</label>
      <input id="pc-phone" name="phone" type="tel" className="pc-input" autoComplete="tel" />
      {/* Honeypot: hidden from people */}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true">
        <label htmlFor="pc-website">Website</label>
        <input id="pc-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      {error && <p className="pc-error" role="alert">{error}</p>}
      <button className="pc-btn" type="submit" disabled={state === 'sending'}>
        {state === 'sending' ? 'Sending...' : 'Send me the link'}
      </button>
      <p className="pc-note">{ep.liveOnly}</p>
    </form>
  )
}
