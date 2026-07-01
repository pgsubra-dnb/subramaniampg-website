'use client'

import { useState } from 'react'
import Image from 'next/image'

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

const TOPICS = [
  'Executive Coaching',
  'OKR Consulting',
  'Strategy Consulting',
  'Academy and Learning',
  'Speaking Engagement',
  'General Enquiry',
]

function Field({ label, optional = false, children }: { label: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-[#2C2C2A] mb-2">
        {label}
        {optional && <span className="text-[#888780] normal-case font-normal tracking-normal">optional</span>}
      </label>
      {children}
    </div>
  )
}

const inputClass = "w-full px-4 py-3 rounded-lg text-sm text-[#2C2C2A] outline-none bg-white transition-colors placeholder:text-[#C4B49E]"
const inputStyle = { border: '1px solid #E8E4DC' }

export default function ContactForm() {
  const [submitted, setSubmitted] = useState(false)
  const [name, setName]           = useState('')
  const [email, setEmail]         = useState('')
  const [org, setOrg]             = useState('')
  const [topic, setTopic]         = useState('')
  const [message, setMessage]     = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  const onFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#633806'
  }
  const onBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    e.currentTarget.style.borderColor = '#E8E4DC'
  }

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-14 lg:pt-20 lg:pb-16">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="flex justify-center mb-8 lg:hidden">
              <Image
                src="/images/PGS in Video call.png"
                alt="Subramaniam P G — Executive Coach"
                width={220} height={220}
                className="rounded-full object-cover object-top"
                style={{ width: 220, height: 220 }}
                priority
              />
            </div>
            <p className="section-label mb-6">GET IN TOUCH</p>
            <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
              Let us start a conversation
            </h1>
            <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Let us talk about your growth.</p>
            <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-xl">
              Whether you are exploring coaching, consulting, or just want to connect — reach out and I will get back to you within one business day.
            </p>
          </div>
          <div className="hidden lg:flex justify-end">
            <Image
              src="/images/PGS in Video call.png"
              alt="Subramaniam P G — Executive Coach"
              width={320} height={320}
              className="rounded-full object-cover object-top"
              style={{ width: 320, height: 320 }}
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Two-column layout ─────────────────────────────── */}
      <section className="pb-16 lg:pb-24">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-[1fr_420px] gap-8 lg:gap-10 items-start">

            {/* Form */}
            <div className="bg-white rounded-2xl border p-8 lg:p-10" style={{ borderColor: '#E8E4DC' }}>
              <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-8">Send a message</h2>
              {submitted ? (
                <div className="flex flex-col items-center text-center py-10">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mb-6" style={{ backgroundColor: '#E1F5EE' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-8 h-8" style={{ color: '#1D9E75' }}>
                      <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <h3 className="font-lora text-xl font-bold text-[#2C2C2A] mb-3">Message sent!</h3>
                  <p className="text-[#5F5E5A] text-sm leading-relaxed max-w-sm">
                    Thank you for reaching out. I read every message personally and will get back to you within one business day.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setName(''); setEmail(''); setOrg(''); setTopic(''); setMessage('') }}
                    className="mt-6 text-sm font-semibold transition-all"
                    style={{ color: '#633806' }}
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <Field label="Your name">
                      <input type="text" placeholder="Subramaniam P G" value={name} onChange={(e) => setName(e.target.value)}
                        required className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </Field>
                    <Field label="Your email">
                      <input type="email" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)}
                        required className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                    </Field>
                  </div>
                  <Field label="Your organisation" optional>
                    <input type="text" placeholder="Company or organisation name" value={org} onChange={(e) => setOrg(e.target.value)}
                      className={inputClass} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                  <Field label="What are you reaching out about?">
                    <div className="relative">
                      <select value={topic} onChange={(e) => setTopic(e.target.value)} required
                        className={`${inputClass} appearance-none cursor-pointer pr-10`} style={inputStyle} onFocus={onFocus} onBlur={onBlur}>
                        <option value="" disabled>Select a topic…</option>
                        {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4" style={{ color: '#888780' }}>
                          <path fillRule="evenodd" d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </Field>
                  <Field label="Your message">
                    <textarea rows={5} placeholder="Tell me about your situation, what you are looking to achieve, or any questions you have…"
                      value={message} onChange={(e) => setMessage(e.target.value)} required
                      className={`${inputClass} resize-none`} style={inputStyle} onFocus={onFocus} onBlur={onBlur} />
                  </Field>
                  <div>
                    <button type="submit" className="w-full py-4 text-white text-sm font-semibold rounded-lg transition-colors"
                      style={{ backgroundColor: '#633806' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#633806cc')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#633806')}>
                      Send message
                    </button>
                    <p className="text-xs text-center mt-3" style={{ color: '#888780' }}>
                      I read every message personally and respond within one business day.
                    </p>
                  </div>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="rounded-2xl border p-7" style={{ backgroundColor: '#2C2C2A', borderColor: '#2C2C2A' }}>
                <h3 className="font-lora text-lg font-bold text-white mb-2">Prefer to talk directly?</h3>
                <p className="text-white/60 text-sm leading-relaxed mb-5">
                  Book a 30 minute discovery call directly in my calendar. No back and forth on scheduling.
                </p>
                <a href="https://cal.id/pgs/short-discussion" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 border-2 border-white text-white text-sm font-semibold rounded-lg hover:bg-white hover:text-[#2C2C2A] transition-colors w-full justify-center">
                  Book a call <ArrowIcon />
                </a>
              </div>
              <div className="rounded-2xl border p-7 bg-white" style={{ borderColor: '#E8E4DC' }}>
                <h3 className="font-lora text-base font-bold text-[#2C2C2A] mb-5">Direct contact</h3>
                <ul className="space-y-4">
                  <li className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FAEEDA', color: '#633806' }}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                        <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                      </svg>
                    </div>
                    <a href="mailto:pgs@embiggen.co.in" className="text-sm font-medium text-[#2C2C2A] hover:text-[#633806] transition-colors">pgs@embiggen.co.in</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FAEEDA', color: '#633806' }}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 0 1 3.5 2h1.148a1.5 1.5 0 0 1 1.465 1.175l.716 3.223a1.5 1.5 0 0 1-1.052 1.767l-.933.267c-.41.117-.643.555-.48.95a11.542 11.542 0 0 0 6.254 6.254c.395.163.833-.07.95-.48l.267-.933a1.5 1.5 0 0 1 1.767-1.052l3.223.716A1.5 1.5 0 0 1 18 16.352V17.5a1.5 1.5 0 0 1-1.5 1.5H15c-1.149 0-2.263-.15-3.326-.43A13.022 13.022 0 0 1 2.43 8.326 13.019 13.019 0 0 1 2 5V3.5Z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <a href="tel:+919840096048" className="text-sm font-medium text-[#2C2C2A] hover:text-[#633806] transition-colors">+91 98400 96048</a>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#FAEEDA', color: '#633806' }}>
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M16.338 16.338H13.67V12.16c0-.995-.017-2.277-1.387-2.277-1.39 0-1.601 1.086-1.601 2.207v4.248H8.014v-8.59h2.559v1.174h.037c.356-.675 1.227-1.387 2.526-1.387 2.703 0 3.203 1.778 3.203 4.092v4.711zM5.005 6.575a1.548 1.548 0 1 1 0-3.096 1.548 1.548 0 0 1 0 3.096zm1.337 9.763H3.667v-8.59h2.675v8.59zM17.668 1H2.328C1.595 1 1 1.581 1 2.298v15.403C1 18.418 1.595 19 2.328 19h15.34c.734 0 1.332-.582 1.332-1.299V2.298C19 1.581 18.402 1 17.668 1z" />
                      </svg>
                    </div>
                    <a href="https://linkedin.com/in/pgsubra" target="_blank" rel="noopener noreferrer"
                      className="text-sm font-medium text-[#2C2C2A] hover:text-[#633806] transition-colors">linkedin.com/in/pgsubra</a>
                  </li>
                </ul>
              </div>
              <div className="rounded-2xl border p-7 bg-white" style={{ borderColor: '#E8E4DC' }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#FAEEDA', color: '#633806' }}>
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                      <path fillRule="evenodd" d="m9.69 18.933.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 0 0 .281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 1 0 3 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 0 0 2.273 1.765 11.842 11.842 0 0 0 .976.544l.062.029.018.008.006.003ZM10 11.25a2.25 2.25 0 1 0 0-4.5 2.25 2.25 0 0 0 0 4.5Z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2C2C2A] leading-snug">Chennai, Tamil Nadu, India</p>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: '#888780' }}>Serving clients across India and globally</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border p-7" style={{ backgroundColor: '#FAF8F5', borderColor: '#E8E4DC' }}>
                <h3 className="font-lora text-base font-bold text-[#2C2C2A] mb-3">What to expect</h3>
                <p className="text-[#5F5E5A] text-sm leading-relaxed">
                  I read every message personally. You will hear back within one business day. For urgent matters please call directly.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-4">Not sure where to start?</h2>
            <p className="text-white/60 leading-relaxed mb-8">
              Start with the Leadership Execution Scale assessment. It takes 10 minutes and gives you an immediate picture of where your organisation stands.
            </p>
            <a href="/assessment" className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-medium rounded-lg hover:border-white transition-colors">
              Take the assessment <ArrowIcon />
            </a>
          </div>
        </div>
      </section>
    </>
  )
}
