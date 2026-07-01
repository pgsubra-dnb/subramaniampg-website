import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const { code, courseSlug } = await req.json()

    if (!code || !courseSlug) {
      return NextResponse.json({ valid: false, reason: 'Missing code or courseSlug' }, { status: 400 })
    }

    const upperCode = code.toUpperCase()
    const today = new Date().toISOString().split('T')[0]

    const coupon = await sanityClient.fetch(
      `*[_type == 'coupon' && code == $code][0] {
        discountPercent, active, expiryDate,
        "courseSlug": applicableCourse->slug.current
      }`,
      { code: upperCode }
    )

    if (!coupon) {
      return NextResponse.json({ valid: false, reason: 'Coupon not found' })
    }

    if (!coupon.active) {
      return NextResponse.json({ valid: false, reason: 'Coupon is inactive' })
    }

    if (coupon.expiryDate < today) {
      return NextResponse.json({ valid: false, reason: 'Coupon has expired' })
    }

    if (coupon.courseSlug !== courseSlug) {
      return NextResponse.json({ valid: false, reason: 'Coupon not valid for this course' })
    }

    return NextResponse.json({ valid: true, discountPercent: coupon.discountPercent })
  } catch (error) {
    console.error('Validate coupon error:', error)
    return NextResponse.json({ valid: false, reason: 'Internal error' }, { status: 500 })
  }
}
