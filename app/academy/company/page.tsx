import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import CompanyClient from './CompanyClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Your company’s Academy seats | Subramaniam P G',
  description: 'Assign course seats to your team, track progress, and reclaim unused seats.',
  robots: { index: false, follow: false },
}

export default function CompanyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      <NavBar />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <CompanyClient />
      </main>
      <Footer />
    </div>
  )
}
