import { NextRequest, NextResponse } from 'next/server'
import { getLearnerByEmail, createLearnerRecord, sendBrevoEmail, sanityClient } from '@/lib/academy'

const BASE = 'https://api.brevo.com/v3'

async function getExistingEnrolledCourses(apiKey: string, email: string): Promise<string> {
  try {
    const res = await fetch(`${BASE}/contacts/${encodeURIComponent(email)}`, {
      headers: { 'api-key': apiKey },
    })
    if (!res.ok) return ''
    const data = await res.json() as { attributes?: Record<string, unknown> }
    return (data.attributes?.ENROLLED_COURSE as string) ?? ''
  } catch {
    return ''
  }
}

export async function POST(req: NextRequest) {
  try {
    const { name, email, company, courseId, courseSlug, courseTitle } = await req.json()

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

    const apiKey = process.env.BREVO_API_KEY ?? ''

    // Build additive ENROLLED_COURSE list — never overwrite an existing course slug
    const existing = await getExistingEnrolledCourses(apiKey, email)
    const existingCourses = existing ? existing.split(',').map(s => s.trim()).filter(Boolean) : []
    if (!existingCourses.includes(courseSlug)) {
      existingCourses.push(courseSlug)
    }
    const enrolledCourseValue = existingCourses.join(', ')

    await fetch(`${BASE}/contacts`, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        attributes: {
          FIRSTNAME: name.split(' ')[0],
          LASTNAME: name.split(' ').slice(1).join(' '),
          COMPANY: company,
          ACADEMY_ENROLLED: 'true',
          ENROLLED_COURSE: enrolledCourseValue,
        },
        updateEnabled: true,
      }),
    })

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
    await sendBrevoEmail(
      email,
      `Welcome to ${courseTitle} — You are enrolled`,
      `
        <p>Hi ${name},</p>
        <p>You are now enrolled in <strong>${courseTitle}</strong>.</p>
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
