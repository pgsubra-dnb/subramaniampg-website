'use client'

import { useState } from 'react'
import {
  CONSULTING_SLOTS,
  FREE_INTRO_MINUTES,
  FREE_INTRO_URL,
  formatDuration,
  formatInr,
} from '@/lib/consultingBooking'

const BROWN = '#633806'
const CREAM = '#FAEEDA'
const INK = '#2C2C2A'
const MUTED = '#5F5E5A'
const HAIRLINE = '#E8E4DC'

export default function BookConsultingClient() {
  const [minutes, setMinutes] = useState(CONSULTING_SLOTS[0]?.minutes ?? 30)
  const selected = CONSULTING_SLOTS.find((s) => s.minutes === minutes) ?? CONSULTING_SLOTS[0]

  return (
    <section className="max-w-5xl mx-auto px-6 pb-16">
      <div className="bg-white border rounded-xl p-6 sm:p-8" style={{ borderColor: HAIRLINE }}>
        <h2 className="font-lora text-2xl font-bold mb-2" style={{ color: INK }}>
          Choose how long you need
        </h2>
        <p className="text-sm mb-6" style={{ color: MUTED }}>
          Conversations are booked in 30-minute blocks at {formatInr(1000)} per block plus GST.
          Payment is collected before a time is confirmed.
        </p>

        <div
          role="radiogroup"
          aria-label="Session duration"
          className="grid gap-3 sm:grid-cols-3 mb-6"
        >
          {CONSULTING_SLOTS.map((slot) => {
            const isSelected = slot.minutes === minutes
            const unavailable = !slot.calUrl
            return (
              <button
                key={slot.minutes}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setMinutes(slot.minutes)}
                className="text-left rounded-xl border p-4 transition-colors"
                style={{
                  borderColor: isSelected ? BROWN : HAIRLINE,
                  backgroundColor: isSelected ? CREAM : '#fff',
                  cursor: 'pointer',
                }}
              >
                <p className="text-sm font-medium" style={{ color: INK }}>
                  {formatDuration(slot.minutes)}
                </p>
                <p className="font-lora text-xl font-bold mt-1" style={{ color: BROWN }}>
                  {formatInr(slot.priceInr)}
                </p>
                {unavailable && (
                  <p className="text-[11px] mt-1" style={{ color: MUTED }}>
                    Booking link coming soon
                  </p>
                )}
              </button>
            )
          })}
        </div>

        {selected?.calUrl ? (
          <a
            href={selected.calUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
            style={{ backgroundColor: BROWN, color: CREAM }}
          >
            Continue to booking — pay {formatInr(selected.priceInr)} →
          </a>
        ) : (
          <span
            className="inline-flex items-center px-6 py-3 rounded font-medium text-sm opacity-50"
            style={{ backgroundColor: BROWN, color: CREAM, cursor: 'not-allowed' }}
            aria-disabled="true"
          >
            Continue to booking — pay {formatInr(selected?.priceInr ?? 0)} →
          </span>
        )}

        <p className="text-xs mt-3" style={{ color: MUTED }}>
          You will be taken to a secure payment page. Once payment is confirmed you get the link
          to choose a time, and a calendar invite with the video link follows.
        </p>

        <div className="mt-6 pt-4 border-t text-sm" style={{ borderColor: HAIRLINE }}>
          <span style={{ color: MUTED }}>Not sure yet? </span>
          <a
            href={FREE_INTRO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium"
            style={{ color: '#1D9E75' }}
          >
            Book a free {FREE_INTRO_MINUTES}-minute intro call →
          </a>
        </div>
      </div>
    </section>
  )
}
