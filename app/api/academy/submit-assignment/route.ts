import { NextRequest, NextResponse } from 'next/server'
import { sanityClient, sendBrevoEmailToMany, renderAcademyEmail, escapeHtml } from '@/lib/academy'

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
    let fileBuffer: Buffer | null = null
    let fileName: string | null = null
    if (fileUpload && fileUpload.size > 0) {
      const ext = fileUpload.name.split('.').pop()?.toLowerCase() || ''
      if (!ALLOWED_TYPES.includes(ext)) {
        return NextResponse.json({ error: 'File type not allowed. Use .xlsx, .docx, or .pdf.' }, { status: 400 })
      }
      if (fileUpload.size > MAX_BYTES) {
        return NextResponse.json({ error: 'File exceeds 10 MB limit.' }, { status: 400 })
      }
      const arrayBuffer = await fileUpload.arrayBuffer()
      fileBuffer = Buffer.from(arrayBuffer)
      fileName = fileUpload.name
      const asset = await sanityClient.assets.upload('file', fileBuffer, {
        filename: fileName,
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
    await sanityClient.create({
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

    // Single combined email to both the learner and PGS
    const learner = await sanityClient.fetch(
      `*[_id == $id][0]{ name }`,
      { id: sessionId }
    )

    const sections: string[] = []
    if (textResponse) {
      sections.push(`
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#633806;">Written response</p>
        <p style="margin:0 0 20px;white-space:pre-wrap;color:#5F5E5A;font-size:14px;line-height:1.6;">${escapeHtml(textResponse)}</p>
      `)
    }
    if (linkUrl) {
      sections.push(`
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#633806;">Submitted link</p>
        <p style="margin:0 0 20px;font-size:14px;"><a href="${escapeHtml(linkUrl)}" style="color:#633806;">${escapeHtml(linkUrl)}</a></p>
      `)
    }
    if (fileName) {
      sections.push(`
        <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:0.5px;text-transform:uppercase;color:#633806;">File upload</p>
        <p style="margin:0 0 20px;color:#5F5E5A;font-size:14px;">Attached: ${escapeHtml(fileName)}</p>
      `)
    }

    const bodyHtml = `
      <div style="margin:0 0 24px;padding:16px;background:#FAF8F5;border-radius:6px;">
        <p style="margin:0 0 4px;font-size:13px;color:#2C2C2A;"><strong>Course:</strong> ${escapeHtml(courseTitle)}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#2C2C2A;"><strong>Module:</strong> ${escapeHtml(moduleTitle)}</p>
        <p style="margin:0 0 4px;font-size:13px;color:#2C2C2A;"><strong>Assignment:</strong> ${escapeHtml(assignmentTitle)}</p>
        <p style="margin:0;font-size:13px;color:#2C2C2A;"><strong>Learner:</strong> ${escapeHtml(learner?.name || '')} (${escapeHtml(learnerEmail)})</p>
      </div>
      ${sections.join('')}
      <p style="margin:24px 0 0;color:#5F5E5A;font-size:13px;">PGS will review this submission and send feedback within 3 business days. The next module has already unlocked.</p>
      <p style="margin:20px 0 0;color:#2C2C2A;font-size:13px;">Subramaniam P G<br>Growth Architect and Executive Coach<br>Embiggen Consulting LLP</p>
    `

    const recipients = Array.from(new Set([learnerEmail, 'pgs@embiggen.co.in'])).map(email => ({ email }))
    const attachments = fileBuffer && fileName
      ? [{ name: fileName, content: fileBuffer.toString('base64') }]
      : undefined

    await sendBrevoEmailToMany(
      recipients,
      `Assignment submitted — ${courseTitle}: ${moduleTitle}`,
      renderAcademyEmail('Assignment submitted', bodyHtml),
      attachments
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Submit assignment error:', error)
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 })
  }
}
