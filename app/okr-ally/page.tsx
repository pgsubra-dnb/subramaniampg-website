import OkrAllyClient from './OkrAllyClient'

export const dynamic = 'force-dynamic'

/**
 * OKR Ally (build sequence steps 8–9). A page within the site, not linked from
 * main navigation. The conversational step form, confirm screen, report,
 * Pricing and History tabs all live in the client component; auth is a
 * one-time 6-digit sign-in code resolved to a Neon users row.
 */
export default function OkrAllyPage() {
  return <OkrAllyClient />
}
