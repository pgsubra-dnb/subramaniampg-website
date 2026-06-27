import { NextRequest, NextResponse } from 'next/server'
import { sanityClient, generateCertificateId, sendBrevoEmail, upsertBrevoContact } from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('academy_session')?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { courseId } = await req.json()

    const [learner, course] = await Promise.all([
      sanityClient.getDocument(sessionId),
      sanityClient.fetch(
        `*[_type == 'course' && _id == $courseId][0]{
          _id, title, descriptionLine,
          badgeImage { asset -> { url } }
        }`,
        { courseId }
      ),
    ])

    if (!learner || !course) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    const existing = await sanityClient.fetch(
      `*[_type == 'certificateRecord' && learnerRef._ref == $learnerId && courseRef._ref == $courseId][0]`,
      { learnerId: sessionId, courseId }
    )

    let certRecord = existing

    if (!existing) {
      const certId = generateCertificateId('OKR-F')

      certRecord = await sanityClient.create({
        _type: 'certificateRecord',
        certificateId: certId,
        learnerRef: { _type: 'reference', _ref: sessionId },
        courseRef: { _type: 'reference', _ref: courseId },
        learnerName: learner.name,
        courseName: course.title,
        dateIssued: new Date().toISOString(),
        pointsScored: learner.pointsTotal,
        brevoSynced: false,
      })

      await sanityClient.patch(sessionId)
        .append('certificateRefs', [{ _type: 'reference', _ref: certRecord._id }])
        .commit()

      await upsertBrevoContact(learner.email, {
        OKR_FOUNDATIONS_CERTIFIED: 'true',
        OKR_FOUNDATIONS_CERT_ID: certId,
        OKR_FOUNDATIONS_DATE: new Date().toISOString().split('T')[0],
      })

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
      await sendBrevoEmail(
        learner.email,
        `Congratulations ${learner.name} — Your OKR Foundations certificate`,
        `
          <p>Hi ${learner.name},</p>
          <p>Congratulations on completing <strong>OKR Foundations</strong>.</p>
          <p>Your certificate ID is: <strong>${certId}</strong></p>
          <p>Download your certificate here: <a href="${siteUrl}/academy/dashboard">Visit your dashboard</a></p>
          <p>You can verify this certificate anytime using your certificate ID at ${siteUrl}/academy/verify-certificate</p>
          <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
        `
      )

      await sanityClient.patch(certRecord._id).set({ brevoSynced: true }).commit()
    }

    return NextResponse.json({
      success: true,
      certificate: {
        certificateId: certRecord.certificateId,
        learnerName: learner.name,
        courseTitle: course.title,
        descriptionLine: course.descriptionLine,
        dateIssued: certRecord.dateIssued,
        badgeImageUrl: course.badgeImage?.asset?.url || null,
      }
    })
  } catch (error) {
    console.error('Certificate error:', error)
    return NextResponse.json({ error: 'Certificate generation failed' }, { status: 500 })
  }
}
