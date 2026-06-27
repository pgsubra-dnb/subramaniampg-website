import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('academy_session')?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { lessonId, points } = await req.json()
    if (!lessonId) {
      return NextResponse.json({ error: 'Lesson ID required' }, { status: 400 })
    }

    const learner = await sanityClient.getDocument(sessionId)
    if (!learner) {
      return NextResponse.json({ error: 'Learner not found' }, { status: 404 })
    }

    const alreadyDone = learner.completionLog?.some(
      (entry: { lessonId: string }) => entry.lessonId === lessonId
    )

    if (!alreadyDone) {
      await sanityClient.patch(sessionId)
        .append('completionLog', [{
          lessonId,
          completedAt: new Date().toISOString(),
        }])
        .inc({ pointsTotal: points || 10 })
        .commit()
    }

    return NextResponse.json({ success: true, alreadyCompleted: alreadyDone })
  } catch (error) {
    console.error('Lesson complete error:', error)
    return NextResponse.json({ error: 'Failed to record completion' }, { status: 500 })
  }
}
