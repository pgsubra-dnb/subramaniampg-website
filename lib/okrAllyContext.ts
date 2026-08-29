/**
 * OKR Ally — context refinement pipeline (build sequence step 8, design §4).
 *
 * Two small Haiku-class calls per context field (company / business / role),
 * separate from the main review model:
 *   1. assess    — is the field specific enough? if thin, one targeted,
 *                  skippable clarifying question.
 *   2. paraphrase — rewrite the finalized field into clear, complete sentences.
 *                   Clarity and structure ONLY: no new facts, examples, or
 *                   assumptions; meaning preserved exactly.
 *
 * Raw fetch, matching lib/okrAllyReview.ts. Haiku 4.5 takes no `effort` and no
 * adaptive thinking, so tool_choice is forced for deterministic structured output.
 */

export const CONTEXT_MODEL = 'claude-haiku-4-5'
const ANTHROPIC_VERSION = '2023-06-01'
const ATTEMPT_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 2

export const CONTEXT_FIELD_MAX = 1000

export type ContextFieldKind = 'company' | 'business' | 'role'

const FIELD_LABEL: Record<ContextFieldKind, string> = {
  company: 'the company / organisation',
  business: 'the business situation or goal this OKR sits inside',
  role: "the user's own role and what they can influence",
}

const GROUNDING =
  'Judge only the text as written. Do not use outside knowledge of the company, industry, or comparable businesses, and do not invent detail.'

// ─── assess ─────────────────────────────────────────────────────────────

const ASSESS_TOOL = {
  name: 'record_assessment',
  description: 'Record whether the context field is specific enough, whether it is already clearly written, and if not specific enough, one clarifying question.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['specific_enough', 'already_clear', 'clarifying_question'],
    properties: {
      specific_enough: {
        type: 'boolean',
        description: 'True if an OKR reviewer could meaningfully use this context as-is.',
      },
      already_clear: {
        type: 'boolean',
        description:
          'True if the text is ALREADY in clear, complete, well-structured sentences and a rewrite would not improve it. False if a clarity/structure rewrite would help (e.g. fragments, run-ons, shorthand, missing connective tissue).',
      },
      clarifying_question: {
        type: 'string',
        description:
          'If not specific enough: ONE short question that would most improve the context, answerable in a sentence. Empty string if specific_enough is true.',
      },
    },
  },
} as const

const PARAPHRASE_TOOL = {
  name: 'record_paraphrase',
  description: 'Record the clarity-and-structure rewrite of the context field.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['rewritten'],
    properties: {
      rewritten: {
        type: 'string',
        description:
          'The same content in clear, complete sentences. No new facts, numbers, examples, or assumptions. Same meaning exactly. Concise.',
      },
    },
  },
} as const

interface AnthropicToolResponse {
  stop_reason?: string
  content?: { type: string; name?: string; input?: unknown }[]
}

async function callTool(
  apiKey: string,
  body: Record<string, unknown>,
  toolName: string
): Promise<{ ok: true; input: Record<string, unknown> } | { ok: false; reason: string }> {
  let lastReason = 'unknown'
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
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
        body: JSON.stringify(body),
      })
    } catch (err) {
      clearTimeout(timer)
      const name = (err as { name?: string } | null)?.name
      if (name === 'AbortError' || name === 'TimeoutError') return { ok: false, reason: 'timed out' }
      lastReason = 'network error'
      continue
    }
    clearTimeout(timer)

    if (!res.ok) {
      lastReason = `anthropic ${res.status}: ${(await res.text().catch(() => '')).slice(0, 200)}`
      if (res.status !== 429 && res.status < 500) break
      continue
    }

    const data = (await res.json()) as AnthropicToolResponse
    if (data.stop_reason === 'refusal') {
      lastReason = 'model refused'
      break
    }
    const block = data.content?.find((b) => b.type === 'tool_use' && b.name === toolName)
    if (!block || typeof block.input !== 'object' || block.input === null) {
      lastReason = 'no tool call in response'
      continue
    }
    return { ok: true, input: block.input as Record<string, unknown> }
  }
  return { ok: false, reason: lastReason }
}

export interface AssessResult {
  ok: true
  thin: boolean
  /** False when the text is already specific AND well-formed — the form can then
   *  skip the paraphrase step entirely (design §4 "best case: one call"). */
  needsParaphrase: boolean
  question: string | null
}

/** Normalized text for the "did the field actually change?" comparison. */
export function normalizeForCompare(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

export async function assessField(
  fieldKind: ContextFieldKind,
  text: string
): Promise<AssessResult | { ok: false; reason: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, reason: 'ANTHROPIC_API_KEY not configured' }

  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: true, thin: true, needsParaphrase: false, question: `Tell me a little about ${FIELD_LABEL[fieldKind]}.` }
  }

  const system = `You help an OKR reviewer decide whether a piece of user-supplied context is specific enough to be useful, and whether it is already clearly written. The field describes ${FIELD_LABEL[fieldKind]}. ${GROUNDING} "Specific enough" means concrete enough that feedback on an OKR could actually lean on it — names, numbers, constraints, or a clear situation, not just adjectives. "Already clear" means it reads as complete, well-structured sentences that a rewrite would not improve. If it is not specific enough, ask exactly one question that would add the most — never more than one. Call record_assessment.`

  const r = await callTool(
    apiKey,
    {
      model: CONTEXT_MODEL,
      max_tokens: 400,
      system,
      tools: [ASSESS_TOOL],
      tool_choice: { type: 'tool', name: ASSESS_TOOL.name },
      messages: [{ role: 'user', content: trimmed }],
    },
    ASSESS_TOOL.name
  )
  if (!r.ok) return r

  const specific = r.input.specific_enough === true
  const alreadyClear = r.input.already_clear === true
  const q = typeof r.input.clarifying_question === 'string' ? r.input.clarifying_question.trim() : ''
  return {
    ok: true,
    thin: !specific,
    needsParaphrase: !(specific && alreadyClear),
    question: specific || !q ? null : q,
  }
}

export interface ParaphraseResult {
  ok: true
  paraphrase: string
}

export async function paraphraseField(
  fieldKind: ContextFieldKind,
  text: string
): Promise<ParaphraseResult | { ok: false; reason: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, reason: 'ANTHROPIC_API_KEY not configured' }

  const trimmed = text.trim()
  if (!trimmed) return { ok: false, reason: 'nothing to paraphrase' }

  const system = `You rewrite a piece of user-supplied context describing ${FIELD_LABEL[fieldKind]} into clear, complete sentences. Rules, strictly:
- Change only clarity and structure. Preserve every fact, number, name and nuance.
- Introduce no new facts, examples, figures, or assumptions. Do not soften or strengthen claims. The meaning must be identical to the original.
- Keep the same grammatical person as the input (if the user wrote "I", keep "I"; if "we", keep "we").
- Do not unpack or elaborate vague phrases. If the input is vague, the output stays equally vague — just cleaner. Never add scope the user did not state.
- Keep it concise. Do not pad. Aim for roughly the same length as the input.
Call record_paraphrase.`

  const r = await callTool(
    apiKey,
    {
      model: CONTEXT_MODEL,
      max_tokens: 700,
      system,
      tools: [PARAPHRASE_TOOL],
      tool_choice: { type: 'tool', name: PARAPHRASE_TOOL.name },
      messages: [{ role: 'user', content: trimmed }],
    },
    PARAPHRASE_TOOL.name
  )
  if (!r.ok) return r

  const rewritten = typeof r.input.rewritten === 'string' ? r.input.rewritten.trim() : ''
  if (!rewritten) return { ok: false, reason: 'empty paraphrase' }
  if (rewritten.length > CONTEXT_FIELD_MAX * 2) return { ok: false, reason: 'paraphrase too long' }
  return { ok: true, paraphrase: rewritten }
}
