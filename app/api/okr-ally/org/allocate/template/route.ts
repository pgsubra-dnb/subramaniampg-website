import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { requireOrgAdmin, OrgError } from '@/lib/okrAllyOrg'
import { toBrand, vocab } from '@/lib/okrAllyBrand'
import { toCsvRow } from '@/lib/csv'

export const dynamic = 'force-dynamic'

/** Company Admin — downloadable CSV template for bulk allocation.
 *  Query: ?brand=okr_ally|goal_ally. Two columns: email, <brand's review unit>. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  try {
    requireOrgAdmin(user)
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    throw e
  }

  const v = vocab(toBrand(req.nextUrl.searchParams.get('brand')))
  const csv =
    [toCsvRow(['email', v.reviews]), toCsvRow(['jane@example.com', 10])].join('\r\n') + '\r\n'

  return new NextResponse(csv, {
    headers: {
      'content-type': 'text/csv; charset=utf-8',
      'content-disposition': `attachment; filename="${v.path.slice(1)}-bulk-allocation-template.csv"`,
    },
  })
}
