import { NextRequest, NextResponse } from 'next/server'
import { getModuleAssignmentBank } from '@/lib/academyQueries'

export async function GET(_: NextRequest, { params }: { params: { moduleId: string } }) {
  const mod = await getModuleAssignmentBank(params.moduleId)
  if (!mod) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ assignmentBank: mod.assignmentBank || [] })
}
