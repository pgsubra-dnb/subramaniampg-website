/**
 * Help chatbot — one Anthropic Messages API call per turn, forced tool-use
 * for a deterministic "did I actually find this in the knowledge base"
 * signal (no thinking config here, unlike lib/okrAllyReview.ts's runReview,
 * so the tool CAN be forced rather than merely requested). Raw fetch,
 * matching the repo's house style for external services — no SDK dependency.
 *
 * Answers ONLY from the surface's own knowledge base (lib/helpChatbot/
 * surfaces.ts) — never outside knowledge. No conversation state is kept
 * server-side; the client resends the last few turns each call.
 */

import { SURFACES } from './surfaces'
import type { ChatbotSurface, ChatMessage } from './types'

export const CHAT_MODEL = 'claude-sonnet-5'
const ANTHROPIC_VERSION = '2023-06-01'
const ATTEMPT_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 2

const ANSWER_TOOL = {
  name: 'answer_from_knowledge_base',
  description:
    'Submit whether the knowledge base actually answers the question, and the answer if so. Call this exactly once.',
  input_schema: {
    type: 'object',
    additionalProperties: false,
    required: ['found_answer', 'answer'],
    properties: {
      found_answer: { type: 'boolean' },
      answer: { type: ['string', 'null'] },
    },
  },
} as const

function buildSystemPrompt(surface: ChatbotSurface, knowledgeBase: string): string {
  const cfg = SURFACES[surface]
  return `You are the help assistant for ${cfg.productName}. Answer ONLY using the knowledge base below — never outside knowledge, never general advice about OKRs, goals, or business beyond what's written here, never a guess.

KNOWLEDGE BASE
${knowledgeBase}

RULES
- If the knowledge base answers the question (even if the wording differs), set found_answer=true and write the answer in plain, direct language, grounded only in what's above.
- If it doesn't — the question is out of scope, or the knowledge base simply doesn't cover it — set found_answer=false and answer=null. Do not guess, do not answer from general knowledge, do not pad with a long apology.
- Never invent a price, policy, or feature that isn't stated above.
- Keep answers short — a few sentences, not an essay.

OUTPUT. Call answer_from_knowledge_base exactly once. Do not write any prose outside the tool call.`
}

export type AnswerResult =
  | { ok: true; foundAnswer: boolean; answer: string | null }
  | { ok: false; reason: string }

export async function answerFromKnowledgeBase(
  messages: ChatMessage[],
  surface: ChatbotSurface
): Promise<AnswerResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return { ok: false, reason: 'ANTHROPIC_API_KEY not configured' }
  if (!messages.length) return { ok: false, reason: 'no messages' }

  const knowledgeBase = await SURFACES[surface].knowledgeBase()
  const system = buildSystemPrompt(surface, knowledgeBase)

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
        body: JSON.stringify({
          model: CHAT_MODEL,
          max_tokens: 1500,
          system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
          tools: [ANSWER_TOOL],
          tool_choice: { type: 'tool', name: ANSWER_TOOL.name },
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      })
    } catch (err) {
      clearTimeout(timer)
      const name = (err as { name?: string } | null)?.name
      if (name === 'AbortError' || name === 'TimeoutError') {
        return { ok: false, reason: `request timed out after ${ATTEMPT_TIMEOUT_MS / 1000}s` }
      }
      lastReason = 'network error'
      continue
    }
    clearTimeout(timer)

    if (!res.ok) {
      const bodyText = await res.text().catch(() => '')
      lastReason = `anthropic ${res.status}: ${bodyText.slice(0, 300)}`
      if (res.status !== 429 && res.status < 500) break
      continue
    }

    const data = (await res.json()) as {
      content?: { type: string; name?: string; input?: unknown }[]
    }
    const block = data.content?.find((b) => b.type === 'tool_use' && b.name === ANSWER_TOOL.name)
    if (!block) {
      lastReason = 'no answer_from_knowledge_base tool call in response'
      continue
    }
    const input = block.input as { found_answer?: unknown; answer?: unknown }
    if (typeof input.found_answer !== 'boolean') {
      lastReason = 'malformed tool input'
      continue
    }
    return {
      ok: true,
      foundAnswer: input.found_answer,
      answer: input.found_answer && typeof input.answer === 'string' ? input.answer : null,
    }
  }

  return { ok: false, reason: lastReason }
}
