import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { sanityClient } from '@/lib/academy'

export async function POST(req: NextRequest) {
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
  try {
    const body = await req.json()
    const { courseSlug, email, orderType } = body

    if (!courseSlug || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const course = await sanityClient.fetch(
      `*[_type == 'course' && slug.current == $slug][0] {
        price, title,
        paidConsultation { price, enabled }
      }`,
      { slug: courseSlug }
    )

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }

    let basePrice: number
    if (orderType === 'consultation') {
      if (!course.paidConsultation?.enabled) {
        return NextResponse.json({ error: 'Consultation not available for this course' }, { status: 400 })
      }
      basePrice = course.paidConsultation.price
    } else {
      const discountPercent: number = body.discountPercent ?? 0
      basePrice = Math.round(course.price * (1 - discountPercent / 100))
    }

    const gst = Math.round(basePrice * 0.18)
    const total = basePrice + gst
    const amountInPaise = Math.round(total * 100)

    if (amountInPaise < 100) {
      return NextResponse.json({ free: true })
    }

    const order = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}_${email.split('@')[0]}`.slice(0, 40),
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      discountedPrice: basePrice,
      gst,
      total,
    })
  } catch (error) {
    console.error('Create order error:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}
