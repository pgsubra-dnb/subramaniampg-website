import { NextRequest, NextResponse } from 'next/server'
import { sanityClient, upsertBrevoContact } from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('academy_session')?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { courseId, courseSlug, starRating, mostUseful, wouldRecommend, advancedInterest } = await req.json()

    const learner = await sanityClient.getDocument(sessionId)
    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    await sanityClient.create({
      _type: 'feedbackRecord',
      learnerRef: { _type: 'reference', _ref: sessionId },
      courseRef: { _type: 'reference', _ref: courseId },
      starRating,
      mostUseful,
      wouldRecommend,
      advancedInterest,
      displayPermission: false,
      published: false,
      submittedAt: new Date().toISOString(),
    })

    if (advancedInterest === 'yes') {
      await sanityClient.patch(sessionId).set({ advancedCourseInterest: true }).commit()
    }

    // Derive course-generic Brevo attribute prefix from slug
    // e.g. "okr-foundations" → "OKR_FOUNDATIONS", "raci-decoded" → "RACI_DECODED"
    const prefix = (courseSlug || 'course').toUpperCase().replace(/-/g, '_')

    await upsertBrevoContact(learner.email, {
      [`${prefix}_FEEDBACK`]: 'true',
      [`${prefix}_ADVANCED_INTEREST`]: advancedInterest === 'yes' ? 'true' : 'false',
      [`${prefix}_STAR_RATING`]: String(starRating),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Feedback error:', error)
    return NextResponse.json({ error: 'Feedback submission failed' }, { status: 500 })
  }
}
