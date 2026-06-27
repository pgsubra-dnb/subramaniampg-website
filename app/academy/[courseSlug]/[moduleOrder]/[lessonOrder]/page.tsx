'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import InteractiveElement from '@/components/academy/InteractiveElement'

interface LessonData {
  _id: string
  title: string
  body: unknown[]
  pointsValue: number
  interactiveType?: string
  interactiveContent?: string
  moduleRef?: { title: string }
}

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const [lesson, setLesson] = useState<LessonData | null>(null)
  const [course, setCourse] = useState<{
    title: string
    modules?: { order: number; lessons?: { _id: string; order: number }[] }[]
  } | null>(null)
  const [, setLearner] = useState<{ completionLog?: { lessonId: string }[] } | null>(null)
  const [completed, setCompleted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [courseRes, meRes] = await Promise.all([
        fetch(`/api/academy/course/${params.courseSlug}`).then(r => r.json()),
        fetch('/api/academy/me').then(r => r.json()),
      ])
      const courseData = courseRes.course
      setCourse(courseData)
      if (meRes.authenticated) setLearner(meRes.learner)
      else { router.push(`/academy/${params.courseSlug}`); return }

      const mod = courseData?.modules?.find((m: { order: number }) => m.order === Number(params.moduleOrder))
      const lessonMeta = mod?.lessons?.find((l: { order: number }) => l.order === Number(params.lessonOrder))
      if (!lessonMeta) { router.push(`/academy/${params.courseSlug}`); return }

      const fullLesson = await fetch(`/api/academy/lesson/${lessonMeta._id}`).then(r => r.json())
      setLesson(fullLesson.lesson)

      const done = meRes.learner?.completionLog?.some((l: { lessonId: string }) => l.lessonId === lessonMeta._id)
      setCompleted(done || false)
      setLoading(false)
    }
    load()
  }, [params, router])

  async function markComplete() {
    if (completed || !lesson) return
    await fetch('/api/academy/lesson-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lessonId: lesson._id, points: lesson.pointsValue || 10 }),
    })
    setCompleted(true)
  }

  function navigateLesson(direction: 'prev' | 'next') {
    const mod = course?.modules?.find(m => m.order === Number(params.moduleOrder))
    const lessonOrder = Number(params.lessonOrder)
    const moduleOrder = Number(params.moduleOrder)
    const base = `/academy/${params.courseSlug}`

    if (direction === 'next') {
      const nextLesson = mod?.lessons?.find(l => l.order === lessonOrder + 1)
      if (nextLesson) { router.push(`${base}/${moduleOrder}/${lessonOrder + 1}`) }
      else { router.push(`${base}/${moduleOrder}/quiz`) }
    } else {
      if (lessonOrder > 1) { router.push(`${base}/${moduleOrder}/${lessonOrder - 1}`) }
      else if (moduleOrder > 1) {
        const prevMod = course?.modules?.find(m => m.order === moduleOrder - 1)
        const lastLesson = prevMod?.lessons?.slice(-1)[0]
        if (lastLesson) router.push(`${base}/${moduleOrder - 1}/${lastLesson.order}`)
      }
    }
  }

  const ptComponents = {
    block: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      normal: ({ children }: any) => (
        <p className="mb-4 leading-relaxed" style={{ color: '#5F5E5A', fontSize: '0.95rem' }}>{children}</p>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h3: ({ children }: any) => (
        <h3 className="text-lg font-medium mt-6 mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>{children}</h3>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      h2: ({ children }: any) => (
        <h2 className="text-xl font-medium mt-8 mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>{children}</h2>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      blockquote: ({ children }: any) => (
        <blockquote className="border-l-4 pl-4 my-4 italic" style={{ borderColor: '#1D9E75', color: '#5F5E5A' }}>{children}</blockquote>
      ),
    },
    marks: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      strong: ({ children }: any) => (
        <strong style={{ color: '#2C2C2A', fontWeight: 600 }}>{children}</strong>
      ),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      em: ({ children }: any) => (
        <em style={{ color: '#5F5E5A' }}>{children}</em>
      ),
    },
    list: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bullet: ({ children }: any) => (
        <ul className="mb-4 space-y-1 pl-5" style={{ color: '#5F5E5A' }}>{children}</ul>
      ),
    },
    listItem: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bullet: ({ children }: any) => (
        <li className="text-sm leading-relaxed" style={{ listStyleType: 'disc' }}>{children}</li>
      ),
    },
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center"
    style={{ background: '#FAF8F5', color: '#5F5E5A' }}>Loading lesson...</div>

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* Breadcrumb */}
        <p className="text-xs mb-6" style={{ color: '#888780' }}>
          <a href={`/academy/${params.courseSlug}`} style={{ color: '#633806' }}>{course?.title}</a>
          {' › '}{lesson?.moduleRef?.title}{' › '}{lesson?.title}
        </p>

        {/* Lesson header */}
        <div className="mb-6 pb-6 border-b" style={{ borderColor: '#D3D1C7' }}>
          <h1 className="text-2xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
            {lesson?.title}
          </h1>
          <div className="flex gap-4 text-xs" style={{ color: '#888780' }}>
            <span>{lesson?.pointsValue || 10} points</span>
            {completed && <span style={{ color: '#1D9E75' }}>Completed</span>}
          </div>
        </div>

        {/* Lesson body */}
        <div className="prose prose-sm max-w-none mb-8" style={{ color: '#5F5E5A' }}>
          {lesson?.body && <PortableText value={lesson.body as Parameters<typeof PortableText>[0]['value']} components={ptComponents} />}
        </div>

        {/* Interactive element */}
        {lesson?.interactiveType && lesson?.interactiveContent && (
          <InteractiveElement
            type={lesson.interactiveType}
            content={lesson.interactiveContent}
            onComplete={markComplete}
          />
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t"
          style={{ borderColor: '#D3D1C7' }}>
          <button onClick={() => navigateLesson('prev')}
            className="px-4 py-2 rounded text-sm border"
            style={{ borderColor: '#D3D1C7', color: '#5F5E5A' }}>
            Previous
          </button>
          {completed && (
            <span className="text-xs px-3 py-1 rounded-full"
              style={{ background: '#FAEEDA', color: '#633806' }}>
              +{lesson?.pointsValue || 10} points earned
            </span>
          )}
          <button onClick={() => { markComplete(); navigateLesson('next') }}
            className="px-6 py-2 rounded text-sm font-medium"
            style={{ background: '#633806', color: '#FAEEDA' }}>
            Next lesson
          </button>
        </div>
      </div>
    </main>
  )
}
