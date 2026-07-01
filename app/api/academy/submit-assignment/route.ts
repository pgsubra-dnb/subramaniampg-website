import { NextRequest, NextResponse } from 'next/server'
import { sanityClient, sendBrevoEmail } from '@/lib/academy'

const ALLOWED_TYPES = ['xlsx', 'docx', 'pdf']
const MAX_BYTES = 10 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const sessionId = req.cookies.get('academy_session')?.value
    if (!sessionId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const form = await req.formData()
    const learnerEmail = form.get('learnerEmail') as string
    const courseSlug = form.get('courseSlug') as string
    const moduleId = form.get('moduleId') as string
    const moduleTitle = form.get('moduleTitle') as string
    const courseTitle = form.get('courseTitle') as string
    const assignmentId = form.get('assignmentId') as string
    const assignmentTitle = form.get('assignmentTitle') as string
    const textResponse = (form.get('textResponse') as string | null) || ''
    const linkUrl = (form.get('linkUrl') as string | null) || ''
    const fileUpload = form.get('fileUpload') as File | null

    if (!learnerEmail || !moduleId || !assignmentId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!textResponse && !linkUrl && !fileUpload) {
      return NextResponse.json({ error: 'At least one of text, file, or link is required' }, { status: 400 })
    }

    // Validate and upload file if present
    let fileAssetRef: string | null = null
    if (fileUpload && fileUpload.size > 0) {
      const ext = fileUpload.name.split('.').pop()?.toLowerCase() || ''
      if (!ALLOWED_TYPES.includes(ext)) {
        return NextResponse.json({ error: 'File type not allowed. Use .xlsx, .docx, or .pdf.' }, { status: 400 })
      }
      if (fileUpload.size > MAX_BYTES) {
        return NextResponse.json({ error: 'File exceeds 10 MB limit.' }, { status: 400 })
      }
      const arrayBuffer = await fileUpload.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const asset = await sanityClient.assets.upload('file', buffer, {
        filename: fileUpload.name,
        contentType: fileUpload.type || 'application/octet-stream',
      })
      fileAssetRef = asset._id
    }

    // Determine submission type
    const submissionType = fileAssetRef ? 'file' : linkUrl ? 'link' : 'text'

    // Fetch course ref
    const course = await sanityClient.fetch(
      `*[_type == 'course' && slug.current == $slug][0]{ _id }`,
      { slug: courseSlug }
    )

    // Create assignment submission doc
    const submission = await sanityClient.create({
      _type: 'assignmentSubmission',
      learnerEmail,
      course: course ? { _type: 'reference', _ref: course._id } : undefined,
      assignment: { _type: 'reference', _ref: assignmentId },
      moduleSlug: moduleId,
      submissionType,
      textResponse: textResponse || undefined,
      fileUpload: fileAssetRef ? { _type: 'file', asset: { _type: 'reference', _ref: fileAssetRef } } : undefined,
      linkUrl: linkUrl || undefined,
      submittedAt: new Date().toISOString(),
      feedbackSent: false,
    })

    // Mark module as submitted on the learner record (enables next module unlock)
    await sanityClient.patch(sessionId)
      .setIfMissing({ submittedAssignments: [] })
      .append('submittedAssignments', [{
        _key: `${moduleId}-${Date.now()}`,
        moduleId,
      }])
      .commit()

    // Email: confirmation to learner
    await sendBrevoEmail(
      learnerEmail,
      `Assignment received — ${courseTitle}`,
      `
        <p>Your assignment for <strong>${moduleTitle}</strong> has been received.</p>
        <p><strong>Assignment:</strong> ${assignmentTitle}</p>
        <p>PGS will review your submission and send feedback within 3 business days.</p>
        <p>In the meantime, the next module has already unlocked — you can continue learning.</p>
        <p>Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
      `
    )

    // Email: notification to PGS
    await sendBrevoEmail(
      'pgs@embiggen.co.in',
      `New assignment submission — ${courseTitle}: ${moduleTitle}`,
      `
        <p>A new assignment submission has arrived.</p>
        <p><strong>Course:</strong> ${courseTitle}<br>
        <strong>Module:</strong> ${moduleTitle}<br>
        <strong>Assignment:</strong> ${assignmentTitle}<br>
        <strong>Learner:</strong> ${learnerEmail}<br>
        <strong>Type:</strong> ${submissionType}<br>
        <strong>Submission ID:</strong> ${submission._id}</p>
        <p>Review it in Sanity Studio under Assignment Submissions.</p>
      `,
      true
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submit assignment error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
