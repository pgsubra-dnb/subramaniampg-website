import CorporateClient from '../../okr-ally/corporate/CorporateClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Goal Ally — corporate Goal Reviews',
  robots: { index: false, follow: false },
}

/**
 * Goal Ally corporate purchase — the same CorporateClient as /okr-ally/corporate,
 * just with `brand="goal_ally"` (Goal Review vocabulary, /goal-ally links).
 */
export default function GoalAllyCorporatePage() {
  return <CorporateClient brand="goal_ally" />
}
