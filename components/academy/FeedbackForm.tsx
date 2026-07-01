'use client'
import { useState } from 'react'

interface Props {
  courseId: string
  courseSlug: string
  showAdvancedInterest?: boolean
  onDone: () => void
}

export default function FeedbackForm({ courseId, courseSlug, showAdvancedInterest = true, onDone }: Props) {
  const [starRating, setStarRating] = useState(0)
  const [mostUseful, setMostUseful] = useState('')
  const [wouldRecommend, setWouldRecommend] = useState('')
  const [advancedInterest, setAdvancedInterest] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const canSubmit = !!starRating && !!wouldRecommend && (!showAdvancedInterest || !!advancedInterest)

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    await fetch('/api/academy/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        courseId, courseSlug, starRating, mostUseful, wouldRecommend,
        advancedInterest: showAdvancedInterest ? advancedInterest : 'n/a',
      }),
    })
    setDone(true)
    setSubmitting(false)
    setTimeout(onDone, 1500)
  }

  if (done) return (
    <div className="mt-4 p-4 rounded text-sm" style={{ background: '#E1F5EE', color: '#085041' }}>
      Thank you for your feedback.
    </div>
  )

  return (
    <div className="mt-6 p-5 rounded-lg border" style={{ borderColor: '#D3D1C7', background: '#FAF8F5' }}>
      <h3 className="font-medium mb-4 text-sm" style={{ color: '#2C2C2A' }}>Course feedback</h3>

      {/* Q1 — Star rating */}
      <div className="mb-4">
        <p className="text-xs mb-2" style={{ color: '#5F5E5A' }}>How would you rate this course?</p>
        <div className="flex gap-1">
          {[1,2,3,4,5].map(n => (
            <button key={n} onClick={() => setStarRating(n)}
              className="text-2xl leading-none transition-transform hover:scale-110"
              style={{ color: starRating >= n ? '#F59E0B' : '#D3D1C7', background: 'none', border: 'none', cursor: 'pointer' }}>
              ★
            </button>
          ))}
        </div>
        {starRating > 0 && (
          <p className="text-xs mt-1" style={{ color: '#5F5E5A' }}>
            {['','Poor','Fair','Good','Very good','Excellent'][starRating]}
          </p>
        )}
      </div>

      {/* Q2 — Most useful */}
      <div className="mb-4">
        <p className="text-xs mb-2" style={{ color: '#5F5E5A' }}>What was the most useful thing you learned?</p>
        <textarea value={mostUseful} onChange={e => setMostUseful(e.target.value)}
          rows={2} className="w-full px-3 py-2 text-sm rounded border outline-none resize-none"
          style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }} />
      </div>

      {/* Q3 — Recommend */}
      <div className="mb-4">
        <p className="text-xs mb-2" style={{ color: '#5F5E5A' }}>Would you recommend this course to a colleague?</p>
        <div className="flex gap-2">
          {['yes', 'maybe', 'no'].map(v => (
            <button key={v} onClick={() => setWouldRecommend(v)}
              className="px-4 py-1.5 rounded border text-xs capitalize"
              style={{ borderColor: wouldRecommend === v ? '#633806' : '#D3D1C7',
                background: wouldRecommend === v ? '#FAEEDA' : '#FFFFFF', color: '#2C2C2A' }}>
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Q4 — Advanced interest (OKR only) */}
      {showAdvancedInterest && (
        <div className="mb-5">
          <p className="text-xs mb-2" style={{ color: '#5F5E5A' }}>Would you like to know more about the OKR Mastery advanced course?</p>
          <div className="flex gap-2">
            {[{ label: 'Yes, tell me more', value: 'yes' }, { label: 'Not yet', value: 'not-yet' }].map(opt => (
              <button key={opt.value} onClick={() => setAdvancedInterest(opt.value)}
                className="px-4 py-1.5 rounded border text-xs"
                style={{ borderColor: advancedInterest === opt.value ? '#1D9E75' : '#D3D1C7',
                  background: advancedInterest === opt.value ? '#E1F5EE' : '#FFFFFF', color: '#2C2C2A' }}>
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <button onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="w-full py-2.5 rounded text-sm font-medium"
        style={{ background: '#633806', color: '#FAEEDA', opacity: !canSubmit ? 0.5 : 1 }}>
        {submitting ? 'Submitting...' : 'Submit feedback'}
      </button>
    </div>
  )
}
