import { NextRequest, NextResponse } from 'next/server'
import { getCourseBySlug } from '@/lib/academyQueries'

export async function GET(_: NextRequest, { params }: { params: { slug: string } }) {
  const course = await getCourseBySlug(params.slug)
  if (!course) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ course })
}
