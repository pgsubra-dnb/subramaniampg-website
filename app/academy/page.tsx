import { getAllCourses } from '@/lib/academyQueries'
import Link from 'next/link'
import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export const revalidate = 60

export default async function AcademyPage() {
  const courses = await getAllCourses()

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      <NavBar />

      {/* Header */}
      <section className="px-6 py-16 max-w-5xl mx-auto text-center">
        <p className="text-sm tracking-widest mb-3" style={{ color: '#1D9E75' }}>ACADEMY</p>
        <h1 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          Learn OKRs the right way
        </h1>
        <p className="text-lg max-w-2xl mx-auto" style={{ color: '#5F5E5A' }}>
          Practical courses built from 40 years of experience helping leaders
          align purpose with execution.
        </p>
      </section>

      {/* Course grid */}
      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {courses.map((course: {
            _id: string
            title: string
            slug: { current: string }
            shortDescription: string
            price: number
            status: string
            coverImage?: { asset?: { url: string } }
            moduleCount: number
            avgRating?: number
            ratingCount?: number
          }) => (
            <div key={course._id} className="rounded-lg overflow-hidden border"
              style={{ borderColor: '#D3D1C7', background: '#FFFFFF' }}>

              {course.coverImage?.asset?.url && (
                <div className="relative h-48" style={{ background: '#1a2744' }}>
                  <Image src={course.coverImage.asset.url} alt={course.title}
                    fill className="object-contain" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs tracking-widest font-medium px-3 py-1 rounded-full"
                    style={{
                      background: course.price === 0 ? '#E1F5EE' : '#FAEEDA',
                      color: course.price === 0 ? '#085041' : '#633806'
                    }}>
                    {course.price === 0 ? 'FREE' : `₹${course.price}`}
                  </span>
                  {course.status === 'coming-soon' && (
                    <span className="text-xs tracking-widest px-3 py-1 rounded-full"
                      style={{ background: '#F1EFE8', color: '#888780' }}>
                      COMING SOON
                    </span>
                  )}
                </div>

                <h2 className="text-xl mb-2" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
                  {course.title}
                </h2>
                <p className="text-sm mb-4" style={{ color: '#5F5E5A' }}>
                  {course.shortDescription}
                </p>
                <div className="flex items-center gap-3 mb-5">
                  <p className="text-xs" style={{ color: '#888780' }}>
                    {course.moduleCount} modules
                  </p>
                  {course.avgRating && course.ratingCount ? (
                    <div className="flex items-center gap-1">
                      <span className="text-sm" style={{ color: '#F59E0B' }}>
                        {'★'.repeat(Math.round(course.avgRating))}{'☆'.repeat(5 - Math.round(course.avgRating))}
                      </span>
                      <span className="text-xs" style={{ color: '#888780' }}>
                        {course.avgRating.toFixed(1)} ({course.ratingCount})
                      </span>
                    </div>
                  ) : null}
                </div>

                {course.status === 'published' ? (
                  <Link href={`/academy/${course.slug.current}`}
                    className="inline-block px-6 py-3 rounded text-sm font-medium"
                    style={{ background: '#633806', color: '#FAEEDA' }}>
                    {course.price === 0 ? 'Start free course' : 'Enrol now'}
                  </Link>
                ) : (
                  <button disabled
                    className="px-6 py-3 rounded text-sm font-medium opacity-40 cursor-not-allowed"
                    style={{ background: '#633806', color: '#FAEEDA' }}>
                    Coming soon
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  )
}
