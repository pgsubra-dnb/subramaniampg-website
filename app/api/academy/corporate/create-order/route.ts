import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { sanityClient } from '@/lib/academy'
import { seatPricing } from '@/lib/academyCorporate'
import { GST_STATES, stateCode, GSTIN_RE } from '@/lib/indiaGstStates'

export const dynamic = 'force-dynamic'

/**
 * Create a Razorpay order for a corporate Academy seat purchase.
 *
 * Anonymous (no learner session needed) — the buyer supplies their own email
 * plus the company details and a designated-admin email. Price is computed
 * server-side from the Sanity course price; every field the fulfilment path
 * needs is stamped into the order `notes` so the client cannot influence what
 * gets granted.
 *
 * Body: { courseSlug, seats, companyName, gstin, registeredAddress, buyerState,
 *         buyerEmail, adminEmail, couponCode? }
 */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SEATS_MAX = 500

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))

    const seats = Number(body.seats)
    if (!Number.isInteger(seats) || seats < 1) {
      return NextResponse.json({ error: 'Choose how many seats you need (1 or more).' }, { status: 400 })
    }
    if (seats > SEATS_MAX) {
      return NextResponse.json(
        { error: `For more than ${SEATS_MAX} seats, email pgs@embiggen.co.in.` },
        { status: 400 }
      )
    }

    const courseSlug = typeof body.courseSlug === 'string' ? body.courseSlug.trim() : ''
    if (!courseSlug) return NextResponse.json({ error: 'Pick a course.' }, { status: 400 })

    const course = await sanityClient.fetch(
      `*[_type == 'course' && slug.current == $slug][0]{ _id, title, "slug": slug.current, price, status }`,
      { slug: courseSlug },
      { cache: 'no-store' }
    )
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 })
    if (course.status !== 'published') {
      return NextResponse.json({ error: 'That course is not open for enrolment yet.' }, { status: 400 })
    }
    if (!course.price || course.price <= 0) {
      return NextResponse.json(
        { error: 'That course is free — enrol your team directly, no corporate purchase needed.' },
        { status: 400 }
      )
    }

    const companyName = typeof body.companyName === 'string' ? body.companyName.trim() : ''
    if (companyName.length < 2 || companyName.length > 200) {
      return NextResponse.json({ error: 'Enter the company name.' }, { status: 400 })
    }

    const gstin = typeof body.gstin === 'string' ? body.gstin.trim().toUpperCase() : ''
    if (!GSTIN_RE.test(gstin)) {
      return NextResponse.json(
        { error: 'That GSTIN is not valid (15 characters, e.g. 29ABCDE1234F1Z5).' },
        { status: 400 }
      )
    }

    const registeredAddress =
      typeof body.registeredAddress === 'string' ? body.registeredAddress.trim() : ''
    if (registeredAddress.length < 10 || registeredAddress.length > 500) {
      return NextResponse.json({ error: 'Enter the company’s registered address.' }, { status: 400 })
    }

    const rawState = typeof body.buyerState === 'string' ? body.buyerState.trim() : ''
    const code = rawState && stateCode(rawState)
    if (!code) return NextResponse.json({ error: 'Select the state (place of supply).' }, { status: 400 })
    const placeOfSupply = GST_STATES.find((s) => s.code === code)!.name

    const buyerEmail = typeof body.buyerEmail === 'string' ? body.buyerEmail.trim().toLowerCase() : ''
    if (!EMAIL_RE.test(buyerEmail)) {
      return NextResponse.json({ error: 'Enter a valid billing email address.' }, { status: 400 })
    }

    const adminEmail = typeof body.adminEmail === 'string' ? body.adminEmail.trim().toLowerCase() : ''
    if (!EMAIL_RE.test(adminEmail)) {
      return NextResponse.json({ error: 'Enter a valid designated-admin email address.' }, { status: 400 })
    }

    // Coupon (optional) — Sanity `coupon`, percentage, anchored to this course.
    let discountPercent = 0
    let couponCode: string | null = null
    const rawCoupon = typeof body.couponCode === 'string' ? body.couponCode.trim().toUpperCase() : ''
    if (rawCoupon) {
      const today = new Date().toISOString().split('T')[0]
      const coupon = await sanityClient.fetch(
        `*[_type == 'coupon' && code == $code && applicableCourse->slug.current == $slug][0]{
          discountPercent, active, expiryDate
        }`,
        { code: rawCoupon, slug: courseSlug },
        { cache: 'no-store' }
      )
      if (!coupon || !coupon.active) {
        return NextResponse.json({ error: 'That coupon is not valid.' }, { status: 400 })
      }
      if (coupon.expiryDate && coupon.expiryDate < today) {
        return NextResponse.json({ error: 'That coupon has expired.' }, { status: 400 })
      }
      if (coupon.discountPercent >= 100) {
        return NextResponse.json(
          { error: 'A fully-free coupon can’t be used for a corporate purchase — email pgs@embiggen.co.in.' },
          { status: 400 }
        )
      }
      discountPercent = coupon.discountPercent
      couponCode = rawCoupon
    }

    const p = seatPricing(course.price, seats, discountPercent)

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    })

    const order = await razorpay.orders.create({
      amount: p.amountInPaise,
      currency: 'INR',
      receipt: `acadcorp_${Date.now()}`.slice(0, 40),
      notes: {
        app: 'academy',
        kind: 'corporate',
        courseId: course._id,
        courseSlug: course.slug,
        courseTitle: course.title,
        seats: String(p.seats),
        companyName,
        gstin,
        registeredAddress,
        placeOfSupply,
        adminEmail,
        buyerEmail,
        listPrice: String(p.listPrice),
        base: String(p.base),
        gst: String(p.gst),
        total: String(p.total),
        discountPercent: String(p.discountPercent),
        couponCode: couponCode ?? '',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      seats: p.seats,
      courseTitle: course.title,
      listPrice: p.listPrice,
      base: p.base,
      gst: p.gst,
      total: p.total,
      discountPercent: p.discountPercent,
      prefill: { email: buyerEmail },
    })
  } catch (error) {
    console.error('Academy corporate create-order error:', error)
    return NextResponse.json({ error: 'Failed to create order.' }, { status: 500 })
  }
}
