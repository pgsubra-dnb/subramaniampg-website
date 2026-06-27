import { NextRequest, NextResponse } from 'next/server'
import { getLesson } from '@/lib/academyQueries'

export async function GET(_: NextRequest, { params }: { params: { lessonId: string } }) {
  const lesson = await getLesson(params.lessonId)
  if (!lesson) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ lesson })
}
