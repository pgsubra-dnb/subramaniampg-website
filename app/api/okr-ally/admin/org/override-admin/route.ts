import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { overrideOrgAdmin } from '@/lib/okrAllyAdmin'
import { toBrand } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/**
 * Manual admin override (admin only). Body: { organizationId, newAdminEmail,
 * note?, brand? }. Immediate for both an existing org member and a brand-new
 * email — the unreachable-admin escape hatch the Company tab's own copy
 * points customers at (mailto:pgs@embiggen.co.in), now done from here instead
 * of by hand against the database.
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const result = await overrideOrgAdmin(user, {
    organizationId: typeof body.organizationId === 'string' ? body.organizationId : '',
    newAdminEmail: typeof body.newAdminEmail === 'string' ? body.newAdminEmail : '',
    note: typeof body.note === 'string' ? body.note : null,
    brand: toBrand(body.brand),
  })

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json(result)
}
