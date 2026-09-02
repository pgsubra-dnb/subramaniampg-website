import OkrAllyClient from '../okr-ally/OkrAllyClient'

export const dynamic = 'force-dynamic'

/**
 * Goal Ally — the same app as /okr-ally, same backend / database / credits /
 * admin tooling. The only difference is presentation and vocabulary
 * (Objective→Goal, Key Result→Sub-goal, OKR→Goal Plan), driven by the `brand`
 * prop. See lib/okrAllyBrand.ts.
 */
export default function GoalAllyPage() {
  return <OkrAllyClient brand="goal_ally" />
}
