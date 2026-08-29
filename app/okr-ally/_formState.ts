export type StepId =
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
    name: '',
    phone: '',
    companyName: '',
    ctx: { company: emptyCtx(), business: emptyCtx(), role: emptyCtx() },
    objective: '',
    krs: [{ text: '', initiatives: [] }],
    saveProfile: false,
  }
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
    "Now the business situation this OKR sits inside. What's the goal or pressure driving it this quarter?",
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
