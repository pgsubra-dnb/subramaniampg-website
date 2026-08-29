/**
 * OKR Ally — the Claude review engine (build sequence step 6).
 *
 * One Anthropic Messages API call per submission, using a single forced-shape
 * tool for structured output (design doc section 8). Raw fetch, matching the
 * repo's house style for external services (lib/sendBrevoEmail.ts, lib/academy.ts)
 * — no SDK dependency is installed. Model: Claude Sonnet 5 (design doc section 5).
 *
 * The app composes the context and the submitted OKR verbatim from stored
 * `submissions` data; Claude never regenerates or rephrases them (section:
 * "Verbatim reproduction").
 */

export const REVIEW_MODEL = 'claude-sonnet-5'
export const ANTHROPIC_VERSION = '2023-06-01'

// Bump on any change to weights, criteria, or the scoring instruction (section 7).
export const RUBRIC_VERSION = 'okr-ally-rubric-v1'

export const RUBRIC: { criterion: string; weight: number }[] = [
  { criterion: 'Outcome vs Output', weight: 0.25 },
  { criterion: 'Alignment', weight: 0.25 },
  { criterion: 'Measurability', weight: 0.2 },
  { criterion: 'Specificity', weight: 0.15 },
  { criterion: 'Ambition vs Realism', weight: 0.15 },
]

// ─── Input types (composed by the app, from the submissions row) ─────────

export interface SubmittedKR {
  text: string
  initiatives?: string[]
}

export interface ContextField {
  raw_input?: string
  clarifying_question?: string | null
  clarifying_answer?: string | null
  paraphrase_suggested?: string | null
  final_text?: string
  paraphrase_action?: 'confirmed' | 'modified' | 'ignored' | 'not_offered'
}

export interface ReviewContextSnapshot {
  company_context?: ContextField
  business_context?: ContextField
  role_context?: ContextField
}

export interface ReviewInput {
  objective: string
  krs: SubmittedKR[]
  contextSnapshot: ReviewContextSnapshot
}

// ─── Output types (Claude tool result, section 8) ────────────────────────

export interface CriterionScore {
  criterion: string
  score: number
  weight: number
  rationale: string
}
export interface OkrOptionKR {
  text: string
  status: 'modified' | 'unchanged' | 'new'
  initiatives: { action: string; owning_team: string }[]
}
export interface SuggestedOkrOption {
  label: 'Refined Original' | 'Fresh Rewrite'
  objective: string
  key_results: OkrOptionKR[]
  rationale: string
}
export interface ReviewOutput {
  criteria_scores: CriterionScore[]
  overall_score: number
  objective_feedback: { what_works: string; what_to_improve: string }
  key_result_feedback: { kr_reference: string; what_works: string; what_to_improve: string }[]
  suggested_okr_options: SuggestedOkrOption[]
}

// ─── Structured-output tool ─────────────────────────────────────────────

const REVIEW_TOOL = {
  name: 'submit_okr_review',
  description:
    'Submit the complete, structured review of the user’s OKR. Call this exactly once with every field populated.',
  // Not `strict` — adaptive thinking rules out forced tool_choice, and the
  // schema below (nested arrays, enums, bounds) is used as strong guidance while
  // validateReviewOutput() is the authoritative gate. A malformed result is
  // caught there and the credit refunded.
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: [
      'criteria_scores',
      'overall_score',
      'objective_feedback',
      'key_result_feedback',
      'suggested_okr_options',
    ],
    properties: {
      criteria_scores: {
        type: 'array',
        minItems: 5,
        maxItems: 5,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['criterion', 'score', 'weight', 'rationale'],
          properties: {
            criterion: {
              type: 'string',
              enum: RUBRIC.map((r) => r.criterion),
            },
            score: { type: 'number', minimum: 0, maximum: 10 },
            weight: { type: 'number' },
            rationale: { type: 'string' },
          },
        },
      },
      overall_score: { type: 'number', minimum: 0, maximum: 10 },
      objective_feedback: {
        type: 'object',
        additionalProperties: false,
        required: ['what_works', 'what_to_improve'],
        properties: {
          what_works: { type: 'string' },
          what_to_improve: { type: 'string' },
        },
      },
      key_result_feedback: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['kr_reference', 'what_works', 'what_to_improve'],
          properties: {
            kr_reference: { type: 'string' },
            what_works: { type: 'string' },
            what_to_improve: { type: 'string' },
          },
        },
      },
      suggested_okr_options: {
        type: 'array',
        minItems: 2,
        maxItems: 2,
        items: {
          type: 'object',
          additionalProperties: false,
          required: ['label', 'objective', 'key_results', 'rationale'],
          properties: {
            label: { type: 'string', enum: ['Refined Original', 'Fresh Rewrite'] },
            objective: { type: 'string' },
            key_results: {
              type: 'array',
              minItems: 1,
              maxItems: 6,
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['text', 'status', 'initiatives'],
                properties: {
                  text: { type: 'string' },
                  status: { type: 'string', enum: ['modified', 'unchanged', 'new'] },
                  initiatives: {
                    type: 'array',
                    minItems: 2,
                    maxItems: 3,
                    items: {
                      type: 'object',
                      additionalProperties: false,
                      required: ['action', 'owning_team'],
                      properties: {
                        action: { type: 'string' },
                        owning_team: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
            rationale: { type: 'string' },
          },
        },
      },
    },
  },
} as const

// ─── Prompts ────────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  const weights = RUBRIC.map((r) => `- ${r.criterion}: ${Math.round(r.weight * 100)}%`).join('\n')
  return `You are OKR Ally, an expert OKR reviewer. You sit beside the user and assess the OKR they wrote — you do not judge from a distance, and you do not lecture.

GROUNDING (strict). Assess only what the user actually submitted. Do not draw on outside knowledge, industry benchmarks, comparable companies, or assumptions beyond the given context. If something cannot be assessed from what was provided, say so explicitly in the relevant feedback or rationale rather than inferring or extrapolating. This applies to scoring, all feedback, and both suggested OKR options.

USER-SUBMITTED INITIATIVES. Some Key Results include user-submitted initiatives (sub-KRs). When present, weigh them as a genuine signal for alignment and specificity — consider whether they actually support that KR — and you may reference them directly in feedback. When a KR has no initiatives, treat that as neutral; it is an optional field and never a deduction.

SCORING. Score each criterion from 0 to 10 with a short rationale grounded in the submission. Use these criteria and fixed weights:
${weights}
Report each criterion's weight as the fraction shown (e.g. 0.25). The app computes the weighted overall score; still return your own overall_score as the weighted sum on the same 0-10 scale.

SUGGESTED OKR OPTIONS. Return exactly two, labelled "Refined Original" and "Fresh Rewrite".
- Refined Original: edit the submitted OKR toward the flaws found in scoring. Mark each KR status "unchanged", "modified", or "new". You may add at most 2 new KRs, only where scoring found a genuine gap, never exceeding 6 KRs total.
- Fresh Rewrite: regenerate fully from the Objective and context, independent of the original KR wording. Mark every KR status "new".
- Both options: include 2 to 3 initiatives for EVERY Key Result — never fewer than 2, never more than 3 — each with a generic owning-team label (e.g. "Product", "Sales", "Engineering"). This applies to every KR regardless of its status, including "unchanged" ones.

LANGUAGE OF OKRs (apply to every rewritten line and to KR feedback text):
- Imperative verbs, not infinitive phrasing.
- Single accountable owner; avoid shared or supporting language.
- Completion verb for one-time goals, sustaining verb for ongoing states.
- Avoid vague verbs (optimize, enhance); use plain, direction-stating verbs.
- Prefer outcome and delivery language over input and enablement language.
- Before finalizing any line, check: the verb demands movement, an outsider would understand what success looks like, a single owner is identifiable.
- KR lines stay in strict baseline-and-target format. Any "impact" framing goes into the rationale field, never the KR text.

OUTPUT. Call submit_okr_review exactly once with every field populated. Do not write any prose outside the tool call.`
}

function renderContextField(label: string, f: ContextField | undefined): string {
  if (!f) return `${label}: (not provided)`
  const finalText = (f.final_text || f.raw_input || '').trim()
  const lines = [`${label}: ${finalText || '(not provided)'}`]
  if (f.clarifying_question && f.clarifying_answer) {
    lines.push(`  clarifying Q: ${f.clarifying_question}`)
    lines.push(`  clarifying A: ${f.clarifying_answer}`)
  }
  return lines.join('\n')
}

/** The user-facing message: context + submitted OKR, composed verbatim from stored data. */
export function buildUserContent(input: ReviewInput): string {
  const ctx = input.contextSnapshot || {}
  const context = [
    renderContextField('Company context', ctx.company_context),
    renderContextField('Business context', ctx.business_context),
    renderContextField('Role context', ctx.role_context),
  ].join('\n')

  const krs = input.krs
    .map((kr, i) => {
      const head = `KR${i + 1}: ${kr.text}`
      if (kr.initiatives && kr.initiatives.length) {
        return head + '\n' + kr.initiatives.map((x) => `  - initiative: ${x}`).join('\n')
      }
      return head
    })
    .join('\n')

  return `CONTEXT PROVIDED BY THE USER
${context}

OBJECTIVE
${input.objective}

KEY RESULTS
${krs}

Review this OKR now. Call submit_okr_review with your complete assessment.`
}

// ─── Validation ─────────────────────────────────────────────────────────

const CRITERIA = new Set(RUBRIC.map((r) => r.criterion))

export function validateReviewOutput(raw: unknown): { ok: true; review: ReviewOutput } | { ok: false; reason: string } {
  const o = raw as ReviewOutput
  if (!o || typeof o !== 'object') return { ok: false, reason: 'not an object' }

  if (!Array.isArray(o.criteria_scores) || o.criteria_scores.length !== RUBRIC.length) {
    return { ok: false, reason: 'criteria_scores wrong length' }
  }
  const seen = new Set<string>()
  for (const c of o.criteria_scores) {
    if (!CRITERIA.has(c.criterion)) return { ok: false, reason: `unknown criterion ${c.criterion}` }
    if (seen.has(c.criterion)) return { ok: false, reason: `duplicate criterion ${c.criterion}` }
    seen.add(c.criterion)
    if (typeof c.score !== 'number' || c.score < 0 || c.score > 10) {
      return { ok: false, reason: `score out of range for ${c.criterion}` }
    }
    if (!c.rationale || typeof c.rationale !== 'string') {
      return { ok: false, reason: `missing rationale for ${c.criterion}` }
    }
  }

  const of = o.objective_feedback
  if (!of || typeof of.what_works !== 'string' || typeof of.what_to_improve !== 'string') {
    return { ok: false, reason: 'objective_feedback malformed' }
  }
  if (!Array.isArray(o.key_result_feedback)) return { ok: false, reason: 'key_result_feedback not array' }

  if (!Array.isArray(o.suggested_okr_options) || o.suggested_okr_options.length !== 2) {
    return { ok: false, reason: 'suggested_okr_options must have 2 entries' }
  }
  const labels = o.suggested_okr_options.map((x) => x.label).sort()
  if (labels[0] !== 'Fresh Rewrite' || labels[1] !== 'Refined Original') {
    return { ok: false, reason: 'suggested_okr_options labels wrong' }
  }
  for (const opt of o.suggested_okr_options) {
    if (!opt.objective || typeof opt.objective !== 'string') return { ok: false, reason: `${opt.label} missing objective` }
    if (!Array.isArray(opt.key_results) || opt.key_results.length < 1 || opt.key_results.length > 6) {
      return { ok: false, reason: `${opt.label} key_results count invalid` }
    }
    for (const kr of opt.key_results) {
      if (!kr.text || typeof kr.text !== 'string') return { ok: false, reason: `${opt.label} KR missing text` }
      if (!['modified', 'unchanged', 'new'].includes(kr.status)) {
        return { ok: false, reason: `${opt.label} KR bad status` }
      }
      if (!Array.isArray(kr.initiatives)) return { ok: false, reason: `${opt.label} KR initiatives not array` }
      // Every rewritten KR must carry 2-3 initiatives (design intent, confirmed).
      // Too few OR too many is a generation defect — fail here so runReview()
      // retries once, then the route auto-refunds like any other failure.
      if (kr.initiatives.length < 2 || kr.initiatives.length > 3) {
        return {
          ok: false,
          reason: `${opt.label} KR "${kr.text.slice(0, 40)}" has ${kr.initiatives.length} initiatives (need 2-3)`,
        }
      }
      for (const it of kr.initiatives) {
        if (!it || typeof it.action !== 'string' || !it.action.trim()) {
          return { ok: false, reason: `${opt.label} KR "${kr.text.slice(0, 40)}" has an initiative with no action` }
        }
        if (typeof it.owning_team !== 'string' || !it.owning_team.trim()) {
          return { ok: false, reason: `${opt.label} KR "${kr.text.slice(0, 40)}" has an initiative with no owning_team` }
        }
      }
    }
    if (!opt.rationale || typeof opt.rationale !== 'string') return { ok: false, reason: `${opt.label} missing rationale` }
  }

  return { ok: true, review: o }
}

/**
 * Score band for the shared score infographic (ring colour + radar/legend
 * accents). Kept here so the web report screen and the server-rendered PDF
 * can't drift — both import this. Each surface maps the band to its own colour
 * space (CSS tokens vs jsPDF RGB).
 */
export type ScoreTone = 'low' | 'mid' | 'high'
export function scoreTone(score: number): ScoreTone {
  if (score < 4) return 'low'
  if (score < 7) return 'mid'
  return 'high'
}

/** Authoritative weighted overall score (design doc section 7 — the app computes it, not Claude). */
export function computeOverallScore(criteriaScores: CriterionScore[]): number {
  let sum = 0
  for (const r of RUBRIC) {
    const c = criteriaScores.find((x) => x.criterion === r.criterion)
    if (c) sum += c.score * r.weight
  }
  return Math.round(sum * 10) / 10
}

// ─── The call ───────────────────────────────────────────────────────────

export interface RunReviewSuccess {
  ok: true
  review: ReviewOutput
  modelVersion: string
  rubricVersion: string
}
export interface RunReviewFailure {
  ok: false
  reason: string
}

const MAX_ATTEMPTS = 2
// Per-attempt cap. A timed-out attempt is NOT retried (that would risk the
// route's 300s maxDuration — the Vercel Pro ceiling); only fast failures
// (bad/blocked response, 429, 5xx, network) get the second attempt, so the
// worst case is roughly one timeout OR one quick failure + one full attempt.
// Overridable via env for ops tuning and for forcing the timeout path in tests.
const ATTEMPT_TIMEOUT_MS =
  Number(process.env.OKR_ALLY_REVIEW_TIMEOUT_MS) > 0
    ? Number(process.env.OKR_ALLY_REVIEW_TIMEOUT_MS)
    : 120_000

// Timing baseline: a first attempt at output_config.effort "medium" against the
// system prompt + rubric as of 2026-08-28 returned in ~44s (see build-sequence
// step-6 review notes). If buildSystemPrompt() or the rubric changes materially,
// re-measure — a large jump here is the signal that the prompt got heavier.

export async function runReview(input: ReviewInput): Promise<RunReviewSuccess | RunReviewFailure> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, reason: 'ANTHROPIC_API_KEY not configured' }

  const system = buildSystemPrompt()
  const userContent = buildUserContent(input)

  let lastReason = 'unknown'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const startedAt = Date.now()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ATTEMPT_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': ANTHROPIC_VERSION,
        },
        body: JSON.stringify({
          model: REVIEW_MODEL,
          max_tokens: 12000,
          thinking: { type: 'adaptive' },
          // Medium effort keeps a well-scoped rubric review at ~40-90s rather
          // than the 100-180s adaptive-high can take, while staying thorough.
          output_config: { effort: 'medium' },
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          tools: [REVIEW_TOOL],
          // Forcing a specific tool is incompatible with adaptive thinking, so
          // ask (auto) and instruct hard in the system prompt; retry once if the
          // model answers with prose instead of the tool call.
          tool_choice: { type: 'auto' },
          messages: [{ role: 'user', content: userContent }],
        }),
      })
    } catch (err) {
      clearTimeout(timer)
      const name = (err as { name?: string } | null)?.name
      if (name === 'AbortError' || name === 'TimeoutError') {
        // Do not retry a timeout — fail fast so the route runs the same
        // refund + failed_refunded path as any other failure.
        return { ok: false, reason: `request timed out after ${ATTEMPT_TIMEOUT_MS / 1000}s` }
      }
      lastReason = 'network error'
      continue
    }
    clearTimeout(timer)
    console.info(`OKR Ally review: attempt ${attempt} responded in ${((Date.now() - startedAt) / 1000).toFixed(1)}s (${res.status})`)

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      lastReason = `anthropic ${res.status}: ${bodyText.slice(0, 300)}`
      // 4xx other than 429 won't fix themselves on retry.
      if (res.status !== 429 && res.status < 500) break
      continue
    }

    const data = (await res.json()) as {
      model?: string
      stop_reason?: string
      content?: { type: string; name?: string; input?: unknown }[]
    }

    // The served model id from the API response, persisted verbatim as
    // reviews.model_version. NOTE: as of 2026-08-28 the API echoes the bare
    // alias "claude-sonnet-5" here, not a dated snapshot — so this field cannot
    // distinguish two underlying model versions if Anthropic ever repoints the
    // alias. If precise version attribution matters later, pin a dated model id
    // in REVIEW_MODEL and bump RUBRIC_VERSION.
    const servedModel = data.model
    if (!servedModel) {
      console.warn('OKR Ally review: Anthropic response had no model field')
    }

    if (data.stop_reason === 'refusal') {
      lastReason = 'model refused the request'
      break
    }

    const toolBlock = data.content?.find((b) => b.type === 'tool_use' && b.name === REVIEW_TOOL.name)
    if (!toolBlock) {
      lastReason = 'no submit_okr_review tool call in response'
      continue
    }

    const validated = validateReviewOutput(toolBlock.input)
    if (!validated.ok) {
      lastReason = `schema validation failed: ${validated.reason}`
      continue
    }

    validated.review.overall_score = computeOverallScore(validated.review.criteria_scores)
    return {
      ok: true,
      review: validated.review,
      // Prefer the API's reported model id; only fall back to the requested
      // alias if the response omitted it (should not happen).
      modelVersion: servedModel || `${REVIEW_MODEL} (requested; api model field absent)`,
      rubricVersion: RUBRIC_VERSION,
    }
  }

  return { ok: false, reason: lastReason }
}
