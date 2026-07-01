'use client'

import { useState } from 'react'
import { PortableText } from '@portabletext/react'
import type { SanityFaq } from '@/lib/sanity'

export default function FaqAccordion({ faqs }: { faqs: SanityFaq[] }) {
  const [open, setOpen] = useState<string | null>(null)

  return (
    <div className="space-y-3">
      {faqs.map((faq) => {
        const isOpen = open === faq._id
        return (
          <div
            key={faq._id}
            className="bg-white rounded-2xl border overflow-hidden transition-all"
            style={{ borderColor: isOpen ? '#633806' : '#E8E4DC' }}
          >
            <button
              className="w-full flex items-start justify-between gap-4 px-7 py-5 text-left"
              onClick={() => setOpen(isOpen ? null : faq._id)}
              aria-expanded={isOpen}
            >
              <span className="font-semibold text-[#2C2C2A] text-sm leading-snug pr-2">
                {faq.question}
              </span>
              <div
                className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5 transition-all"
                style={{
                  backgroundColor: isOpen ? '#633806' : '#FAF8F5',
                  transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
                }}
              >
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3"
                  style={{ color: isOpen ? '#ffffff' : '#633806' }}>
                  <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                </svg>
              </div>
            </button>
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ maxHeight: isOpen ? '600px' : '0' }}
            >
              <div className="px-7 pb-6">
                <div className="h-px mb-4" style={{ backgroundColor: '#E8E4DC' }} />
                <div className="text-[#5F5E5A] text-sm leading-relaxed prose-sm">
                  <PortableText value={faq.answer as { _type: string; [key: string]: unknown }[]} />
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
