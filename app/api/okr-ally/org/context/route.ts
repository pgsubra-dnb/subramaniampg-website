import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { setOrgContext, OrgError } from '@/lib/okrAllyOrg'

export const dynamic = 'force-dynamic'

/**
 * Company Admin — publish the org's shared company + business context.
 * One action: stores the text AND stamps `context_confirmed_at = now()`
 * (which is what lets the org's employees start reviews). 403 for a non-admin.
 *
 * Body: { companyContext: string, businessContext: string }
 */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const companyContext = typeof body.companyContext === 'string' ? body.companyContext : ''
  const businessContext = typeof body.businessContext === 'string' ? body.businessContext : ''

  try {
    const r = await setOrgContext(user, { companyContext, businessContext })
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ ok: true, contextConfirmedAt: r.contextConfirmedAt })
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('OKR Ally org context error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
