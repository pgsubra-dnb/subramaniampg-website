import { NextRequest, NextResponse } from 'next/server'
import { getSessionLearner } from '@/lib/academy'
import { getCompanyStatus, renderCompanyReportPdf, AcademyOrgError } from '@/lib/academyCorporate'

export const dynamic = 'force-dynamic'

/** The company seat-usage report as a PDF, for the signed-in admin. */
export async function GET(req: NextRequest) {
  const learner = await getSessionLearner(req)
  if (!learner) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  try {
    const status = await getCompanyStatus(learner.email)
    const pdf = await renderCompanyReportPdf(status)
    const safeName = status.organization.name.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '') || 'company'
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="academy-seats-${safeName}.pdf"`,
      },
    })
  } catch (e) {
    if (e instanceof AcademyOrgError) {
      return NextResponse.json({ error: e.message }, { status: 403 })
    }
    console.error('Academy corporate report error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
