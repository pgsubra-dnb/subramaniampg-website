import { NextRequest, NextResponse } from 'next/server'
import { getModuleWithQuiz } from '@/lib/academyQueries'

export async function GET(_: NextRequest, { params }: { params: { moduleId: string } }) {
  const academyModule = await getModuleWithQuiz(params.moduleId)
  if (!academyModule) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ module: academyModule })
}
