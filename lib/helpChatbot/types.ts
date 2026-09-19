/** One knowledge base per app surface (design doc: "single config layer, not
 *  duplicated content" — see surfaces.ts). Adding a fourth surface later
 *  ("a future project") is a one-entry addition to SURFACES there. */
export type ChatbotSurface = 'okr_ally' | 'goal_ally' | 'website'

export function isChatbotSurface(x: unknown): x is ChatbotSurface {
  return x === 'okr_ally' || x === 'goal_ally' || x === 'website'
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}
