import { NextRequest, NextResponse } from 'next/server'
import { sanityClient, sendBrevoEmail } from '@/lib/academy'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('academy_session')?.value
    const { reflection, lessonTitle, moduleTitle } = await req.json()

    let learnerName = 'A learner'
    let learnerEmail = ''

    if (sessionId) {
      const learner = await sanityClient.getDocument(sessionId)
      if (learner) {
        learnerName = learner.name
        learnerEmail = learner.email
      }
    }

    const subject = `OKR Foundations reflection — ${lessonTitle}`
    const html = `
      <p><strong>Learner:</strong> ${learnerName}</p>
      ${learnerEmail ? `<p><strong>Email:</strong> ${learnerEmail}</p>` : ''}
      <p><strong>Module:</strong> ${moduleTitle || '—'}</p>
      <p><strong>Lesson:</strong> ${lessonTitle}</p>
      <hr />
      <p><strong>Reflection:</strong></p>
      <p>${reflection}</p>
    `

    // Email PGS directly — no BCC
    await sendBrevoEmail('pgs@embiggen.co.in', subject, html, true)

    // Email student a copy if we have their address
    if (learnerEmail) {
      await sendBrevoEmail(
        learnerEmail,
        `Your reflection — ${lessonTitle}`,
        `<p>Hi ${learnerName},</p>
        <p>Here is a copy of your reflection from the OKR Foundations course.</p>
        <p><strong>Lesson:</strong> ${lessonTitle}</p>
        <hr />
        <p>${reflection}</p>
        <p>Subramaniam P G<br>Embiggen Consulting LLP</p>`
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reflection email error:', error)
    return NextResponse.json({ success: false })
  }
}
