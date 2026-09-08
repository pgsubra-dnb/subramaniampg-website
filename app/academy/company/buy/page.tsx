import { getAllCourses } from '@/lib/academyQueries'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import BuyClient from './BuyClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Buy Academy seats for your team | Subramaniam P G',
  description:
    'Buy course seats in bulk for your organisation against your GSTIN, then assign them to your team by email. One GST invoice, addressed to the company.',
  robots: { index: false, follow: false },
}

interface Course {
  _id: string
  title: string
  slug: { current: string }
  price: number
  status: string
  shortDescription?: string
}

export default async function CompanyBuyPage() {
  const courses = (await getAllCourses()) as Course[]
  const paidCourses = courses
    .filter((c) => c.status === 'published' && c.price > 0)
    .map((c) => ({
      id: c._id,
      slug: c.slug.current,
      title: c.title,
      price: c.price,
      shortDescription: c.shortDescription ?? '',
    }))

  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      <NavBar />
      <main className="mx-auto max-w-2xl px-4 py-12">
        <BuyClient courses={paidCourses} />
      </main>
      <Footer />
    </div>
  )
}
