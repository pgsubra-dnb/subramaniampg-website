'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CertificateDisplay from '@/components/academy/CertificateDisplay'
import FeedbackForm from '@/components/academy/FeedbackForm'

const INFOGRAPHIC_PATHS: Record<number, string> = {
  1: '/infographics/module1-okr-explorer.svg',
  2: '/infographics/module2-okr-navigator.svg',
  3: '/infographics/module3-okr-practitioner.svg',
}

interface CertData {
  certificateId: string
  learnerName: string
  courseTitle: string
  descriptionLine: string
  dateIssued: string
  badgeImageUrl?: string
}

export default function ModuleCompletePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<{
    _id: string; title: string
    modules?: { _id: string; order: number; title: string; badgeName?: string; badgeImage?: { asset?: { url: string } } }[]
  } | null>(null)
  const [currentModule, setCurrentModule] = useState<{
    _id: string; order: number; title: string; badgeName?: string; badgeImage?: { asset?: { url: string } }
  } | null>(null)
  const [certificate, setCertificate] = useState<CertData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const moduleOrder = Number(params.moduleOrder)

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/academy/me').then(r => r.json())
        if (!meRes.authenticated) { router.push(`/academy/${params.courseSlug}`); return }

        const courseRes = await fetch(`/api/academy/course/${params.courseSlug}`).then(r => r.json())
        const courseData = courseRes.course
        setCourse(courseData)
        const mod = courseData?.modules?.find((m: { order: number }) => m.order === moduleOrder)
        setCurrentModule(mod)

        const isLastModule = moduleOrder === courseData?.modules?.length
        if (isLastModule) {
          setGenerating(true)
          try {
            const certRes = await fetch('/api/academy/generate-certificate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ courseId: courseData._id }),
            }).then(r => r.json())
            if (certRes.certificate) setCertificate(certRes.certificate)
          } catch { /* certificate already exists or generation failed — continue */ }
          setGenerating(false)
        }
      } catch { /* network error — still clear loading so page renders */ }
      setLoading(false)
    }
    load()
  }, [params, moduleOrder, router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"
    style={{ background: '#FAF8F5', color: '#5F5E5A' }}>Loading...</div>

  const isLastModule = moduleOrder === course?.modules?.length
  const nextModule = course?.modules?.find(m => m.order === moduleOrder + 1)
  const infographicPath = INFOGRAPHIC_PATHS[moduleOrder]

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">

        {/* Badge */}
        {currentModule?.badgeImage?.asset?.url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentModule.badgeImage.asset.url} alt={currentModule.badgeName}
            className="w-24 h-24 mx-auto mb-4" />
        )}

        <div className="inline-block px-4 py-1.5 rounded-full mb-4 text-sm"
          style={{ background: '#E1F5EE', color: '#085041' }}>
          {currentModule?.badgeName} badge earned
        </div>

        <h1 className="text-3xl mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          {isLastModule ? 'Course complete' : 'Module complete'}
        </h1>
        <p className="mb-8" style={{ color: '#5F5E5A' }}>
          {isLastModule
            ? 'You have completed OKR Foundations. Your certificate is ready.'
            : `Well done. You have completed ${currentModule?.title}.`}
        </p>

        {/* Infographic download */}
        {infographicPath && (
          <button
            onClick={async () => {
              const { jsPDF } = await import('jspdf')
              const svgText = await fetch(infographicPath).then(r => r.text())
              const canvas = document.createElement('canvas')
              canvas.width = 1360
              canvas.height = 960
              const ctx = canvas.getContext('2d')
              if (!ctx) return
              const img = new Image()
              const svgBlob = new Blob([svgText], { type: 'image/svg+xml' })
              const url = URL.createObjectURL(svgBlob)
              await new Promise<void>((resolve) => {
                img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(url); resolve() }
                img.src = url
              })
              const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
              doc.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, 297, 210)
              doc.save(`OKR-Foundations-Module-${moduleOrder}-Reference-Card.pdf`)
            }}
            className="inline-flex items-center gap-2 px-6 py-3 rounded border mb-6 text-sm"
            style={{ borderColor: '#633806', color: '#633806', background: '#FFFFFF' }}>
            Download module reference card (PDF)
          </button>
        )}

        {/* Certificate */}
        {isLastModule && certificate && (
          <CertificateDisplay certificate={certificate} />
        )}
        {isLastModule && generating && (
          <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>Generating your certificate...</p>
        )}

        {/* Feedback form — shown after final module */}
        {isLastModule && !feedbackDone && course && (
          <div className="text-left">
            <FeedbackForm courseId={course._id} onDone={() => setFeedbackDone(true)} />
          </div>
        )}

        {/* Navigation */}
        {!isLastModule && nextModule && (
          <button onClick={() => router.push(`/academy/${params.courseSlug}/${nextModule.order}/1`)}
            className="px-8 py-3 rounded font-medium"
            style={{ background: '#633806', color: '#FAEEDA' }}>
            Start {nextModule.title}
          </button>
        )}
        {isLastModule && (
          <button onClick={() => router.push('/academy/dashboard')}
            className="px-8 py-3 rounded font-medium mt-6"
            style={{ background: '#633806', color: '#FAEEDA' }}>
            Go to my dashboard
          </button>
        )}
      </div>
    </main>
  )
}
