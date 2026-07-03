'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import EnrolmentModal from '@/components/academy/EnrolmentModal'

interface Lesson { _id: string; title: string; order: number }
interface Module { _id: string; title: string; order: number; lessons?: Lesson[] }
interface Course {
  _id: string; title: string; slug: { current: string }; shortDescription: string
  tagline?: string; price: number; status: string; hasAssignments?: boolean
  coverImage?: { asset?: { url: string } }
  modules?: Module[]
}
interface Learner {
  _id: string; name: string
  enrolledCourses?: { _id: string; title: string; slug?: { current: string } }[]
  completionLog?: { lessonId: string }[]
  submittedAssignments?: { moduleId: string }[]
}

export default function CoursePage() {
  const params = useParams()
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [learner, setLearner] = useState<Learner | null>(null)
  const [showEnrol, setShowEnrol] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [courseRes, meRes] = await Promise.all([
        fetch(`/api/academy/course/${params.courseSlug}`).then(r => r.json()),
        fetch('/api/academy/me').then(r => r.json()),
      ])
      setCourse(courseRes.course)
      if (meRes.authenticated) setLearner(meRes.learner)
      setLoading(false)
    }
    load()
  }, [params.courseSlug])

  if (loading) return <div className="min-h-screen flex items-center justify-center"
    style={{ background: '#FAF8F5', color: '#5F5E5A' }}>Loading...</div>

  if (!course) return <div className="min-h-screen flex items-center justify-center"
    style={{ background: '#FAF8F5', color: '#5F5E5A' }}>Course not found.</div>

  const isPreview = process.env.NEXT_PUBLIC_IS_PREVIEW === 'true'
  if (course.status !== 'published' && !isPreview) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-6"
        style={{ background: '#FAF8F5', color: '#5F5E5A' }}>
        <h1 className="text-2xl mb-3" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          {course.title}
        </h1>
        <p className="mb-1">Coming Soon</p>
        <p className="text-sm">This course isn&apos;t available yet.</p>
      </div>
    )
  }

  const completedLessons = learner?.completionLog?.map(l => l.lessonId) || []
  const totalLessons = course.modules?.reduce((sum, m) => sum + (m.lessons?.length || 0), 0) || 0
  const progressPct = totalLessons > 0 ? Math.round((completedLessons.length / totalLessons) * 100) : 0

  function isModuleUnlocked(moduleIndex: number) {
    if (moduleIndex === 0) return true
    if (!learner) return false
    const prevModule = course!.modules![moduleIndex - 1]
    const lessonsComplete = prevModule.lessons?.every(l => completedLessons.includes(l._id)) ?? false
    if (!lessonsComplete) return false
    if (!course!.hasAssignments) return true
    return learner.submittedAssignments?.some(a => a.moduleId === prevModule._id) ?? false
  }

  const isEnrolled = learner?.enrolledCourses?.some(c => c._id === course._id)

  function getNextLessonUrl(): string | null {
    const modules = [...(course!.modules || [])].sort((a, b) => a.order - b.order)
    for (const mod of modules) {
      const lessons = [...(mod.lessons || [])].sort((a, b) => a.order - b.order)
      for (const lesson of lessons) {
        if (!completedLessons.includes(lesson._id)) {
          return `/academy/${params.courseSlug}/${mod.order}/${lesson.order}`
        }
      }
    }
    return null
  }

  function handleContinueClick() {
    if (isEnrolled) {
      const url = getNextLessonUrl()
      router.push(url || '/academy/dashboard')
      return
    }
    setShowEnrol(true)
  }

  return (
    <main style={{ background: '#FAF8F5', minHeight: '100vh' }}>
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row">

        {/* Sidebar */}
        <aside className="w-full md:w-64 shrink-0 border-r py-6"
          style={{ borderColor: '#D3D1C7', background: '#FFFFFF' }}>

          <div className="px-5 pb-4 border-b mb-4" style={{ borderColor: '#D3D1C7' }}>
            <p className="font-medium text-sm mb-1" style={{ color: '#2C2C2A' }}>{course.title}</p>
            {course.price === 0 ? (
              <p className="text-xs mb-2" style={{ color: '#888780' }}>Free course</p>
            ) : (
              <div className="mb-2">
                <p className="text-base font-bold" style={{ color: '#633806' }}>₹{course.price}</p>
                <p className="text-xs" style={{ color: '#888780' }}>Exclusive of 18% GST</p>
              </div>
            )}
            {learner && (
              <>
                <div className="h-1 rounded-full mb-1" style={{ background: '#F1EFE8' }}>
                  <div className="h-1 rounded-full" style={{ background: '#1D9E75', width: `${progressPct}%` }} />
                </div>
                <p className="text-xs" style={{ color: '#888780' }}>{completedLessons.length} of {totalLessons} lessons</p>
              </>
            )}
          </div>

          {course.modules?.map((mod, mIdx) => {
            const unlocked = isModuleUnlocked(mIdx)
            return (
              <div key={mod._id} className="mb-4">
                <div className="px-5 py-2 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: unlocked ? '#1D9E75' : '#D3D1C7', color: '#fff' }}>
                    {mIdx + 1}
                  </span>
                  <span className="text-xs font-medium" style={{ color: unlocked ? '#2C2C2A' : '#B4B2A9' }}>
                    {mod.title}
                  </span>
                </div>
                {mod.lessons?.map(lesson => {
                  const done = completedLessons.includes(lesson._id)
                  return (
                    <div key={lesson._id}
                      className="flex items-center gap-2 px-5 py-1.5 pl-10 text-xs border-l-2"
                      style={{
                        borderLeftColor: done ? '#1D9E75' : 'transparent',
                        color: done ? '#1D9E75' : unlocked ? '#5F5E5A' : '#B4B2A9'
                      }}>
                      <span className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: done ? '#1D9E75' : unlocked ? '#D3D1C7' : '#E8E6E0' }} />
                      {lesson.title}
                    </div>
                  )
                })}
                {unlocked && (
                  <div className="px-5 py-1.5 pl-10 text-xs" style={{ color: '#B4B2A9' }}>
                    Mini quiz
                  </div>
                )}
                {unlocked && course.hasAssignments && (
                  <div className="px-5 py-1.5 pl-10 text-xs" style={{ color: '#B4B2A9' }}>
                    Assignment
                  </div>
                )}
              </div>
            )
          })}
        </aside>

        {/* Main content */}
        <div className="flex-1 p-8">
          {course.coverImage?.asset?.url && (
            <div className="relative h-56 rounded-lg overflow-hidden mb-6"
              style={{ background: '#1a2744' }}>
              <Image src={course.coverImage.asset.url} alt={course.title} fill className="object-contain" />
            </div>
          )}
          <h1 className="text-3xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
            {course.title}
          </h1>
          {course.tagline && (
            <p className="text-sm mb-4 italic" style={{ color: '#633806' }}>{course.tagline}</p>
          )}
          <p className="mb-6" style={{ color: '#5F5E5A' }}>{course.shortDescription}</p>

          <button onClick={handleContinueClick}
            className="px-8 py-3 rounded font-medium"
            style={{ background: '#633806', color: '#FAEEDA' }}>
            {isEnrolled
              ? (completedLessons.length > 0 ? 'Continue Learning' : 'Start Learning')
              : (course.price === 0 ? 'Start free course' : `Enrol — ₹${course.price}`)}
          </button>
        </div>
      </div>

      {showEnrol && (
        <EnrolmentModal
          courseId={course._id}
          courseSlug={params.courseSlug as string}
          courseTitle={course.title}
          price={course.price}
          isEnrolled={!!isEnrolled}
          onClose={() => setShowEnrol(false)}
          onSuccess={() => { setShowEnrol(false); router.refresh() }}
        />
      )}
    </main>
  )
}
