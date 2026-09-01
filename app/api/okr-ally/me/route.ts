import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getAvailableCredits } from '@/lib/okrAlly'

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

    const credits = await getAvailableCredits(user.id)

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
      creditsRemaining: credits.total,
      personalCredits: credits.personal,
      orgCredits: credits.org,
    })
  } catch (error) {
    console.error('OKR Ally me error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
