import { NextRequest, NextResponse } from 'next/server'
import { getLearnerByEmail, createLearnerRecord, sendBrevoEmail, upsertBrevoContact, sanityClient } from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, courseId, courseSlug } = await req.json()

    if (!name || !email || !courseId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    let learner = await getLearnerByEmail(email)

    if (!learner) {
      learner = await createLearnerRecord({ name, email, company, courseId })
    } else {
      const alreadyEnrolled = learner.enrolledCourses?.some(
        (c: { _ref: string }) => c._ref === courseId
      )
      if (!alreadyEnrolled) {
        await sanityClient.patch(learner._id).append('enrolledCourses', [
          { _type: 'reference', _ref: courseId }
        ]).commit()
      }
    }

    await upsertBrevoContact(email, {
      FIRSTNAME: name.split(' ')[0],
      LASTNAME: name.split(' ').slice(1).join(' '),
      COMPANY: company,
      ACADEMY_ENROLLED: 'true',
      ENROLLED_COURSE: courseSlug,
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
    await sendBrevoEmail(
      email,
      'Welcome to OKR Foundations — You are enrolled',
      `
        <p>Hi ${name},</p>
        <p>You are now enrolled in <strong>OKR Foundations</strong>.</p>
        <p>Start learning here: <a href="${siteUrl}/academy/${courseSlug}">${siteUrl}/academy/${courseSlug}</a></p>
        <p>If you ever need to return to the course, just visit that link and enter your email to get a login link.</p>
        <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
      `
    )

    return NextResponse.json({ success: true, learnerId: learner._id })
  } catch (error) {
    console.error('Enrolment error:', error)
    return NextResponse.json({ error: 'Enrolment failed' }, { status: 500 })
  }
}
