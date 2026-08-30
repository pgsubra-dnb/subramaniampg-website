import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { listAdminReviews } from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'

/**
 * Completed reviews across all users, for the admin (expert-review) tab.
 * Query params (all optional): q (objective), company, email, page, pageSize.
 * Returns { items, total, page, pageSize }.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sp = req.nextUrl.searchParams
  const num = (v: string | null) => {
    const n = Number(v)
    return Number.isFinite(n) && n > 0 ? n : undefined
  }

  return NextResponse.json(
    await listAdminReviews(user, {
      q: sp.get('q') ?? undefined,
      company: sp.get('company') ?? undefined,
      email: sp.get('email') ?? undefined,
      page: num(sp.get('page')),
      pageSize: num(sp.get('pageSize')),
    })
  )
}
