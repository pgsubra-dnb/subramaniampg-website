import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/academy'

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get('name')
  const course = await sanityClient.fetch(
    `*[_type == 'course' && title == $name][0]{
      descriptionLine,
      badgeImage { asset -> { url } }
    }`,
    { name }
  )
  return NextResponse.json({
    descriptionLine: course?.descriptionLine || '',
    badgeImageUrl: course?.badgeImage?.asset?.url || null,
  })
}
