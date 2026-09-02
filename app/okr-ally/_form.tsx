'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AllyRow, UserRow, Btn, Field, CharCount, GeneratingIndicator, T } from './_ui'
import {
  FormState,
  StepId,
  STEP_ORDER,
  PROFILE_STEPS,
  LIMITS,
  CTX_KIND,
  CTX_PROMPT,
  BUSINESS_CONTEXT_GUIDES,
  CONTEXT_FORWARD_NOTICE,
  ctxSnapshot,
  emptyForm,
  isCtxStep,
  nextStep,
  sameText,
  emptyCtx,
  applyOrgContext,
  CtxFieldState,
  ParaphraseAction,
  OrgContext,
} from './_formState'

interface Props {
  initialForm: FormState | null
  /** Set for a corporate member: company + business context are the org's,
   *  read-only. Role context stays personal. */
  orgContext?: OrgContext | null
  /** Fires once, when an org member first reaches the context screens
   *  (the profile summary, or the first context step). */
  onReachedContextScreens?: () => void
  onSubmitted: (result: ReviewResult) => void
}

const ORG_CTX_LABEL = 'Set by your company admin'

export interface ReviewResult {
  submissionId: string
  reviewId: string | null
  overallScore: number
  review: unknown
}

const STEP_LABEL: Record<StepId, string> = {
  profile_summary: 'Your details',
  name: 'Your name',
  phone: 'Phone (optional)',
  company_name: 'Company name',
  ctx_company: 'Company context',
  ctx_business: 'Business context',
  ctx_role: 'Your role',
  objective: 'Objective',
  krs: 'Key Results',
  confirm: 'Review & submit',
}

export default function StepForm({ initialForm, orgContext, onReachedContextScreens, onSubmitted }: Props) {
  const [form, setForm] = useState<FormState>(() => {
    const base = initialForm ?? emptyForm()
    return orgContext ? applyOrgContext(base, orgContext) : { ...base, orgManaged: false }
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitState, setSubmitState] = useState<'idle' | 'running' | 'failed'>('idle')
  const bottomRef = useRef<HTMLDivElement>(null)

  // Tell the parent the first time an org member reaches the context screens
  // (the profile summary, or a context step) — it fires the employee walkthrough.
  const reachedCtxRef = useRef(false)
  useEffect(() => {
    if (
      !reachedCtxRef.current &&
      form.orgManaged &&
      (form.step === 'profile_summary' || isCtxStep(form.step))
    ) {
      reachedCtxRef.current = true
      onReachedContextScreens?.()
    }
  }, [form.orgManaged, form.step, onReachedContextScreens])

  // ── autosave (debounced) ────────────────────────────────
  const saveTimer = useRef<ReturnType<typeof setTimeout>>()
  const persist = useCallback((next: FormState) => {
    clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      fetch('/api/okr-ally/draft', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ formState: next }),
      }).catch(() => {})
    }, 700)
  }, [])

  const update = useCallback(
    (patch: Partial<FormState> | ((f: FormState) => FormState)) => {
      setForm((f) => {
        const next = typeof patch === 'function' ? patch(f) : { ...f, ...patch }
        persist(next)
        return next
      })
    },
    [persist]
  )

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [form.step, busy, submitState])

  const goStep = (s: StepId) => {
    setError(null)
    update({ step: s })
  }
  const next = () => goStep(nextStep(form, form.step))
  // Profile-field edits from the transcript / confirm screen go back to the
  // single summary screen when we're in returning-user mode.
  const editStep = (s: StepId) =>
    goStep(form.mode === 'summary' && PROFILE_STEPS.includes(s) ? 'profile_summary' : s)

  // ── context field pipeline ──────────────────────────────
  async function runAssess(kind: 'company' | 'business' | 'role') {
    const cs = form.ctx[kind]
    const text = cs.raw.trim()
    if (!text) {
      setError('Please add a few words, or leave it blank if you truly have nothing to add.')
      return
    }
    if (text.length > LIMITS.context) return
    setBusy(true)
    setError(null)
    try {
      const r = await fetch('/api/okr-ally/context/assess', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field: kind, text, lastCheckedText: cs.lastCheckedText || undefined }),
      })
      const j = await r.json()
      if (j.skipped) {
        finishCtx(kind, text, 'not_offered', null)
        return
      }
      const patchField = (p: Partial<CtxFieldState>) =>
        update((f) => ({ ...f, ctx: { ...f.ctx, [kind]: { ...f.ctx[kind], lastCheckedText: text, ...p } } }))

      if (j.thin && j.question) {
        patchField({ phase: 'clarify', clarifyingQuestion: j.question })
        return
      }
      if (j.needsParaphrase) {
        await runParaphrase(kind, text, null)
        return
      }
      finishCtx(kind, text, 'not_offered', null)
    } catch {
      // degraded — proceed with the raw text
      finishCtx(kind, text, 'not_offered', null)
    } finally {
      setBusy(false)
    }
  }

  async function answerClarify(kind: 'company' | 'business' | 'role', answer: string) {
    const cs = form.ctx[kind]
    const finalized = answer.trim() ? `${cs.raw.trim()}\n\n${answer.trim()}` : cs.raw.trim()
    update((f) => ({
      ...f,
      ctx: { ...f.ctx, [kind]: { ...f.ctx[kind], clarifyingAnswer: answer.trim() || null } },
    }))
    setBusy(true)
    try {
      await runParaphrase(kind, finalized, answer.trim() || null)
    } finally {
      setBusy(false)
    }
  }

  async function runParaphrase(kind: 'company' | 'business' | 'role', text: string, answer: string | null) {
    try {
      const r = await fetch('/api/okr-ally/context/paraphrase', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ field: kind, text }),
      })
      const j = await r.json()
      if (j.paraphrase) {
        update((f) => ({
          ...f,
          ctx: {
            ...f.ctx,
            [kind]: {
              ...f.ctx[kind],
              phase: 'paraphrase',
              clarifyingAnswer: answer,
              paraphraseSuggested: j.paraphrase,
            },
          },
        }))
        return
      }
      // degraded — keep the finalized original
      finishCtx(kind, text, answer ? 'ignored' : 'not_offered', answer)
    } catch {
      finishCtx(kind, text, answer ? 'ignored' : 'not_offered', answer)
    }
  }

  function finishCtx(
    kind: 'company' | 'business' | 'role',
    finalText: string,
    action: ParaphraseAction,
    answer: string | null
  ) {
    update((f) => ({
      ...f,
      step: nextStep(f, f.step),
      ctx: {
        ...f.ctx,
        [kind]: {
          ...f.ctx[kind],
          phase: 'done',
          finalText,
          paraphraseAction: action,
          clarifyingAnswer: answer ?? f.ctx[kind].clarifyingAnswer,
        },
      },
    }))
  }

  // ── returning-user summary → forward ────────────────────
  function applyProfileSummary(e: {
    name: string
    phone: string
    companyName: string
    company: string
    business: string
    role: string
  }) {
    if (!e.name.trim()) return setError('I need a name to address you by.')
    if (!e.companyName.trim()) return setError('A company or team name, please.')
    if (!e.role.trim() || (!form.orgManaged && (!e.company.trim() || !e.business.trim()))) {
      return setError('Keep a few words in each context field, even if brief.')
    }
    setError(null)
    update((f) => {
      // A context field is only re-run through the pipeline if it actually
      // changed; an unchanged field stays 'done' and is skipped entirely. For an
      // org member, company/business are the org's — never re-run here.
      const resolve = (kind: 'company' | 'business' | 'role', text: string): CtxFieldState =>
        sameText(text, f.ctx[kind].finalText) ? f.ctx[kind] : { ...emptyCtx(), raw: text.trim() }
      const draftForm: FormState = {
        ...f,
        name: e.name.trim(),
        phone: e.phone.trim(),
        companyName: e.companyName.trim(),
        ctx: {
          company: f.orgManaged ? f.ctx.company : resolve('company', e.company),
          business: f.orgManaged ? f.ctx.business : resolve('business', e.business),
          role: resolve('role', e.role),
        },
      }
      return { ...draftForm, step: nextStep(draftForm, 'profile_summary') }
    })
  }

  // ── submit ──────────────────────────────────────────────
  async function submit() {
    setSubmitState('running')
    setError(null)
    const idempotencyKey =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `okr-${Date.now()}-${Math.random().toString(36).slice(2)}`

    // persist name/phone/company + (optionally) profile before the long call
    await fetch('/api/okr-ally/profile', {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        ...(form.saveProfile
          ? form.orgManaged
            ? {
                companyName: form.companyName.trim() || null,
                roleContext: form.ctx.role.finalText || null,
              }
            : {
                companyName: form.companyName.trim() || null,
                companyContext: form.ctx.company.finalText || null,
                businessContext: form.ctx.business.finalText || null,
                roleContext: form.ctx.role.finalText || null,
              }
          : {}),
      }),
    }).catch(() => {})

    let statusRes: { freeReviewCode?: string | null } = {}
    try {
      statusRes = await (await fetch('/api/okr-ally/status')).json()
    } catch {
      /* ignore */
    }

    try {
      const r = await fetch('/api/okr-ally/review', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          idempotencyKey,
          objective: form.objective.trim(),
          krs: form.krs
            .filter((k) => k.text.trim())
            .map((k) => ({
              text: k.text.trim(),
              initiatives: k.initiatives.map((i) => i.trim()).filter(Boolean),
            })),
          context_snapshot: {
            company_context: ctxSnapshot(form.ctx.company),
            business_context: ctxSnapshot(form.ctx.business),
            role_context: ctxSnapshot(form.ctx.role),
          },
          ...(statusRes.freeReviewCode ? { couponCode: statusRes.freeReviewCode } : {}),
        }),
      })
      const j = await r.json()
      if (r.ok && j.status === 'complete') {
        await fetch('/api/okr-ally/draft', { method: 'DELETE' }).catch(() => {})
        onSubmitted({
          submissionId: j.submissionId,
          reviewId: j.reviewId ?? null,
          overallScore: j.overallScore,
          review: j.review,
        })
        return
      }
      setSubmitState('failed')
      setError(
        j.error ||
          (j.status === 'failed_refunded'
            ? 'The review could not be generated. Your credit has been refunded — try again.'
            : 'Something went wrong. Please try again.')
      )
    } catch {
      setSubmitState('failed')
      setError('Network problem reaching Ally. Your credit is safe — try again.')
    }
  }

  // ══ RENDER ══════════════════════════════════════════════
  const ctxKind = isCtxStep(form.step) ? CTX_KIND[form.step] : null
  const c = ctxKind ? form.ctx[ctxKind] : null

  return (
    <div>
      <Transcript form={form} onEdit={editStep} />

      {error && (
        <div
          className="mb-4 text-sm rounded-lg px-4 py-3"
          style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FECACA' }}
        >
          {error}
        </div>
      )}

      {submitState === 'running' ? (
        <GeneratingIndicator />
      ) : form.step === 'profile_summary' ? (
        <ProfileSummaryStep form={form} busy={busy} onContinue={applyProfileSummary} />
      ) : form.step === 'confirm' ? (
        <ConfirmStep
          form={form}
          busy={false}
          onEdit={editStep}
          onToggleSave={(v) => update({ saveProfile: v })}
          onSubmit={submit}
          failed={submitState === 'failed'}
        />
      ) : form.step === 'krs' ? (
        <KrStep
          krs={form.krs}
          onChange={(krs) => update({ krs })}
          onNext={() => {
            const clean = form.krs.map((k) => ({ text: k.text.trim(), initiatives: k.initiatives.map((i) => i.trim()).filter(Boolean) })).filter((k) => k.text)
            if (clean.length < LIMITS.krsMin) return setError('Add at least one Key Result.')
            if (clean.some((k) => k.text.length > LIMITS.kr)) return setError(`Each Key Result must be ${LIMITS.kr} characters or fewer.`)
            update({ krs: clean.length ? clean : form.krs, step: 'confirm' })
          }}
        />
      ) : c && ctxKind ? (
        <CtxStep
          // Remount per context field so CtxStep's local input state (the
          // clarify answer, the paraphrase edit box) can't carry over from the
          // previous field — a stale answer would otherwise be silently sent.
          key={ctxKind}
          kind={ctxKind}
          state={c}
          busy={busy}
          onRawChange={(v) =>
            update((f) => ({ ...f, ctx: { ...f.ctx, [ctxKind]: { ...f.ctx[ctxKind], raw: v } } }))
          }
          onSubmitRaw={() => runAssess(ctxKind)}
          onAnswer={(a) => answerClarify(ctxKind, a)}
          onSkipClarify={() => answerClarify(ctxKind, '')}
          onParaphrase={(action, text) => {
            const finalText = action === 'confirmed' ? c.paraphraseSuggested ?? text : text
            finishCtx(ctxKind, finalText, action, c.clarifyingAnswer)
          }}
        />
      ) : (
        <SimpleStep
          key={form.step}
          label={STEP_LABEL[form.step]}
          prompt={
            form.step === 'name'
              ? "First, what should I call you?"
              : form.step === 'phone'
              ? "A phone number, in case we need to reach you about a payment. You can skip this."
              : form.step === 'company_name'
              ? "What's the name of your company or team?"
              : form.step === 'objective'
              ? "Here's the important one — your Objective for this cycle. One sentence, just the outcome you want."
              : ''
          }
          value={
            form.step === 'name'
              ? form.name
              : form.step === 'phone'
              ? form.phone
              : form.step === 'company_name'
              ? form.companyName
              : form.objective
          }
          onChange={(v) =>
            update(
              form.step === 'name'
                ? { name: v }
                : form.step === 'phone'
                ? { phone: v }
                : form.step === 'company_name'
                ? { companyName: v }
                : { objective: v }
            )
          }
          multiline={form.step === 'objective'}
          max={form.step === 'objective' ? LIMITS.objective : undefined}
          optional={form.step === 'phone'}
          onNext={() => {
            if (form.step === 'name' && !form.name.trim()) return setError('I need a name to address you by.')
            if (form.step === 'company_name' && !form.companyName.trim()) return setError('A company or team name, please.')
            if (form.step === 'objective') {
              if (!form.objective.trim()) return setError('The Objective is required.')
              if (form.objective.length > LIMITS.objective) return setError(`The Objective must be ${LIMITS.objective} characters or fewer.`)
            }
            next()
          }}
        />
      )}

      <div ref={bottomRef} />
    </div>
  )
}

// ── transcript of committed answers ───────────────────────
function Transcript({ form, onEdit }: { form: FormState; onEdit: (s: StepId) => void }) {
  const rows: { q: string; a: string; step: StepId; readOnly?: boolean }[] = []
  const at = STEP_ORDER.indexOf(form.step)
  const done = (s: StepId) => STEP_ORDER.indexOf(s) < at

  if (form.mode === 'summary') {
    // The identity/context fields were reviewed on one summary screen — show a
    // single collapsed row once we've moved past it, not six.
    if (at >= STEP_ORDER.indexOf('objective') && form.step !== 'profile_summary') {
      rows.push({
        q: 'Your details',
        a: [form.name, form.companyName].filter(Boolean).join(' · '),
        step: 'profile_summary',
      })
    }
  } else {
    if (done('name')) rows.push({ q: 'What should I call you?', a: form.name, step: 'name' })
    if (done('phone')) rows.push({ q: 'Phone number?', a: form.phone || '(skipped)', step: 'phone' })
    if (done('company_name')) rows.push({ q: 'Company or team name?', a: form.companyName, step: 'company_name' })
    ;(['ctx_company', 'ctx_business', 'ctx_role'] as const).forEach((s) => {
      if (done(s)) {
        const cs = form.ctx[CTX_KIND[s]]
        const orgLocked = form.orgManaged && (s === 'ctx_company' || s === 'ctx_business')
        rows.push({
          q: orgLocked ? `${CTX_PROMPT[CTX_KIND[s]]} (${ORG_CTX_LABEL})` : CTX_PROMPT[CTX_KIND[s]],
          a: cs.finalText || cs.raw,
          step: s,
          readOnly: orgLocked,
        })
      }
    })
  }
  if (done('objective')) rows.push({ q: 'Your Objective?', a: form.objective, step: 'objective' })
  if (done('krs'))
    rows.push({
      q: 'Your Key Results?',
      a: form.krs.map((k, i) => `${i + 1}. ${k.text}`).join('\n'),
      step: 'krs',
    })

  return (
    <>
      {rows.map((r, i) => (
        <div key={i}>
          <AllyRow>{r.q}</AllyRow>
          <UserRow>
            {r.a}
            {!r.readOnly && (
              <button
                onClick={() => onEdit(r.step)}
                style={{
                  display: 'block',
                  marginTop: 6,
                  fontSize: 11,
                  color: 'rgba(255,255,255,.75)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                edit
              </button>
            )}
          </UserRow>
        </div>
      ))}
    </>
  )
}

// ── returning-user profile summary ────────────────────────
function ProfileSummaryStep({
  form,
  busy,
  onContinue,
}: {
  form: FormState
  busy: boolean
  onContinue: (e: {
    name: string
    phone: string
    companyName: string
    company: string
    business: string
    role: string
  }) => void
}) {
  const [name, setName] = useState(form.name)
  const [phone, setPhone] = useState(form.phone)
  const [companyName, setCompanyName] = useState(form.companyName)
  const [company, setCompany] = useState(form.ctx.company.finalText)
  const [business, setBusiness] = useState(form.ctx.business.finalText)
  const [role, setRole] = useState(form.ctx.role.finalText)
  const [open, setOpen] = useState<Set<string>>(new Set())

  const toggle = (k: string) =>
    setOpen((s) => {
      const n = new Set(s)
      if (n.has(k)) n.delete(k)
      else n.add(k)
      return n
    })

  const org = form.orgManaged
  const fields = [
    { k: 'name', label: 'Your name', value: name, set: setName, saved: form.name, multiline: false, optional: false, readOnly: false },
    { k: 'phone', label: 'Phone', value: phone, set: setPhone, saved: form.phone, multiline: false, optional: true, readOnly: false },
    { k: 'company_name', label: 'Company or team', value: companyName, set: setCompanyName, saved: form.companyName, multiline: false, optional: false, readOnly: false },
    { k: 'company', label: 'Company context', value: company, set: setCompany, saved: form.ctx.company.finalText, multiline: true, optional: false, readOnly: org },
    { k: 'business', label: 'Business context', value: business, set: setBusiness, saved: form.ctx.business.finalText, multiline: true, optional: false, readOnly: org },
    { k: 'role', label: 'Your role', value: role, set: setRole, saved: form.ctx.role.finalText, multiline: true, optional: false, readOnly: false },
  ] as const

  const ctxChanged =
    (!org &&
      (!sameText(company, form.ctx.company.finalText) || !sameText(business, form.ctx.business.finalText))) ||
    !sameText(role, form.ctx.role.finalText)

  const first = form.name.split(' ')[0]

  return (
    <>
      <AllyRow>
        Welcome back{first ? `, ${first}` : ''}. Here&apos;s what I have on file. Edit anything that&apos;s changed,
        then continue — I&apos;ll only re-check the parts you actually touch.
      </AllyRow>

      <div className="rounded-lg mb-4" style={{ background: T.card, border: `1px solid ${T.hairline}` }}>
        {fields.map((f, i) => {
          const isOpen = open.has(f.k)
          const dirty = !sameText(f.value, f.saved)
          return (
            <div
              key={f.k}
              className="px-4 py-3"
              style={{ borderBottom: i < fields.length - 1 ? `1px solid ${T.hairline}` : 'none' }}
            >
              <div className="flex justify-between items-baseline">
                <span
                  style={{
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: '.04em',
                    textTransform: 'uppercase',
                    color: T.gold,
                  }}
                >
                  {f.label}
                  {!f.readOnly && dirty && <span style={{ color: T.emeraldDark, textTransform: 'none', letterSpacing: 0 }}> · edited</span>}
                </span>
                {f.readOnly ? (
                  <span style={{ fontSize: 11.5, color: T.muted }}>{ORG_CTX_LABEL}</span>
                ) : (
                  <button
                    onClick={() => toggle(f.k)}
                    style={{ fontSize: 11.5, color: T.emeraldDark, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    {isOpen ? 'Done' : 'Edit'}
                  </button>
                )}
              </div>
              {isOpen && !f.readOnly ? (
                <div className="mt-2">
                  <Field
                    value={f.value}
                    onChange={f.set}
                    multiline={f.multiline}
                    max={f.multiline ? LIMITS.context : undefined}
                    autoFocus
                    placeholder={f.optional ? 'Optional' : ''}
                  />
                  {f.multiline && (
                    <div className="mt-1">
                      <CharCount value={f.value} max={LIMITS.context} />
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ fontSize: 14, color: T.charcoal, marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>
                  {f.value || (f.optional ? '(none)' : '—')}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {ctxChanged && <ContextForwardNotice style={{ margin: '0 0 10px' }} />}

      <div className="flex items-center justify-between">
        <span style={{ fontSize: 11.5, color: T.muted }}>
          {ctxChanged ? "I'll re-check the context you changed." : 'Nothing to re-check.'}
        </span>
        <Btn
          onClick={() => onContinue({ name, phone, companyName, company, business, role })}
          disabled={busy}
        >
          Continue
        </Btn>
      </div>
    </>
  )
}

// ── simple text step ──────────────────────────────────────
function SimpleStep({
  label,
  prompt,
  value,
  onChange,
  onNext,
  multiline,
  max,
  optional,
}: {
  label: string
  prompt: string
  value: string
  onChange: (v: string) => void
  onNext: () => void
  multiline?: boolean
  max?: number
  optional?: boolean
}) {
  return (
    <>
      <AllyRow>{prompt}</AllyRow>
      <div className="mb-2">
        <Field value={value} onChange={onChange} multiline={multiline} max={max} autoFocus placeholder={optional ? 'Optional' : ''} />
      </div>
      <div className="flex items-center justify-between">
        {max ? <CharCount value={value} max={max} /> : <span style={{ fontSize: 11.5, color: T.muted }}>{label}</span>}
        <Btn onClick={onNext}>{optional ? 'Continue' : 'Next'}</Btn>
      </div>
    </>
  )
}

// ── context step ──────────────────────────────────────────
/** Shown whenever a user is changing an existing context field — the change is
 *  not retroactive. Applies to individual and corporate users alike. */
export function ContextForwardNotice({ style }: { style?: React.CSSProperties }) {
  return (
    <p
      style={{
        margin: '8px 0 0',
        fontSize: 12,
        lineHeight: 1.5,
        color: T.muted,
        ...style,
      }}
    >
      {CONTEXT_FORWARD_NOTICE}
    </p>
  )
}

/** Short guidance shown under the prompt on a fresh context field (beta feedback). */
function ContextTips({ kind }: { kind: 'company' | 'business' | 'role' }) {
  return (
    <div
      style={{
        margin: '2px 0 10px',
        padding: '10px 12px',
        background: T.emeraldTint,
        border: `1px solid ${T.emeraldBorder}`,
        borderRadius: 8,
        fontSize: 12.5,
        lineHeight: 1.55,
        color: T.bubbleText,
      }}
    >
      The more detail you give, the sharper and more specific my review will be — err on the side of
      over-sharing.
      {kind === 'company' && (
        <> A fast way to fill this well: paste a paragraph or two from your company&apos;s website or
        About page.</>
      )}{' '}
      I&apos;ll save this to your profile and reuse it for your next objective, so you only write it
      once.
    </div>
  )
}

function CtxStep({
  kind,
  state,
  busy,
  onRawChange,
  onSubmitRaw,
  onAnswer,
  onSkipClarify,
  onParaphrase,
}: {
  kind: 'company' | 'business' | 'role'
  state: CtxFieldState
  busy: boolean
  onRawChange: (v: string) => void
  onSubmitRaw: () => void
  onAnswer: (a: string) => void
  onSkipClarify: () => void
  onParaphrase: (action: ParaphraseAction, text: string) => void
}) {
  const [answer, setAnswer] = useState('')
  const [editText, setEditText] = useState('')
  useEffect(() => {
    if (state.phase === 'paraphrase') setEditText(state.paraphraseSuggested ?? '')
  }, [state.phase, state.paraphraseSuggested])

  if (state.phase === 'clarify' && state.clarifyingQuestion) {
    return (
      <>
        <AllyRow>{CTX_PROMPT[kind]}</AllyRow>
        <UserRow>{state.raw}</UserRow>
        <AllyRow>{state.clarifyingQuestion}</AllyRow>
        <div className="mb-2">
          <Field value={answer} onChange={setAnswer} autoFocus placeholder="Type your answer, or skip" />
        </div>
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" small onClick={onSkipClarify} disabled={busy}>
            Skip
          </Btn>
          <Btn small onClick={() => onAnswer(answer)} disabled={busy}>
            {busy ? '…' : 'Send'}
          </Btn>
        </div>
      </>
    )
  }

  if (state.phase === 'paraphrase' && state.paraphraseSuggested) {
    return (
      <>
        <AllyRow>
          Here&apos;s how I&apos;d put that, for clarity — same meaning, nothing added. Tweak it in
          the box if you like, then tell me which version to use:
        </AllyRow>
        <div
          className="mb-3 rounded-lg p-4 text-sm"
          style={{ background: T.card, border: `1px solid ${T.hairline}`, color: T.charcoal, lineHeight: 1.6 }}
        >
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={4}
            style={{ width: '100%', border: 'none', outline: 'none', font: 'inherit', color: 'inherit', resize: 'vertical', background: 'transparent' }}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          <Btn onClick={() => onParaphrase('confirmed', state.paraphraseSuggested!)}>
            Use Ally&apos;s version
          </Btn>
          <Btn variant="ghost" onClick={() => onParaphrase('modified', editText)}>
            Use my edit
          </Btn>
          <Btn variant="ghost" onClick={() => onParaphrase('ignored', state.raw)}>
            Keep my original
          </Btn>
        </div>
      </>
    )
  }

  // input phase
  const prefilled = !!state.lastCheckedText && state.lastCheckedText.trim() === state.raw.trim() && !!state.raw.trim()
  return (
    <>
      <AllyRow>
        {CTX_PROMPT[kind]}
        {kind === 'business' && (
          <>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, listStyle: 'disc' }}>
              {BUSINESS_CONTEXT_GUIDES.map((g) => (
                <li key={g} style={{ marginTop: 4, lineHeight: 1.5 }}>
                  {g}
                </li>
              ))}
            </ul>
            <span style={{ display: 'block', marginTop: 8, fontSize: 12.5, opacity: 0.85 }}>
              Answer any or all of these, whatever&apos;s most relevant to your objective.
            </span>
          </>
        )}
        {prefilled && (
          <span style={{ display: 'block', marginTop: 6, fontSize: 12.5, opacity: 0.8 }}>
            I&apos;ve filled this from your profile — leave it as is if nothing&apos;s changed, or edit it.
          </span>
        )}
      </AllyRow>
      {!prefilled && kind !== 'business' && <ContextTips kind={kind} />}
      <div className="mb-2">
        <Field value={state.raw} onChange={onRawChange} multiline max={LIMITS.context} autoFocus />
      </div>
      {/* Returning user re-editing a saved context field — the change isn't retroactive. */}
      {state.lastCheckedText.trim() !== '' && <ContextForwardNotice style={{ marginTop: 0, marginBottom: 6 }} />}
      <div className="flex items-center justify-between">
        <CharCount value={state.raw} max={LIMITS.context} />
        <Btn onClick={onSubmitRaw} disabled={busy}>
          {busy ? 'Thinking…' : 'Continue'}
        </Btn>
      </div>
    </>
  )
}

// ── KR builder ────────────────────────────────────────────
function KrStep({
  krs,
  onChange,
  onNext,
}: {
  krs: { text: string; initiatives: string[] }[]
  onChange: (krs: { text: string; initiatives: string[] }[]) => void
  onNext: () => void
}) {
  const setKr = (i: number, patch: Partial<{ text: string; initiatives: string[] }>) =>
    onChange(krs.map((k, j) => (j === i ? { ...k, ...patch } : k)))

  return (
    <>
      <AllyRow>
        Now your Key Results — one to six of them. Each should be a measurable result, in baseline-and-target
        form. Add up to three initiatives under any KR if you want to.
      </AllyRow>
      {krs.map((kr, i) => (
        <div key={i} className="mb-4 rounded-lg p-4" style={{ background: T.card, border: `1px solid ${T.hairline}` }}>
          <div className="flex items-start gap-2">
            <span style={{ fontWeight: 700, color: T.emeraldDark, fontSize: 14, marginTop: 10 }}>KR{i + 1}</span>
            <div className="flex-1">
              <Field
                value={kr.text}
                onChange={(v) => setKr(i, { text: v.slice(0, LIMITS.kr + 20) })}
                max={LIMITS.kr}
                placeholder="e.g. Raise activation rate from 34% to 60%"
              />
              <div className="mt-1 flex justify-between">
                <CharCount value={kr.text} max={LIMITS.kr} />
                {krs.length > 1 && (
                  <button
                    onClick={() => onChange(krs.filter((_, j) => j !== i))}
                    style={{ fontSize: 11.5, color: '#9A3412', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    remove KR
                  </button>
                )}
              </div>

              {/* Initiatives — visibly nested inside THIS KR's card, subordinate */}
              <div className="mt-3 pl-3" style={{ borderLeft: `2px solid ${T.hairline}` }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 600,
                    letterSpacing: '.05em',
                    textTransform: 'uppercase',
                    color: T.muted,
                  }}
                >
                  Initiatives for KR{i + 1}{' '}
                  <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(optional)</span>
                </div>
                {kr.initiatives.map((init, k) => (
                  <div key={k} className="mt-2 flex items-center gap-2">
                    <span style={{ color: T.muted, fontSize: 13 }}>–</span>
                    <div className="flex-1">
                      <Field
                        value={init}
                        onChange={(v) =>
                          setKr(i, { initiatives: kr.initiatives.map((x, m) => (m === k ? v.slice(0, LIMITS.initiative + 20) : x)) })
                        }
                        max={LIMITS.initiative}
                        placeholder="Optional initiative"
                      />
                    </div>
                    <button
                      onClick={() => setKr(i, { initiatives: kr.initiatives.filter((_, m) => m !== k) })}
                      style={{ fontSize: 11.5, color: T.muted, background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {kr.initiatives.length < LIMITS.initiativesPerKr && (
                  <button
                    onClick={() => setKr(i, { initiatives: [...kr.initiatives, ''] })}
                    style={{
                      marginTop: 6,
                      fontSize: 11.5,
                      fontWeight: 400,
                      color: T.muted,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                    }}
                  >
                    + Add an initiative for KR{i + 1}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* The one, prominent way to add another KR — full width, below the whole list */}
      <div className="mb-4">
        {krs.length < LIMITS.krsMax ? (
          <button
            onClick={() => onChange([...krs, { text: '', initiatives: [] }])}
            style={{
              width: '100%',
              padding: '12px 14px',
              fontSize: 14,
              fontWeight: 700,
              color: T.emeraldDark,
              background: T.emeraldTint,
              border: `1px dashed ${T.emeraldBorder}`,
              borderRadius: 10,
              cursor: 'pointer',
            }}
          >
            + Add another Key Result
          </button>
        ) : (
          <div style={{ fontSize: 11.5, color: T.muted, textAlign: 'center', padding: 8 }}>
            6 Key Results is the maximum.
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Btn onClick={onNext}>Review everything</Btn>
      </div>
    </>
  )
}

// ── confirm step ──────────────────────────────────────────
function ConfirmStep({
  form,
  onEdit,
  onToggleSave,
  onSubmit,
  failed,
  busy,
}: {
  form: FormState
  onEdit: (s: StepId) => void
  onToggleSave: (v: boolean) => void
  onSubmit: () => void
  failed: boolean
  busy: boolean
}) {
  const row = (label: string, value: string, step: StepId, readOnly?: boolean) => (
    <div className="py-2.5" style={{ borderBottom: `1px solid ${T.hairline}` }}>
      <div className="flex justify-between items-baseline">
        <span style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: '.04em', textTransform: 'uppercase', color: T.gold }}>
          {label}
        </span>
        {readOnly ? (
          <span style={{ fontSize: 11.5, color: T.muted }}>{ORG_CTX_LABEL}</span>
        ) : (
          <button onClick={() => onEdit(step)} style={{ fontSize: 11.5, color: T.emeraldDark, background: 'none', border: 'none', cursor: 'pointer' }}>
            edit
          </button>
        )}
      </div>
      <div style={{ fontSize: 14, color: T.charcoal, marginTop: 4, whiteSpace: 'pre-wrap', lineHeight: 1.55 }}>{value || '—'}</div>
    </div>
  )

  return (
    <>
      <AllyRow>Here&apos;s everything I have. Check it over — this is what I&apos;ll review.</AllyRow>
      <div className="rounded-lg p-4 mb-4" style={{ background: T.card, border: `1px solid ${T.hairline}` }}>
        {row('Name', form.name, 'name')}
        {row('Phone', form.phone || '(skipped)', 'phone')}
        {row('Company', form.companyName, 'company_name')}
        {row('Company context', form.ctx.company.finalText, 'ctx_company', form.orgManaged)}
        {row('Business context', form.ctx.business.finalText, 'ctx_business', form.orgManaged)}
        {row('Your role', form.ctx.role.finalText, 'ctx_role')}
        {row('Objective', form.objective, 'objective')}
        {row(
          'Key Results',
          form.krs
            .map(
              (k, i) =>
                `${i + 1}. ${k.text}` + (k.initiatives.filter(Boolean).length ? '\n   ' + k.initiatives.filter(Boolean).map((x) => `– ${x}`).join('\n   ') : '')
            )
            .join('\n'),
          'krs'
        )}
      </div>

      <label className="flex items-start gap-2 mb-4 text-sm" style={{ color: T.muted }}>
        <input type="checkbox" checked={form.saveProfile} onChange={(e) => onToggleSave(e.target.checked)} style={{ marginTop: 3 }} />
        <span>
          {form.orgManaged
            ? 'Save my role context to my profile, so next time it’s prefilled. (Company and business context come from your company admin.)'
            : 'Save this company, business and role context to my profile, so next time it’s prefilled.'}
        </span>
      </label>

      <div
        className="rounded-lg p-4 mb-3 text-sm"
        style={{ background: T.goldTint, color: T.gold, lineHeight: 1.55 }}
      >
        <strong>One review, one credit. No undo.</strong> Once you submit, a credit is used and the review runs.
        There&apos;s no edit or self-serve refund after that (a failed generation refunds automatically).
      </div>
      <p className="text-xs italic mb-5" style={{ color: T.muted }}>
        The review reflects the quality of the context you gave me — thin context means a thinner review.
      </p>

      <div className="flex justify-end gap-2">
        <Btn type="button" onClick={onSubmit} disabled={busy}>
          {failed ? 'Try again' : 'Submit for review'}
        </Btn>
      </div>
    </>
  )
}
