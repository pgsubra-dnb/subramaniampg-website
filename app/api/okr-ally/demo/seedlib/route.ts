import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { seedLibraryStatus } from '@/lib/okrAllyDemo'
import { buildSeedEntry } from '@/lib/okrAllyDemoSeedBuild'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * Build / inspect the demo seed library (PGS's `is_admin` account only).
 *
 * GET  → current library contents.
 * POST { only, force } → build one entry:
 *   only='real'       clones PGS's single real submission+review (read-only).
 *   only='S1'..'S4'   runs the synthetic draft through the REAL review engine.
 *
 * One entry per call to stay under maxDuration. Idempotent unless `force`.
 */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user?.is_admin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })
  return NextResponse.json(await seedLibraryStatus())
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user?.is_admin) return NextResponse.json({ error: 'Admin only.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const only = typeof body.only === 'string' ? body.only.trim() : ''
  if (!only) return NextResponse.json({ error: 'pass { only: "real" | "S1".."S4" }' }, { status: 400 })

  const r = await buildSeedEntry(only, body.force === true)
  return NextResponse.json(r, { status: r.ok ? 200 : 400 })
}
