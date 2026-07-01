'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Assignment {
  _id: string
  title: string
  prompt: string
}

function hashString(s: string): number {
  let hash = 5381
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) + s.charCodeAt(i)
    hash = hash & hash
  }
  return Math.abs(hash)
}

export default function AssignmentPage() {
  const params = useParams()
  const router = useRouter()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [moduleId, setModuleId] = useState('')
  const [moduleTitle, setModuleTitle] = useState('')
  const [courseTitle, setCourseTitle] = useState('')
  const [learnerEmail, setLearnerEmail] = useState('')
  const [textResponse, setTextResponse] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/academy/me').then(r => r.json())
      if (!meRes.authenticated) { router.push(`/academy/${params.courseSlug}`); return }
      setLearnerEmail(meRes.learner.email)

      const courseRes = await fetch(`/api/academy/course/${params.courseSlug}`).then(r => r.json())
      const courseData = courseRes.course
      setCourseTitle(courseData?.title || '')

      const mod = courseData?.modules?.find((m: { order: number }) => m.order === Number(params.moduleOrder))
      if (!mod) { router.push(`/academy/${params.courseSlug}`); return }
      setModuleId(mod._id)
      setModuleTitle(mod.title)

      const modRes = await fetch(`/api/academy/module-assignments/${mod._id}`).then(r => r.json())
      const bank: Assignment[] = modRes.assignmentBank || []
      if (bank.length === 0) {
        // No assignments configured — skip straight to complete
        router.push(`/academy/${params.courseSlug}/${params.moduleOrder}/complete`)
        return
      }
      const seed = hashString(meRes.learner.email + mod._id)
      const selected = bank[seed % bank.length]
      setAssignment(selected)
      setLoading(false)
    }
    load()
  }, [params, router])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const allowed = ['xlsx', 'docx', 'pdf']
    const ext = f.name.split('.').pop()?.toLowerCase() || ''
    if (!allowed.includes(ext)) {
      setFileError('Only .xlsx, .docx, and .pdf files are accepted.')
      setFile(null)
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      setFileError('File is over 10 MB. Use the Google Doc / Sheet link field instead.')
      setFile(null)
      return
    }
    setFileError('')
    setFile(f)
  }

  async function handleSubmit() {
    if (!assignment || !moduleId || !learnerEmail) return
    if (!textResponse.trim() && !file && !linkUrl.trim()) return
    setSubmitting(true)

    const formData = new FormData()
    formData.append('learnerEmail', learnerEmail)
    formData.append('courseSlug', params.courseSlug as string)
    formData.append('moduleId', moduleId)
    formData.append('moduleTitle', moduleTitle)
    formData.append('courseTitle', courseTitle)
    formData.append('assignmentId', assignment._id)
    formData.append('assignmentTitle', assignment.title)
    if (textResponse.trim()) formData.append('textResponse', textResponse.trim())
    if (file) formData.append('fileUpload', file)
    if (linkUrl.trim()) formData.append('linkUrl', linkUrl.trim())

    const res = await fetch('/api/academy/submit-assignment', {
      method: 'POST',
      body: formData,
    }).then(r => r.json())

    if (res.success) {
      setSubmitted(true)
      setTimeout(() => {
        router.push(`/academy/${params.courseSlug}/${params.moduleOrder}/complete`)
      }, 2500)
    } else {
      alert(res.error || 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5', color: '#5F5E5A' }}>
      Loading assignment...
    </div>
  )

  if (submitted) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#FAF8F5' }}>
      <div className="max-w-md text-center px-6">
        <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: '#E1F5EE' }}>
          <span style={{ color: '#1D9E75', fontSize: '1.5rem' }}>✓</span>
        </div>
        <h2 className="text-xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          Assignment received
        </h2>
        <p className="text-sm" style={{ color: '#5F5E5A' }}>
          You will receive feedback from PGS within 3 business days. Taking you to the next module now.
        </p>
      </div>
    </div>
  )

  const canSubmit = !submitting && (!!textResponse.trim() || !!file || !!linkUrl.trim())

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-6 py-10">

        <p className="text-xs mb-2 tracking-widest" style={{ color: '#633806' }}>ASSIGNMENT</p>
        <h1 className="text-2xl mb-1" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          {assignment?.title}
        </h1>
        <p className="text-xs mb-6" style={{ color: '#888780' }}>{moduleTitle}</p>

        <div className="p-5 rounded-lg border mb-8" style={{ borderColor: '#D3D1C7', background: '#FFFFFF' }}>
          <p className="text-sm leading-relaxed" style={{ color: '#2C2C2A' }}>{assignment?.prompt}</p>
        </div>

        <p className="text-xs mb-4 font-medium" style={{ color: '#5F5E5A' }}>
          Submit your response below — choose whichever format works for you. At least one is required.
        </p>

        {/* Text response */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#2C2C2A' }}>
            Written response
          </label>
          <textarea
            value={textResponse}
            onChange={e => setTextResponse(e.target.value)}
            rows={6}
            placeholder="Type your response here..."
            className="w-full px-3 py-2.5 text-sm rounded border outline-none resize-y"
            style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }}
          />
        </div>

        {/* File upload */}
        <div className="mb-5">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#2C2C2A' }}>
            File upload (.xlsx, .docx, .pdf — max 10 MB)
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.docx,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm"
            style={{ color: '#5F5E5A' }}
          />
          {fileError && <p className="text-xs mt-1" style={{ color: '#A32D2D' }}>{fileError}</p>}
          {file && !fileError && (
            <p className="text-xs mt-1" style={{ color: '#1D9E75' }}>Selected: {file.name}</p>
          )}
          <p className="text-xs mt-2" style={{ color: '#888780' }}>
            Files larger than 10 MB — share a Google Doc or Google Sheet link instead.
          </p>
        </div>

        {/* Link */}
        <div className="mb-8">
          <label className="block text-xs font-medium mb-1.5" style={{ color: '#2C2C2A' }}>
            Google Doc or Google Sheet link
          </label>
          <input
            type="url"
            value={linkUrl}
            onChange={e => setLinkUrl(e.target.value)}
            placeholder="https://docs.google.com/..."
            className="w-full px-3 py-2.5 text-sm rounded border outline-none"
            style={{ borderColor: '#D3D1C7', background: '#FFFFFF', color: '#2C2C2A' }}
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full py-3 rounded font-medium text-sm"
          style={{
            background: '#633806',
            color: '#FAEEDA',
            opacity: canSubmit ? 1 : 0.45,
            cursor: canSubmit ? 'pointer' : 'not-allowed',
          }}>
          {submitting ? 'Submitting...' : 'Submit assignment'}
        </button>

        <p className="text-xs text-center mt-4" style={{ color: '#888780' }}>
          Submission unlocks the next module immediately. Feedback arrives within 3 business days.
        </p>
      </div>
    </main>
  )
}
