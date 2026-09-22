import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getOrgAdminOverrideStatus } from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'

/**
 * Org lookup for the PGS admin-override panel (/admin/customers) — current
 * admin + member list for one organization, keyed by id (unlike
 * /api/okr-ally/org/members, which is scoped to the signed-in org admin's
 * own organization). Admin only.
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = await getOrgAdminOverrideStatus(user, params.id)
  if (!status) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

  return NextResponse.json(status)
}
