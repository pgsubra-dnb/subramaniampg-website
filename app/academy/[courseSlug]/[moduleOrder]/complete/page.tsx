'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import CertificateDisplay from '@/components/academy/CertificateDisplay'
import FeedbackForm from '@/components/academy/FeedbackForm'

interface CertData {
  certificateId: string
  learnerName: string
  courseTitle: string
  descriptionLine: string
  dateIssued: string
  badgeImageUrl?: string
}

interface PaidConsultation {
  enabled: boolean
  title: string
  description: string
  price: number
  durationMinutes: number
  bookingLink?: { url: string }
}

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Razorpay: any
  }
}

export default function ModuleCompletePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<{
    _id: string; title: string; slug?: { current: string }
    modules?: {
      _id: string; order: number; title: string; badgeName?: string
      badgeImage?: { asset?: { url: string } }
      infographicAsset?: { asset?: { url: string; originalFilename?: string } }
    }[]
    paidConsultation?: PaidConsultation
  } | null>(null)
  const [learnerEmail, setLearnerEmail] = useState('')
  const [currentModule, setCurrentModule] = useState<{
    _id: string; order: number; title: string; badgeName?: string
    badgeImage?: { asset?: { url: string } }
    infographicAsset?: { asset?: { url: string; originalFilename?: string } }
  } | null>(null)
  const [certificate, setCertificate] = useState<CertData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [feedbackDone, setFeedbackDone] = useState(false)
  const [consultPaying, setConsultPaying] = useState(false)
  const [consultBooked, setConsultBooked] = useState(false)
  const [consultBookingUrl, setConsultBookingUrl] = useState('')
  const moduleOrder = Number(params.moduleOrder)

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch('/api/academy/me').then(r => r.json())
        if (!meRes.authenticated) { router.push(`/academy/${params.courseSlug}`); return }
        setLearnerEmail(meRes.learner.email)

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
          } catch { /* certificate already exists or generation failed */ }
          setGenerating(false)
        }
      } catch { /* network error */ }
      setLoading(false)
    }
    load()
  }, [params, moduleOrder, router])

  async function handleConsultPay() {
    if (!course || !learnerEmail) return
    setConsultPaying(true)
    try {
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderType: 'consultation',
          courseSlug: params.courseSlug,
          email: learnerEmail,
        }),
      }).then(r => r.json())

      if (!orderRes.orderId) {
        alert('Could not create order. Please try again.')
        setConsultPaying(false)
        return
      }

      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      document.body.appendChild(script)
      await new Promise(resolve => { script.onload = resolve })

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        order_id: orderRes.orderId,
        amount: orderRes.amount,
        currency: orderRes.currency,
        name: 'Embiggen Consulting LLP',
        description: `Expert Guidance Call — ${course.title}`,
        prefill: { email: learnerEmail },
        theme: { color: '#633806' },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch('/api/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderType: 'consultation',
              courseSlug: params.courseSlug,
              email: learnerEmail,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            }),
          }).then(r => r.json())

          if (verifyRes.success) {
            setConsultBookingUrl(verifyRes.bookingUrl || course.paidConsultation?.bookingLink?.url || '')
            setConsultBooked(true)
          } else {
            alert('Payment verification failed. Please contact pgs@embiggen.co.in.')
          }
          setConsultPaying(false)
        },
        modal: { ondismiss: () => setConsultPaying(false) },
      })
      rzp.open()
    } catch {
      alert('Something went wrong. Please try again.')
      setConsultPaying(false)
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"
    style={{ background: '#FAF8F5', color: '#5F5E5A' }}>Loading...</div>

  const isLastModule = moduleOrder === course?.modules?.length
  const nextModule = course?.modules?.find(m => m.order === moduleOrder + 1)
  const consultation = course?.paidConsultation

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto px-6 py-12 text-center">

        {/* Module badge */}
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
            ? `You have completed ${course?.title}. Your certificate is ready.`
            : `Well done. You have completed ${currentModule?.title}.`}
        </p>

        {/* Module infographic download */}
        {currentModule?.infographicAsset?.asset?.url && (
          <div className="mb-8">
            <a href={currentModule.infographicAsset.asset.url}
              download={currentModule.infographicAsset.asset.originalFilename || true}
              className="inline-block px-6 py-2.5 rounded font-medium text-sm"
              style={{ background: '#633806', color: '#FAEEDA' }}>
              Download module infographic
            </a>
          </div>
        )}

        {/* Certificate */}
        {isLastModule && certificate && (
          <CertificateDisplay certificate={certificate} />
        )}
        {isLastModule && generating && (
          <p className="text-sm mb-6" style={{ color: '#5F5E5A' }}>Generating your certificate...</p>
        )}

        {/* Paid consultation offer — only on final module */}
        {isLastModule && consultation?.enabled && !consultBooked && (
          <div className="mt-8 mb-8 p-6 rounded-xl border text-left"
            style={{ borderColor: '#EFD1B0', background: '#FDF5EC' }}>
            <p className="text-xs tracking-widest mb-2 font-medium" style={{ color: '#633806' }}>
              OPTIONAL ADD-ON
            </p>
            <h2 className="text-xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
              {consultation.title}
            </h2>
            <p className="text-sm mb-4" style={{ color: '#5F5E5A' }}>{consultation.description}</p>
            <div className="flex justify-between text-sm mb-1" style={{ color: '#5F5E5A' }}>
              <span>Expert Guidance Call ({consultation.durationMinutes} minutes)</span>
              <span>₹{consultation.price.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm mb-3" style={{ color: '#5F5E5A' }}>
              <span>GST (18%)</span>
              <span>₹{Math.round(consultation.price * 0.18).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-sm font-medium border-t pt-3 mb-5"
              style={{ borderColor: '#EFD1B0', color: '#2C2C2A' }}>
              <span>Total</span>
              <span>₹{(consultation.price + Math.round(consultation.price * 0.18)).toLocaleString('en-IN')}</span>
            </div>
            <button
              onClick={handleConsultPay}
              disabled={consultPaying}
              className="w-full py-3 rounded font-medium text-sm"
              style={{ background: '#633806', color: '#FAEEDA', opacity: consultPaying ? 0.6 : 1 }}>
              {consultPaying ? 'Opening payment...' : 'Book This Call'}
            </button>
          </div>
        )}

        {/* Consultation booked confirmation */}
        {isLastModule && consultBooked && (
          <div className="mt-8 mb-8 p-6 rounded-xl border text-left"
            style={{ borderColor: '#A3D9C0', background: '#E1F5EE' }}>
            <h2 className="text-lg mb-2" style={{ fontFamily: 'Lora, serif', color: '#085041' }}>
              Call booked — confirmation sent
            </h2>
            <p className="text-sm mb-4" style={{ color: '#085041' }}>
              A confirmation email with the booking link has been sent to {learnerEmail}. Use the button below to select your slot.
            </p>
            {consultBookingUrl && (
              <a href={consultBookingUrl} target="_blank" rel="noopener noreferrer"
                className="inline-block px-6 py-2.5 rounded font-medium text-sm"
                style={{ background: '#085041', color: '#FFFFFF' }}>
                Select your time slot →
              </a>
            )}
          </div>
        )}

        {/* Feedback form */}
        {isLastModule && !feedbackDone && course && (
          <div className="text-left">
            <FeedbackForm
              courseId={course._id}
              courseSlug={params.courseSlug as string}
              showAdvancedInterest={params.courseSlug === 'okr-foundations'}
              onDone={() => setFeedbackDone(true)}
            />
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
