import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { listAdminCustomers } from '@/lib/okrAllyAdmin'

export const dynamic = 'force-dynamic'

/**
 * Aggregate customer list for the /admin/customers dashboard — every
 * individual and corporate customer, purchase/usage figures, and the
 * follow-up Status flag. Read-only, admin-only.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  if (!user.is_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(await listAdminCustomers(user))
}
