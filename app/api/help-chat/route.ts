import { NextRequest, NextResponse } from 'next/server'
import { answerFromKnowledgeBase } from '@/lib/helpChatbot/chat'
import { isChatbotSurface, type ChatMessage } from '@/lib/helpChatbot/types'
import { allow } from '@/lib/okrAllyRateLimit'

export const dynamic = 'force-dynamic'

const MAX_MESSAGES = 20
const MAX_MESSAGE_LEN = 2000
const WINDOW_MS = 15 * 60 * 1000
const MAX_PER_IP = 60

function parseMessages(raw: unknown): ChatMessage[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null
  const out: ChatMessage[] = []
  for (const m of raw) {
    if (!m || typeof m !== 'object') return null
    const role = (m as { role?: unknown }).role
    const content = (m as { content?: unknown }).content
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim()) {
      return null
    }
    out.push({ role, content: content.slice(0, MAX_MESSAGE_LEN) })
  }
  // must end on a user turn — the caller is asking a new question
  if (out[out.length - 1].role !== 'user') return null
  return out
}

/** Shared help chatbot — POST { surface, messages }. Answers ONLY from that
 *  surface's own knowledge base (lib/helpChatbot/surfaces.ts); no outside
 *  knowledge. Stateless — the client resends the running turn history. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!allow(`help-chat:ip:${ip}`, MAX_PER_IP, WINDOW_MS)) {
    return NextResponse.json({ error: 'Too many messages. Wait a few minutes, then try again.' }, { status: 429 })
  }

  const body = await req.json().catch(() => ({}))
  const surface = body.surface
  if (!isChatbotSurface(surface)) {
    return NextResponse.json({ error: 'Unknown surface.' }, { status: 400 })
  }
  const messages = parseMessages(body.messages)
  if (!messages) {
    return NextResponse.json({ error: 'Malformed messages.' }, { status: 400 })
  }

  const result = await answerFromKnowledgeBase(messages, surface)
  if (!result.ok) {
    console.error('help-chat error:', result.reason)
    return NextResponse.json({ error: 'Could not get an answer right now. Try again in a moment.' }, { status: 502 })
  }
  return NextResponse.json({ foundAnswer: result.foundAnswer, answer: result.answer })
}
