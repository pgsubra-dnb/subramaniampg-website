import { NextRequest, NextResponse } from 'next/server'
import { getLearnerByEmail, generateToken, storeMagicToken, sendBrevoEmail } from '@/lib/academy'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 })
    }

    const learner = await getLearnerByEmail(email)
    if (!learner) {
      // Do not reveal whether email exists
      return NextResponse.json({ success: true })
    }

    const token = generateToken()
    await storeMagicToken(email, token, learner._id)

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://subramaniampg.guru'
    const magicLink = `${siteUrl}/api/academy/verify?token=${token}`

    await sendBrevoEmail(
      email,
      'Your Academy login link',
      `
        <p>Hi ${learner.name},</p>
        <p>Click this link to return to your course. The link expires in 15 minutes.</p>
        <p><a href="${magicLink}" style="background:#633806;color:#FAEEDA;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;">Return to my course</a></p>
        <p>If you did not request this link, ignore this email.</p>
        <p>Subramaniam P G<br>Embiggen Consulting LLP</p>
      `
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Magic link error:', error)
    return NextResponse.json({ error: 'Failed to send login link' }, { status: 500 })
  }
}
