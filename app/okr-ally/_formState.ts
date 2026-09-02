export type StepId =
  | 'profile_summary'
  | 'name'
  | 'phone'
  | 'company_name'
  | 'ctx_company'
  | 'ctx_business'
  | 'ctx_role'
  | 'objective'
  | 'krs'
  | 'confirm'

export const STEP_ORDER: StepId[] = [
  'profile_summary',
  'name',
  'phone',
  'company_name',
  'ctx_company',
  'ctx_business',
  'ctx_role',
  'objective',
  'krs',
  'confirm',
]

/** The identity/context steps a returning user edits inline on the summary screen
 *  instead of stepping through one by one. */
export const PROFILE_STEPS: StepId[] = ['name', 'phone', 'company_name', 'ctx_company', 'ctx_business', 'ctx_role']

export const LIMITS = {
  objective: 500,
  kr: 250,
  initiative: 250,
  context: 1000,
  krsMin: 1,
  krsMax: 6,
  initiativesPerKr: 3,
}

export type ParaphraseAction = 'confirmed' | 'modified' | 'ignored' | 'not_offered'
export type CtxPhase = 'input' | 'clarify' | 'paraphrase' | 'done'

export interface CtxFieldState {
  raw: string
  lastCheckedText: string
  clarifyingQuestion: string | null
  clarifyingAnswer: string | null
  paraphraseSuggested: string | null
  finalText: string
  paraphraseAction: ParaphraseAction | ''
  phase: CtxPhase
}

export function emptyCtx(): CtxFieldState {
  return {
    raw: '',
    lastCheckedText: '',
    clarifyingQuestion: null,
    clarifyingAnswer: null,
    paraphraseSuggested: null,
    finalText: '',
    paraphraseAction: '',
    phase: 'input',
  }
}

export interface KR {
  text: string
  initiatives: string[]
}

export interface FormState {
  step: StepId
  /** 'stepwise' — first-time users walk every step. 'summary' — returning users
   *  with a full saved profile start on the profile-summary screen and only the
   *  fields they actually edit are re-run through the context pipeline. */
  mode: 'stepwise' | 'summary'
  /** Corporate members: company + business context come from the org admin,
   *  read-only. The `ctx_company` / `ctx_business` steps are skipped and those
   *  fields are never editable here. Role context stays personal. */
  orgManaged: boolean
  name: string
  phone: string
  companyName: string
  ctx: { company: CtxFieldState; business: CtxFieldState; role: CtxFieldState }
  objective: string
  krs: KR[]
  saveProfile: boolean
}

/** Shown wherever a user changes a context field — the change is not retroactive. */
export const CONTEXT_FORWARD_NOTICE =
  'Changes to your context apply to reviews you run from now on. Reviews already completed keep the context they were run with.'

/** The org's shared context as `/api/okr-ally/me` reports it for a corporate member. */
export interface OrgContext {
  organizationName: string
  companyContext: string | null
  businessContext: string | null
  confirmed: boolean
  adminEmail: string | null
}

export function emptyForm(): FormState {
  return {
    step: 'name',
    mode: 'stepwise',
    orgManaged: false,
    name: '',
    phone: '',
    companyName: '',
    ctx: { company: emptyCtx(), business: emptyCtx(), role: emptyCtx() },
    objective: '',
    krs: [{ text: '', initiatives: [] }],
    saveProfile: false,
  }
}

/**
 * The next step to land on from `from`. In 'stepwise' mode this is just the next
 * entry in STEP_ORDER. In 'summary' mode it skips the inline profile fields
 * (name/phone/company_name) and any context field already resolved
 * (`phase === 'done'`, i.e. left unchanged on the summary screen), and once the
 * context steps are exhausted it jumps straight to the confirm screen when the
 * objective + Key Results are already filled (the "edit from confirm" case).
 */
export function nextStep(form: FormState, from: StepId): StepId {
  for (let i = STEP_ORDER.indexOf(from) + 1; i < STEP_ORDER.length; i++) {
    const s = STEP_ORDER[i]
    // Corporate members never answer company/business context — it's the org's.
    if (form.orgManaged && (s === 'ctx_company' || s === 'ctx_business')) continue
    if (form.mode === 'summary') {
      if (s === 'name' || s === 'phone' || s === 'company_name') continue
      if (isCtxStep(s) && form.ctx[CTX_KIND[s]].phase === 'done') continue
      if (s === 'objective' && form.objective.trim() && form.krs.some((k) => k.text.trim())) return 'confirm'
    }
    return s
  }
  return STEP_ORDER[STEP_ORDER.length - 1]
}

/**
 * Corporate member: replace company + business context with the org admin's
 * published values (read-only), mark the form org-managed, and move off either
 * of those steps if the form happens to be sitting on one.
 */
export function applyOrgContext(
  form: FormState,
  org: { companyContext: string | null; businessContext: string | null }
): FormState {
  const seed = (t: string | null): CtxFieldState => {
    const v = (t ?? '').trim()
    return {
      ...emptyCtx(),
      raw: v,
      lastCheckedText: v,
      finalText: v,
      paraphraseAction: v ? 'not_offered' : '',
      phase: 'done',
    }
  }
  const next: FormState = {
    ...form,
    orgManaged: true,
    ctx: { ...form.ctx, company: seed(org.companyContext), business: seed(org.businessContext) },
  }
  if (next.step === 'ctx_company' || next.step === 'ctx_business') {
    next.step = nextStep(next, 'company_name')
  }
  return next
}

export const CTX_KIND: Record<'ctx_company' | 'ctx_business' | 'ctx_role', 'company' | 'business' | 'role'> = {
  ctx_company: 'company',
  ctx_business: 'business',
  ctx_role: 'role',
}

export const CTX_PROMPT: Record<'company' | 'business' | 'role', string> = {
  company:
    "Tell me about your company or organisation — what it does, who it serves, roughly how big it is. A few sentences is plenty.",
  business: 'Tell me about your company right now.',
  role:
    "And your own role — what you're accountable for, and what you can and can't directly influence.",
}

/** Guiding questions shown as bullets under the `business` prompt (display copy
 *  only — the field stays one free-text textarea, same limit, same pipeline). */
export const BUSINESS_CONTEXT_GUIDES = [
  'What strategic direction is your company taking?',
  'What are the current challenges in business and operations?',
  'What opportunities does the organization see?',
  'What trends are affecting your operations?',
]

/** Build the context_snapshot payload for the review API from a finished field. */
export function ctxSnapshot(c: CtxFieldState) {
  return {
    raw_input: c.raw,
    clarifying_question: c.clarifyingQuestion,
    clarifying_answer: c.clarifyingAnswer,
    paraphrase_suggested: c.paraphraseSuggested,
    final_text: c.finalText,
    paraphrase_action: c.paraphraseAction || 'not_offered',
  }
}

export function isCtxStep(s: StepId): s is 'ctx_company' | 'ctx_business' | 'ctx_role' {
  return s === 'ctx_company' || s === 'ctx_business' || s === 'ctx_role'
}

/** Same normalisation the assess route uses to decide "unchanged" — mirror it
 *  so the summary screen's change detection agrees with the server's skip. */
export function sameText(a: string, b: string): boolean {
  const n = (t: string) => t.trim().replace(/\s+/g, ' ')
  return n(a) === n(b)
}
