import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getEmployeeOrgReport, OrgError } from '@/lib/okrAllyOrg'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/** Company Admin — per-employee usage report (org-scoped, zero personal-account
 *  data). Query: ?email= */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const email = req.nextUrl.searchParams.get('email') ?? ''
  const v = vocab(toBrand(req.nextUrl.searchParams.get('brand')))
  try {
    const report = await getEmployeeOrgReport(user, email)
    if (!report) return NextResponse.json({ error: `Your organization has not allocated ${v.reviews} to that email.` }, { status: 404 })
    return NextResponse.json(report)
  } catch (e) {
    if (e instanceof OrgError) {
      const forbidden = e.message === 'Not an organization admin'
      return NextResponse.json({ error: forbidden ? 'Forbidden' : e.message }, { status: forbidden ? 403 : 400 })
    }
    console.error('OKR Ally org report error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
