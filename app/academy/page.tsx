import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'

export const metadata = {
  title: 'Academy — now NextKadam | Subramaniam P G',
  description:
    'OKR Foundations, RACI Decoded, and the other courses built from 40 years of experience now live on NextKadam.',
  alternates: { canonical: 'https://www.subramaniampg.guru/academy' },
  openGraph: {
    title: 'Academy — now NextKadam | Subramaniam P G',
    description: 'The courses have a new home: NextKadam.',
    url: 'https://www.subramaniampg.guru/academy',
  },
}

const NEXTKADAM_URL = 'https://nextkadam.com'

export default function AcademyPage() {
  return (
    <div className="min-h-screen" style={{ background: '#FAF8F5' }}>
      <NavBar />

      <section className="px-6 py-24 max-w-2xl mx-auto text-center">
        <p className="text-sm tracking-widest mb-3" style={{ color: '#1D9E75' }}>ACADEMY</p>
        <h1 className="text-4xl md:text-5xl mb-6" style={{ fontFamily: 'Lora, serif', color: '#2C2C2A' }}>
          The Academy has a new home.
        </h1>
        <p className="text-lg mb-10" style={{ color: '#5F5E5A' }}>
          OKR Foundations, RACI Decoded, and the courses that come after them now live on{' '}
          <strong>NextKadam</strong> — built from the same forty years of consulting work, with new
          courses added over time.
        </p>
        <a
          href={NEXTKADAM_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-8 py-4 rounded text-sm font-medium"
          style={{ background: '#633806', color: '#FAEEDA' }}
        >
          Continue to NextKadam →
        </a>
      </section>

      <Footer />
    </div>
  )
}
