import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, getCreditsRemaining } from '@/lib/okrAlly'

export const dynamic = 'force-dynamic'

/** Current OKR Ally session: the Neon user plus their credit balance. */
export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser(req)
    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    const creditsRemaining = await getCreditsRemaining(user.id)

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        isAdmin: user.is_admin,
      },
      creditsRemaining,
    })
  } catch (error) {
    console.error('OKR Ally me error:', error)
    return NextResponse.json({ authenticated: false })
  }
}
