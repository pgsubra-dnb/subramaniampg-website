import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getAvailableCredits } from '@/lib/okrAlly'
import { getOrgContextForMember } from '@/lib/okrAllyOrg'

export const dynamic = 'force-dynamic'

/** Current OKR Ally session: the Neon user plus their spendable credits
 *  (personal + any organization-allocated, kept separate but summed for
 *  "can I run a review?"). */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    const [credits, org] = await Promise.all([
      getAvailableCredits(user.id),
      getOrgContextForMember(user),
    ])

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isAdmin: user.is_admin,
        isOrgAdmin: user.is_org_admin,
        organizationId: user.organization_id,
      },
      // Demo session (migration 014) — the client shows the demo banner and
      // routes intro/walkthrough "start" straight into the app (sign-in skipped).
      isDemo: user.is_demo,
      seenWalkthroughs: user.seen_walkthroughs ?? [],
      creditsRemaining: credits.total,
      personalCredits: credits.personal,
      orgCredits: credits.org,
      // Corporate members: the shared company/business context set by their org
      // admin. `confirmed` false → the employee cannot start a review yet.
      orgContext: org
        ? {
            organizationName: org.organizationName,
            companyContext: org.companyContext,
            businessContext: org.businessContext,
            confirmed: org.contextConfirmedAt !== null,
            adminEmail: org.adminEmail,
          }
        : null,
    })
  } catch (error) {
    console.error('OKR Ally me error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
