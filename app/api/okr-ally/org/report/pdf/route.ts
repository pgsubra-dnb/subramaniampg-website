import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getEmployeeOrgReport, renderOrgReportPdf, OrgError } from '@/lib/okrAllyOrg'
import { toBrand } from '@/lib/okrAllyBrand'

export const dynamic = 'force-dynamic'

/** Company Admin — the per-employee usage report as a PDF. Query: ?email= */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const email = req.nextUrl.searchParams.get('email') ?? ''
  try {
    const report = await getEmployeeOrgReport(user, email)
    if (!report) return NextResponse.json({ error: 'Nothing to report for that email.' }, { status: 404 })
    const bytes = await renderOrgReportPdf(report, toBrand(req.nextUrl.searchParams.get('brand')))
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OKR-Ally-usage-${email.replace(/[^a-z0-9]+/gi, '-')}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    })
  } catch (e) {
    if (e instanceof OrgError) {
      const forbidden = e.message === 'Not an organization admin'
      return NextResponse.json({ error: forbidden ? 'Forbidden' : e.message }, { status: forbidden ? 403 : 400 })
    }
    console.error('OKR Ally org report pdf error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
