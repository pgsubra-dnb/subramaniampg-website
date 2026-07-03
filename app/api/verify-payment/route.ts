import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  getLearnerByEmail,
  generateToken,
  storeMagicToken,
  sendBrevoEmail,
  sanityClient,
} from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      courseSlug,
      orderType,
    } = await req.json()

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email || !courseSlug) {
      return NextResponse.json({ success: false, reason: 'Missing required fields' }, { status: 400 })
    }

    // Verify Razorpay signature
    const body = razorpay_order_id + '|' + razorpay_payment_id
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ success: false, reason: 'Signature mismatch' }, { status: 400 })
    }

    const course = await sanityClient.fetch(
      `*[_type == 'course' && slug.current == $slug][0] {
        _id, title,
        paidConsultation { price, enabled, bookingLink -> { url } }
      }`,
      { slug: courseSlug }
    )

    if (!course) {
      return NextResponse.json({ success: false, reason: 'Course not found' }, { status: 404 })
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'

    // ── Consultation payment ────────────────────────────────────────
    if (orderType === 'consultation') {
      const bookingUrl = course.paidConsultation?.bookingLink?.url || ''
      const price = course.paidConsultation?.price || 0
      const gst = Math.round(price * 0.18)
      const total = price + gst

      await sendBrevoEmail(
        email,
        `Expert Guidance Call confirmed — ${course.title}`,
        `
          <p>Your payment of ₹${total.toLocaleString('en-IN')} (including GST) has been received.</p>
          <p>Use the link below to select your time slot for your one-hour Expert Guidance Call with PGS:</p>
          <p><a href="${bookingUrl}" style="background:#633806;color:#FAEEDA;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Select your time slot</a></p>
          <p>If the button doesn't work, copy this link: ${bookingUrl}</p>
          <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
        `
      )

      await sendBrevoEmail(
        'pgs@embiggen.co.in',
        `Paid consultation booked — ${course.title}`,
        `
          <p>A paid Expert Guidance Call has been booked.</p>
          <p><strong>Course:</strong> ${course.title}<br>
          <strong>Learner:</strong> ${email}<br>
          <strong>Amount:</strong> ₹${total.toLocaleString('en-IN')} (incl. GST)<br>
          <strong>Payment ID:</strong> ${razorpay_payment_id}</p>
        `,
        true
      )

      await sanityClient.create({
        _type: 'bookingPurchase',
        learnerEmail: email,
        course: { _type: 'reference', _ref: course._id },
        amount: total,
        razorpayPaymentId: razorpay_payment_id,
        paidAt: new Date().toISOString(),
      })

      return NextResponse.json({ success: true, bookingUrl })
    }

    // ── Course enrolment payment (existing flow) ────────────────────
    let learner = await getLearnerByEmail(email)

    if (!learner) {
      learner = await sanityClient.create({
        _type: 'learnerRecord',
        name: email.split('@')[0],
        email,
        company: '',
        enrolledCourses: [{ _type: 'reference', _ref: course._id }],
        completionLog: [],
        pointsTotal: 0,
        certificateRefs: [],
        advancedCourseInterest: false,
      })
    } else {
      const alreadyEnrolled = learner.enrolledCourses?.some(
        (c: { _ref: string }) => c._ref === course._id
      )
      if (!alreadyEnrolled) {
        await sanityClient.patch(learner._id).append('enrolledCourses', [
          { _type: 'reference', _ref: course._id }
        ]).commit()
      }
    }

    const token = generateToken()
    await storeMagicToken(email, token, learner._id)
    const magicLink = `${siteUrl}/api/academy/verify?token=${token}`

    await sendBrevoEmail(
      email,
      `You are enrolled in ${course.title}`,
      `
        <p>Thank you for your payment.</p>
        <p>You are now enrolled in <strong>${course.title}</strong>.</p>
        <p>Click this link to start learning. The link expires in 15 minutes.</p>
        <p><a href="${magicLink}" style="background:#633806;color:#FAEEDA;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Start learning</a></p>
        <p>If the link has expired, visit your course page and enter your email to get a new one.</p>
        <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
      `
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Verify payment error:', error)
    return NextResponse.json({ success: false, reason: 'Internal error' }, { status: 500 })
  }
}
