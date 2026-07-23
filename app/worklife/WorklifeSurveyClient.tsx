'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Script from 'next/script'
import {
  AGE_GROUP,
  EXPERIENCE_YEARS,
  CURRENT_ROLE,
  INDUSTRY,
  CITY_TYPE,
  GUIDANCE_NEED,
  SITUATION_TYPE,
  GUIDANCE_SOURCE,
  GUIDANCE_SATISFACTION,
  PAID_LEARNING,
  PAID_AMOUNT,
  COMPLETION,
  WORTH_PAYING,
  ONE_PROBLEM_MAX_LEN,
} from '@/lib/worklifeSurveyOptions'

// ── Types ──────────────────────────────────────────────────────────────────────

type Stage = 1 | 2 | 3 | 4 | 'thanks'

interface Answers {
  age_group: string
  experience_years: string
  current_role: string
  current_role_other: string
  industry: string
  industry_other: string
  city_type: string
  guidance_need: string
  situation_type: string[]
  situation_type_other: string
  guidance_source: string
  guidance_source_other: string
  guidance_satisfaction: string
  paid_learning: string[]
  paid_amount: string
  completion: string
  worth_paying: string[]
  one_problem: string
  update_optin: boolean | null
  email: string
  interview_optin: boolean | null
}

const EMPTY_ANSWERS: Answers = {
  age_group: '',
  experience_years: '',
  current_role: '',
  current_role_other: '',
  industry: '',
  industry_other: '',
  city_type: '',
  guidance_need: '',
  situation_type: [],
  situation_type_other: '',
  guidance_source: '',
  guidance_source_other: '',
  guidance_satisfaction: '',
  paid_learning: [],
  paid_amount: '',
  completion: '',
  worth_paying: [],
  one_problem: '',
  update_optin: null,
  email: '',
  interview_optin: null,
}

const STORAGE_KEY = 'worklife_survey_v1'

const SECTION_LABELS: Record<1 | 2 | 3 | 4, string> = {
  1: 'About you',
  2: 'Your work life',
  3: 'Learning and spending',
  4: 'Close',
}

// ── Shared styles ────────────────────────────────────────────────────────────

const cardStyle = { borderColor: '#E8E4DC' }

function OptionButton({
  label,
  selected,
  onClick,
}: {
  label: string
  selected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left w-full p-4 rounded-xl text-sm leading-snug transition-all duration-150"
      style={{
        border: `2px solid ${selected ? '#1D9E75' : '#E8E4DC'}`,
        backgroundColor: selected ? '#E1F5EE' : '#ffffff',
        color: selected ? '#0D6E4E' : '#2C2C2A',
        fontWeight: selected ? 600 : 400,
      }}
    >
      {label}
    </button>
  )
}

function QuestionCard({
  number,
  text,
  helper,
  children,
}: {
  number: number
  text: string
  helper?: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border p-6 sm:p-8" style={cardStyle}>
      <p className="text-xs font-semibold text-[#1D9E75] uppercase tracking-widest mb-3">
        Question {number}
      </p>
      <h2 className="font-lora text-lg sm:text-xl font-semibold text-[#2C2C2A] mb-1 leading-snug">
        {text}
      </h2>
      {helper && <p className="text-xs text-[#888780] mb-4">{helper}</p>}
      {!helper && <div className="mb-1" />}
      <div className="mt-4">{children}</div>
    </div>
  )
}

const inputBase =
  'w-full px-4 py-3 rounded-lg text-sm text-[#2C2C2A] bg-white outline-none transition-colors placeholder:text-[#C4B49E]'
const inputStyle = { border: '1px solid #E8E4DC' }
function onFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = '#633806' }
function onBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) { e.currentTarget.style.borderColor = '#E8E4DC' }

// ── Validation ─────────────────────────────────────────────────────────────

function isSection1Valid(a: Answers) {
  return (
    !!a.age_group &&
    !!a.experience_years &&
    !!a.current_role &&
    (a.current_role !== 'Other' || a.current_role_other.trim() !== '') &&
    !!a.industry &&
    (a.industry !== 'Other' || a.industry_other.trim() !== '') &&
    !!a.city_type
  )
}

function isSection2Valid(a: Answers) {
  if (!a.guidance_need) return false
  if (a.guidance_need !== 'No') {
    if (a.situation_type.length === 0 || a.situation_type.length > 2) return false
    if (a.situation_type.includes('Something else') && !a.situation_type_other.trim()) return false
  }
  if (!a.guidance_source) return false
  if (a.guidance_source === 'Other' && !a.guidance_source_other.trim()) return false
  if (!a.guidance_satisfaction) return false
  return true
}

function isSection3Valid(a: Answers) {
  if (a.paid_learning.length === 0) return false
  const paidNothing = a.paid_learning.includes('No, nothing paid')
  if (!paidNothing) {
    if (!a.paid_amount || !a.completion) return false
  }
  if (a.worth_paying.length === 0 || a.worth_paying.length > 2) return false
  return true
}

function isSection4Valid(a: Answers) {
  if (a.update_optin === null) return false
  if (a.update_optin && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) return false
  if (a.interview_optin === null) return false
  return true
}

// ── Header ─────────────────────────────────────────────────────────────────

function BrandHeader({ showIntro }: { showIntro: boolean }) {
  return (
    <div className="text-center mb-10">
      <div className="flex flex-col items-center gap-2 mb-8">
        <Image
          src="/images/embiggen-logo.png"
          alt="Embiggen"
          width={995}
          height={282}
          priority
          className="h-auto w-[160px] sm:w-[180px]"
        />
        <p className="text-xs font-semibold tracking-[0.2em] uppercase" style={{ color: '#888780' }}>
          Enabling Growth
        </p>
      </div>
      {showIntro && (
        <>
          <h1 className="font-lora text-3xl sm:text-4xl font-bold text-[#2C2C2A] leading-tight mb-4">
            How is work really going for you?
          </h1>
          <p className="text-[#5F5E5A] leading-relaxed max-w-md mx-auto">
            A short 5 minute survey on the everyday challenges working professionals face.
            Anonymous. No sales, no signup.
          </p>
        </>
      )}
    </div>
  )
}

function BrandFooter() {
  return (
    <p className="text-center text-xs mt-14 mb-2" style={{ color: '#888780' }}>
      A research initiative by Embiggen. Enabling Growth.
    </p>
  )
}

function ProgressBar({ stage }: { stage: 1 | 2 | 3 | 4 }) {
  return (
    <div className="mb-10">
      <p className="section-label mb-2">{SECTION_LABELS[stage]}</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-2 rounded-full bg-[#E8E4DC] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(stage / 4) * 100}%`, backgroundColor: '#1D9E75' }}
          />
        </div>
        <span className="text-xs font-semibold text-[#5F5E5A] shrink-0">Section {stage} of 4</span>
      </div>
    </div>
  )
}

function NavButtons({
  onBack,
  onNext,
  nextLabel = 'Next →',
  nextDisabled,
  showBack = true,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  nextDisabled?: boolean
  showBack?: boolean
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-4">
      {showBack ? (
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-3.5 rounded-lg text-sm font-semibold transition-colors"
          style={{ color: '#5F5E5A' }}
        >
          ← Back
        </button>
      ) : <span />}
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="px-10 py-4 rounded-lg text-white text-sm font-semibold transition-all"
        style={{
          backgroundColor: nextDisabled ? '#C4B49E' : '#633806',
          cursor: nextDisabled ? 'not-allowed' : 'pointer',
        }}
      >
        {nextLabel}
      </button>
    </div>
  )
}

function toggleMulti(list: string[], value: string, max: number): string[] {
  if (list.includes(value)) return list.filter((v) => v !== value)
  if (list.length >= max) return list
  return [...list, value]
}

// ── Main component ───────────────────────────────────────────────────────────

export default function WorklifeSurveyClient({
  source,
  turnstileSiteKey,
  calendarUrl,
  bookingConfirmed,
}: {
  source: string
  turnstileSiteKey: string
  calendarUrl: string
  bookingConfirmed: boolean
}) {
  const [stage, setStage] = useState<Stage>(1)
  const [answers, setAnswers] = useState<Answers>(EMPTY_ANSWERS)
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [calendarClicked, setCalendarClicked] = useState(false)
  const [submissionId, setSubmissionId] = useState<number | null>(null)

  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const turnstileRendered = useRef(false)
  const loadTimeRef = useRef<number>(Date.now())

  // Restore "already submitted" state on revisit, or jump straight to the
  // thank-you screen if redirected back here from a completed calendar booking —
  // this must work even when localStorage has no record of a prior submission.
  useEffect(() => {
    let saved: { id?: number | null; interview_optin?: boolean | null; update_optin?: boolean | null; calendar_clicked?: boolean; submitted?: boolean } | null = null
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) saved = JSON.parse(raw)
    } catch {
      // localStorage unavailable — treat as first visit
    }

    if (bookingConfirmed) {
      if (saved) {
        setSubmissionId(saved.id ?? null)
        setAnswers((a) => ({ ...a, interview_optin: saved!.interview_optin ?? null, update_optin: saved!.update_optin ?? null }))
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, calendar_clicked: true }))
        } catch {
          // ignore
        }
      }
      setCalendarClicked(true)
      setStage('thanks')
      return
    }

    if (saved?.submitted) {
      setSubmissionId(saved.id ?? null)
      setAnswers((a) => ({ ...a, interview_optin: saved!.interview_optin ?? null, update_optin: saved!.update_optin ?? null }))
      setCalendarClicked(!!saved.calendar_clicked)
      setStage('thanks')
    }
  }, [bookingConfirmed])

  // Turnstile invisible widget
  useEffect(() => {
    if (!turnstileSiteKey || turnstileRendered.current) return
    const w = window as unknown as { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => void } }
    const interval = setInterval(() => {
      const container = document.getElementById('worklife-turnstile')
      if (w.turnstile && container) {
        turnstileRendered.current = true
        clearInterval(interval)
        w.turnstile.render(container, {
          sitekey: turnstileSiteKey,
          size: 'invisible',
          callback: (token: string) => setTurnstileToken(token),
        })
      }
    }, 200)
    return () => clearInterval(interval)
  }, [turnstileSiteKey])

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) =>
    setAnswers((a) => ({ ...a, [key]: value }))

  const scrollTop = () => window.scrollTo({ top: 0, behavior: 'smooth' })

  const goNext = (next: Stage) => { setStage(next); scrollTop() }
  const goBack = (prev: Stage) => { setStage(prev); scrollTop() }

  const handleCalendarClick = async () => {
    setCalendarClicked(true)
    if (submissionId) {
      try {
        await fetch('/api/worklife-survey/calendar-click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: submissionId }),
        })
      } catch {
        // best-effort tracking only
      }
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const saved = JSON.parse(raw)
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, calendar_clicked: true }))
      }
    } catch {
      // ignore
    }
  }

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    setSubmitError('')

    const completionSeconds = Math.round((Date.now() - loadTimeRef.current) / 1000)
    const paidNothing = answers.paid_learning.includes('No, nothing paid')

    const payload = {
      hp_field: honeypot,
      turnstileToken,
      source,
      age_group: answers.age_group,
      experience_years: answers.experience_years,
      current_role: answers.current_role,
      current_role_other: answers.current_role === 'Other' ? answers.current_role_other.trim() : undefined,
      industry: answers.industry,
      industry_other: answers.industry === 'Other' ? answers.industry_other.trim() : undefined,
      city_type: answers.city_type,
      guidance_need: answers.guidance_need,
      situation_type: answers.guidance_need !== 'No' ? answers.situation_type : undefined,
      situation_type_other: answers.situation_type.includes('Something else') ? answers.situation_type_other.trim() : undefined,
      guidance_source: answers.guidance_source,
      guidance_source_other: answers.guidance_source === 'Other' ? answers.guidance_source_other.trim() : undefined,
      guidance_satisfaction: answers.guidance_satisfaction,
      paid_learning: answers.paid_learning,
      paid_amount: !paidNothing ? answers.paid_amount : undefined,
      completion: !paidNothing ? answers.completion : undefined,
      worth_paying: answers.worth_paying,
      one_problem: answers.one_problem.trim() || undefined,
      update_optin: answers.update_optin,
      email: answers.update_optin ? answers.email.trim().toLowerCase() : undefined,
      interview_optin: answers.interview_optin,
      calendar_clicked: calendarClicked,
      completion_seconds: completionSeconds,
    }

    try {
      const res = await fetch('/api/worklife-survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setSubmitError('Something went wrong submitting your response. Please try again.')
        setSubmitting(false)
        return
      }
      setSubmissionId(data.id ?? null)
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            submitted: true,
            id: data.id ?? null,
            interview_optin: answers.interview_optin,
            update_optin: answers.update_optin,
            calendar_clicked: calendarClicked,
          })
        )
      } catch {
        // ignore
      }
      setStage('thanks')
      scrollTop()
    } catch {
      setSubmitError('Something went wrong submitting your response. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const showCalendarAgain = answers.interview_optin === true && !calendarClicked
  const awaitingTurnstile = !!turnstileSiteKey && !turnstileToken

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF8F5' }}>
      {turnstileSiteKey && (
        <>
          <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" async defer />
          <div id="worklife-turnstile" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} />
        </>
      )}

      <main className="flex-1 px-4 sm:px-6 py-12 lg:py-16">
        <div className="max-w-2xl mx-auto w-full">

          {stage !== 'thanks' && <BrandHeader showIntro={stage === 1} />}

          {/* Honeypot — hidden from real users, left off-screen for bots */}
          <input
            type="text"
            name="company_website"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
            autoComplete="off"
            tabIndex={-1}
            aria-hidden="true"
            style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, opacity: 0 }}
          />

          {stage === 1 && (
            <>
              <ProgressBar stage={1} />
              <div className="space-y-6">
                <QuestionCard number={1} text="What is your age group?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {AGE_GROUP.map((opt) => (
                      <OptionButton key={opt} label={opt} selected={answers.age_group === opt} onClick={() => set('age_group', opt)} />
                    ))}
                  </div>
                </QuestionCard>

                <QuestionCard number={2} text="How many years of work experience do you have?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {EXPERIENCE_YEARS.map((opt) => (
                      <OptionButton key={opt} label={opt} selected={answers.experience_years === opt} onClick={() => set('experience_years', opt)} />
                    ))}
                  </div>
                </QuestionCard>

                <QuestionCard number={3} text="What is your current role?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {CURRENT_ROLE.map((opt) => (
                      <OptionButton key={opt} label={opt} selected={answers.current_role === opt} onClick={() => set('current_role', opt)} />
                    ))}
                  </div>
                  {answers.current_role === 'Other' && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={answers.current_role_other}
                      onChange={(e) => set('current_role_other', e.target.value)}
                      maxLength={200}
                      className={`${inputBase} mt-3`}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  )}
                </QuestionCard>

                <QuestionCard number={4} text="What industry do you work in?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {INDUSTRY.map((opt) => (
                      <OptionButton key={opt} label={opt} selected={answers.industry === opt} onClick={() => set('industry', opt)} />
                    ))}
                  </div>
                  {answers.industry === 'Other' && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={answers.industry_other}
                      onChange={(e) => set('industry_other', e.target.value)}
                      maxLength={200}
                      className={`${inputBase} mt-3`}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  )}
                </QuestionCard>

                <QuestionCard number={5} text="What kind of city are you based in?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {CITY_TYPE.map((opt) => (
                      <OptionButton key={opt} label={opt} selected={answers.city_type === opt} onClick={() => set('city_type', opt)} />
                    ))}
                  </div>
                </QuestionCard>
              </div>

              <NavButtons showBack={false} onNext={() => goNext(2)} nextDisabled={!isSection1Valid(answers)} />
            </>
          )}

          {stage === 2 && (
            <>
              <ProgressBar stage={2} />
              <div className="space-y-6">
                <QuestionCard number={6} text="In the last 3 months, did you face a work situation where you wished a senior person could guide you?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {GUIDANCE_NEED.map((opt) => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={answers.guidance_need === opt}
                        onClick={() => set('guidance_need', opt)}
                      />
                    ))}
                  </div>
                </QuestionCard>

                {answers.guidance_need && answers.guidance_need !== 'No' && (
                  <QuestionCard number={7} text="What was that situation about?" helper="Pick up to two.">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {SITUATION_TYPE.map((opt) => (
                        <OptionButton
                          key={opt}
                          label={opt}
                          selected={answers.situation_type.includes(opt)}
                          onClick={() => set('situation_type', toggleMulti(answers.situation_type, opt, 2))}
                        />
                      ))}
                    </div>
                    {answers.situation_type.includes('Something else') && (
                      <input
                        type="text"
                        placeholder="Please specify"
                        value={answers.situation_type_other}
                        onChange={(e) => set('situation_type_other', e.target.value)}
                        maxLength={200}
                        className={`${inputBase} mt-3`}
                        style={inputStyle}
                        onFocus={onFocus}
                        onBlur={onBlur}
                      />
                    )}
                  </QuestionCard>
                )}

                <QuestionCard number={8} text="Who do you go to today for such guidance?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {GUIDANCE_SOURCE.map((opt) => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={answers.guidance_source === opt}
                        onClick={() => set('guidance_source', opt)}
                      />
                    ))}
                  </div>
                  {answers.guidance_source === 'Other' && (
                    <input
                      type="text"
                      placeholder="Please specify"
                      value={answers.guidance_source_other}
                      onChange={(e) => set('guidance_source_other', e.target.value)}
                      maxLength={200}
                      className={`${inputBase} mt-3`}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  )}
                </QuestionCard>

                <QuestionCard number={9} text="How satisfied are you with the guidance you get?">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {GUIDANCE_SATISFACTION.map((opt) => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={answers.guidance_satisfaction === opt}
                        onClick={() => set('guidance_satisfaction', opt)}
                      />
                    ))}
                  </div>
                </QuestionCard>
              </div>

              <NavButtons onBack={() => goBack(1)} onNext={() => goNext(3)} nextDisabled={!isSection2Valid(answers)} />
            </>
          )}

          {stage === 3 && (
            <>
              <ProgressBar stage={3} />
              <div className="space-y-6">
                <QuestionCard number={10} text="In the last 12 months, did you pay for any learning or self growth?" helper="Select all that apply.">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {PAID_LEARNING.map((opt) => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={answers.paid_learning.includes(opt)}
                        onClick={() => {
                          if (opt === 'No, nothing paid') {
                            set('paid_learning', answers.paid_learning.includes(opt) ? [] : ['No, nothing paid'])
                          } else {
                            const withoutNone = answers.paid_learning.filter((v) => v !== 'No, nothing paid')
                            set(
                              'paid_learning',
                              withoutNone.includes(opt) ? withoutNone.filter((v) => v !== opt) : [...withoutNone, opt]
                            )
                          }
                        }}
                      />
                    ))}
                  </div>
                </QuestionCard>

                {!answers.paid_learning.includes('No, nothing paid') && answers.paid_learning.length > 0 && (
                  <QuestionCard number={11} text="If yes, roughly how much in total?">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {PAID_AMOUNT.map((opt) => (
                        <OptionButton key={opt} label={opt} selected={answers.paid_amount === opt} onClick={() => set('paid_amount', opt)} />
                      ))}
                    </div>
                  </QuestionCard>
                )}

                {!answers.paid_learning.includes('No, nothing paid') && answers.paid_amount && (
                  <QuestionCard number={12} text="Did you finish what you bought?">
                    <div className="grid sm:grid-cols-2 gap-3">
                      {COMPLETION.map((opt) => (
                        <OptionButton key={opt} label={opt} selected={answers.completion === opt} onClick={() => set('completion', opt)} />
                      ))}
                    </div>
                  </QuestionCard>
                )}

                <QuestionCard number={13} text="What would make guidance worth paying for?" helper="Pick up to two.">
                  <div className="grid sm:grid-cols-2 gap-3">
                    {WORTH_PAYING.map((opt) => (
                      <OptionButton
                        key={opt}
                        label={opt}
                        selected={answers.worth_paying.includes(opt)}
                        onClick={() => set('worth_paying', toggleMulti(answers.worth_paying, opt, 2))}
                      />
                    ))}
                  </div>
                </QuestionCard>
              </div>

              <NavButtons onBack={() => goBack(2)} onNext={() => goNext(4)} nextDisabled={!isSection3Valid(answers)} />
            </>
          )}

          {stage === 4 && (
            <>
              <ProgressBar stage={4} />
              <div className="space-y-6">
                <QuestionCard number={14} text="What is the one work problem you wish someone would help you solve?" helper="Optional. Up to 500 characters.">
                  <textarea
                    value={answers.one_problem}
                    onChange={(e) => set('one_problem', e.target.value.slice(0, ONE_PROBLEM_MAX_LEN))}
                    maxLength={ONE_PROBLEM_MAX_LEN}
                    rows={4}
                    placeholder="Share as much or as little as you like"
                    className={inputBase}
                    style={{ ...inputStyle, resize: 'vertical' }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <p className="text-xs text-right mt-1" style={{ color: '#888780' }}>
                    {answers.one_problem.length} / {ONE_PROBLEM_MAX_LEN}
                  </p>
                </QuestionCard>

                <QuestionCard number={15} text="Would you like to be updated about the findings of this survey?">
                  <div className="grid grid-cols-2 gap-3">
                    <OptionButton label="Yes" selected={answers.update_optin === true} onClick={() => set('update_optin', true)} />
                    <OptionButton label="No" selected={answers.update_optin === false} onClick={() => { set('update_optin', false); set('email', '') }} />
                  </div>
                  {answers.update_optin === true && (
                    <input
                      type="email"
                      placeholder="Your email, used only to share the survey findings with you"
                      value={answers.email}
                      onChange={(e) => set('email', e.target.value)}
                      className={`${inputBase} mt-3`}
                      style={inputStyle}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                  )}
                </QuestionCard>

                <QuestionCard number={16} text="Would you be open to a short 15 minute conversation about your experiences at work?" helper="Nothing is being sold.">
                  <div className="grid grid-cols-2 gap-3">
                    <OptionButton label="Yes" selected={answers.interview_optin === true} onClick={() => set('interview_optin', true)} />
                    <OptionButton label="No" selected={answers.interview_optin === false} onClick={() => set('interview_optin', false)} />
                  </div>
                  {answers.interview_optin === true && (
                    <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: '#FAEEDA' }}>
                      <p className="text-sm font-semibold text-[#633806] mb-2">
                        Pick a time that works for you. It takes less than a minute.
                      </p>
                      <a
                        href={calendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={handleCalendarClick}
                        className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white text-sm font-semibold transition-colors"
                        style={{ backgroundColor: '#633806' }}
                      >
                        Pick a time
                      </a>
                    </div>
                  )}
                </QuestionCard>
              </div>

              {submitError && <p className="text-sm text-red-600 mt-4 text-center">{submitError}</p>}

              <NavButtons
                onBack={() => goBack(3)}
                onNext={handleSubmit}
                nextLabel={submitting ? 'Submitting…' : awaitingTurnstile ? 'Verifying…' : 'Submit →'}
                nextDisabled={!isSection4Valid(answers) || submitting || awaitingTurnstile}
              />
            </>
          )}

          {stage === 'thanks' && (
            <div className="text-center py-10">
              <p className="section-label mb-4">THANK YOU</p>
              <h1 className="font-lora text-2xl sm:text-3xl font-bold text-[#2C2C2A] mb-4">
                Thank you for sharing your time and honesty.
              </h1>
              <p className="text-[#5F5E5A] leading-relaxed max-w-md mx-auto mb-2">
                Your response has been recorded anonymously.
              </p>
              {bookingConfirmed && (
                <p className="text-[#0D6E4E] font-semibold leading-relaxed max-w-md mx-auto mb-2">
                  Thank you, your conversation is booked. We look forward to speaking with you.
                </p>
              )}
              {answers.update_optin && (
                <p className="text-[#5F5E5A] leading-relaxed max-w-md mx-auto mb-2">
                  We will write to you when the findings are ready.
                </p>
              )}
              {showCalendarAgain && (
                <div className="mt-8 p-5 rounded-xl inline-block" style={{ backgroundColor: '#FAEEDA' }}>
                  <p className="text-sm font-semibold text-[#633806] mb-3">
                    Pick a time that works for you. It takes less than a minute.
                  </p>
                  <a
                    href={calendarUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleCalendarClick}
                    className="inline-flex items-center justify-center px-6 py-3 rounded-lg text-white text-sm font-semibold transition-colors"
                    style={{ backgroundColor: '#633806' }}
                  >
                    Pick a time
                  </a>
                </div>
              )}
            </div>
          )}

          <BrandFooter />
        </div>
      </main>
    </div>
  )
}
