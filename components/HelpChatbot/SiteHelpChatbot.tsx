'use client'

/**
 * Mounts the shared help chatbot for the marketing site only. `/okr-ally` and
 * `/goal-ally` mount their own scoped instance from inside OkrAllyClient.tsx
 * (which also knows the signed-in user's email to prefill) — this wrapper
 * renders nothing on those paths so the widget never double-mounts.
 */

import { usePathname } from 'next/navigation'
import HelpChatbot from './HelpChatbot'

export default function SiteHelpChatbot() {
  const pathname = usePathname()
  if (pathname && /^\/(okr-ally|goal-ally|studio)(\/|$)/.test(pathname)) return null
  return <HelpChatbot surface="website" />
}
