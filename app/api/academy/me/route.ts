import { NextRequest, NextResponse } from 'next/server'
import { sanityClient } from '@/lib/academy'

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('academy_session')?.value
    if (!sessionId) {
      return NextResponse.json({ authenticated: false })
    }

    const learner = await sanityClient.fetch(
      `*[_type == 'learnerRecord' && _id == $id][0]{
        _id, name, email, company, pointsTotal,
        enrolledCourses[]->{ _id, title, slug, status },
        completionLog,
        certificateRefs[]->{ certificateId, courseName, dateIssued }
      }`,
      { id: sessionId }
    )

    if (!learner) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({ authenticated: true, learner })
  } catch {
    return NextResponse.json({ authenticated: false })
  }
}
