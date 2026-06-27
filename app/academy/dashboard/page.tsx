'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import FeedbackForm from '@/components/academy/FeedbackForm'
import CertificateDisplay from '@/components/academy/CertificateDisplay'

interface Certificate { certificateId: string; courseName: string; dateIssued: string }
interface Course { _id: string; title: string; slug?: { current: string } }
interface CertificateViewData {
  certificateId: string
  learnerName: string
  courseTitle: string
  descriptionLine: string
  dateIssued: string
  badgeImageUrl?: string
}
interface Learner {
  name: string
  pointsTotal: number
  enrolledCourses?: Course[]
  completionLog?: { lessonId: string }[]
  certificateRefs?: Certificate[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [learner, setLearner] = useState<Learner | null>(null)
  const [loading, setLoading] = useState(true)
  const [showFeedback, setShowFeedback] = useState<string | null>(null)
  const [viewingCert, setViewingCert] = useState<CertificateViewData | null>(null)

  useEffect(() => {
    fetch('/api/academy/me').then(r => r.json()).then(data => {
      if (!data.authenticated) { router.push('/academy/login'); return }
      setLearner(data.learner)
      setLoading(false)
    })
  }, [router])

  async function viewCertificate(cert: Certificate, courseName: string) {
    const courseRes = await fetch(`/api/academy/course-by-name?name=${encodeURIComponent(courseName)}`)
      .then(r => r.json())
    setViewingCert({
      certificateId: cert.certificateId,
      learnerName: learner!.name,
      courseTitle: cert.courseName,
      descriptionLine: courseRes.descriptionLine || 'A foundational programme in Objectives and Key Results methodology',
      dateIssued: cert.dateIssued,
      badgeImageUrl: courseRes.badgeImageUrl || undefined,
    })
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"
    style={{ background: '#FAF8F5', color: '#5F5E5A' }}>Loading your dashboard...</div>

  if (!learner) return null

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-4xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-xs tracking-widest mb-1" style={{ color: '#1D9E75' }}>MY DASHBOARD</p>
            <h1 className="text-3xl" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
              Welcome back, {learner.name.split(' ')[0]}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs mb-1" style={{ color: '#888780' }}>Total points</p>
            <p className="text-3xl font-bold" style={{ color: '#633806' }}>{learner.pointsTotal}</p>
          </div>
        </div>

        {/* Courses */}
        {learner.enrolledCourses?.map(course => {
          const cert = learner.certificateRefs?.find(c => c.courseName === course.title)
          return (
            <div key={course._id} className="rounded-lg p-6 mb-6 border"
              style={{ background: '#FFFFFF', borderColor: '#D3D1C7' }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
                  {course.title}
                </h2>
                {cert && (
                  <span className="text-xs px-3 py-1 rounded-full"
                    style={{ background: '#E1F5EE', color: '#085041' }}>
                    Certified
                  </span>
                )}
              </div>

              {cert ? (
                <div>
                  <p className="text-sm mb-1" style={{ color: '#5F5E5A' }}>
                    Certificate ID: <span style={{ color: '#633806' }}>{cert.certificateId}</span>
                  </p>
                  <p className="text-xs mb-4" style={{ color: '#888780' }}>
                    Issued: {new Date(cert.dateIssued).toLocaleDateString('en-IN')}
                  </p>
                  <div className="flex gap-3 flex-wrap">
                    <Link href={`/academy/${course.slug?.current}`}
                      className="text-sm px-4 py-2 rounded border"
                      style={{ borderColor: '#D3D1C7', color: '#5F5E5A' }}>
                      Revisit course
                    </Link>
                    <button
                      onClick={() => viewCertificate(cert, course.title)}
                      className="text-sm px-4 py-2 rounded"
                      style={{ background: '#633806', color: '#FAEEDA' }}>
                      View and download certificate
                    </button>
                    {showFeedback !== course._id && (
                      <button onClick={() => setShowFeedback(course._id)}
                        className="text-sm px-4 py-2 rounded"
                        style={{ background: '#1D9E75', color: '#fff' }}>
                        Rate this course
                      </button>
                    )}
                  </div>
                  {showFeedback === course._id && (
                    <FeedbackForm courseId={course._id} onDone={() => setShowFeedback(null)} />
                  )}
              ) : (
                <Link href={`/academy/${course.slug?.current}`}
                  className="inline-block text-sm px-6 py-2 rounded font-medium"
                  style={{ background: '#633806', color: '#FAEEDA' }}>
                  Continue learning
                </Link>
              )}
            </div>
          )
        })}

        {/* Certificate viewer */}
        {viewingCert && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
                Your certificate
              </h2>
              <button onClick={() => setViewingCert(null)}
                className="text-xs px-3 py-1 rounded border"
                style={{ borderColor: '#D3D1C7', color: '#888780' }}>
                Close
              </button>
            </div>
            <CertificateDisplay certificate={viewingCert} />
          </div>
        )}

        {/* Advanced course teaser */}
        <div className="rounded-lg p-6 border mt-8"
          style={{ background: '#FAEEDA', borderColor: '#633806' }}>
          <p className="text-xs tracking-widest mb-2" style={{ color: '#633806' }}>COMING SOON</p>
          <h3 className="text-xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
            OKR Mastery
          </h3>
          <p className="text-sm mb-4" style={{ color: '#854F0B' }}>
            The advanced course. Draft high-impact OKRs for your context, run the weekly
            check-in cycle, and submit your plan for a personal review call.
          </p>
          <Link href="/academy" className="text-sm font-medium" style={{ color: '#633806' }}>
            Learn more
          </Link>
        </div>

        {/* Logout */}
        <div className="mt-8 text-center">
          <a href="/api/academy/logout" className="text-xs" style={{ color: '#888780' }}>Log out</a>
        </div>
      </div>
    </main>
  )
}
