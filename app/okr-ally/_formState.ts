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
  name: string
  phone: string
  companyName: string
  ctx: { company: CtxFieldState; business: CtxFieldState; role: CtxFieldState }
  objective: string
  krs: KR[]
  saveProfile: boolean
}

export function emptyForm(): FormState {
  return {
    step: 'name',
    mode: 'stepwise',
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
    if (form.mode === 'summary') {
      if (s === 'name' || s === 'phone' || s === 'company_name') continue
      if (isCtxStep(s) && form.ctx[CTX_KIND[s]].phase === 'done') continue
      if (s === 'objective' && form.objective.trim() && form.krs.some((k) => k.text.trim())) return 'confirm'
    }
    return s
  }
  return STEP_ORDER[STEP_ORDER.length - 1]
}

export const CTX_KIND: Record<'ctx_company' | 'ctx_business' | 'ctx_role', 'company' | 'business' | 'role'> = {
  ctx_company: 'company',
  ctx_business: 'business',
  ctx_role: 'role',
}

export const CTX_PROMPT: Record<'company' | 'business' | 'role', string> = {
  company:
    "Tell me about your company or organisation — what it does, who it serves, roughly how big it is. A few sentences is plenty.",
  business:
    "How does this objective connect to your organisation's broader goals or priorities, and what impact is it meant to have?",
  role:
    "And your own role — what you're accountable for, and what you can and can't directly influence.",
}

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
