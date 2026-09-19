/**
 * Per-surface config for the help chatbot (lib/helpChatbot/chat.ts):
 * a knowledge base builder + where to route an unanswered question. This IS
 * the "single config layer" the design calls for — OKR Ally and Goal Ally
 * share one knowledge-base builder (`appKnowledgeBase`, brand-swapped via
 * the existing `vocab()`), never duplicated content. Adding a fourth surface
 * later is one more entry here.
 *
 * Every knowledge base is built from content that already exists and is
 * already shown to users elsewhere in the app — the app surfaces from the
 * Help tab (`topicsFor`) and walkthrough slides, the website surface from
 * the real Sanity-authored FAQ content — never hand-invented copy, so the
 * chatbot can't say anything the product doesn't already say somewhere.
 */

import { type Brand, vocab } from '@/lib/okrAllyBrand'
import { topicsFor, howItWorks, orgAdmin, employee, type Slide } from '@/lib/okrAllyHelpContent'
import { getFaqs } from '@/lib/sanity'
import type { ChatbotSurface } from './types'

export interface ChatbotSurfaceConfig {
  productName: string
  routingEmail: string
  knowledgeBase(): Promise<string>
}

function slideText(slides: Slide[]): string {
  return slides
    .map((s) => (s.kind === 'shot' ? s.caption : `${s.heading}\n${s.body}`))
    .join('\n\n')
}

function appKnowledgeBase(brand: Brand): () => Promise<string> {
  return async () => {
    const v = vocab(brand)
    const topics = topicsFor(v)
    const faqText = topics
      .map(
        (t) =>
          `### ${t.title}\n${t.blurb}\n\n` +
          t.items.map((qa) => `Q: ${qa.q}\nA: ${qa.a}`).join('\n\n')
      )
      .join('\n\n')
    const walkText = slideText([...howItWorks(v), ...orgAdmin(v), ...employee(v)])
    return (
      `# ${v.product} — help knowledge base\n\n` +
      `## Frequently asked questions\n${faqText}\n\n` +
      `## How ${v.product} works (product walkthrough content)\n${walkText}`
    )
  }
}

/** Flatten Sanity portable-text blocks to plain text — same logic the FAQ
 *  page itself uses to build its FAQPage JSON-LD (app/faq/page.tsx). */
function portableTextToPlain(blocks: unknown[]): string {
  return (blocks as { _type: string; children?: { text: string }[] }[])
    .filter((b) => b._type === 'block')
    .map((b) => b.children?.map((c) => c.text).join('') ?? '')
    .join(' ')
}

// The client resends the full turn history every message, so a multi-turn
// conversation would otherwise re-fetch Sanity on every single reply —
// wasted latency stacked in front of the already-slow Anthropic call. A
// short in-process cache (independent of whatever Next.js's fetch cache
// does with getFaqs()'s own revalidate option inside a force-dynamic route
// handler) keeps that to roughly once every 5 minutes per server instance.
const WEBSITE_KB_CACHE_MS = 5 * 60 * 1000
let websiteKbCache: { text: string; builtAt: number } | null = null

async function websiteKnowledgeBase(): Promise<string> {
  if (websiteKbCache && Date.now() - websiteKbCache.builtAt < WEBSITE_KB_CACHE_MS) {
    return websiteKbCache.text
  }
  const faqs = await getFaqs()
  const faqText = faqs
    .map((f) => `Q: ${f.question}\nA: ${portableTextToPlain(f.answer as unknown[])}`)
    .join('\n\n')
  const text =
    `# subramaniampg.guru — help knowledge base\n\n` +
    `## About\nSubramaniam P G is an OKR coach, executive coach, and strategy consultant helping founders and CXOs in India align purpose with performance.\n\n` +
    `## Frequently asked questions\n${faqText || '(no FAQs published yet)'}`
  websiteKbCache = { text, builtAt: Date.now() }
  return text
}

export const SURFACES: Record<ChatbotSurface, ChatbotSurfaceConfig> = {
  okr_ally: {
    productName: 'OKR Ally',
    routingEmail: 'pgs@embiggen.co.in',
    knowledgeBase: appKnowledgeBase('okr_ally'),
  },
  goal_ally: {
    productName: 'Goal Ally',
    routingEmail: 'pgs@embiggen.co.in',
    knowledgeBase: appKnowledgeBase('goal_ally'),
  },
  website: {
    productName: 'Subramaniam P G',
    routingEmail: 'pgs@embiggen.co.in',
    knowledgeBase: websiteKnowledgeBase,
  },
}
