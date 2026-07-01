import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ContactForm from '@/components/ContactForm'
import FaqAccordion from '@/components/FaqAccordion'
import Link from 'next/link'
import { getFaqs } from '@/lib/sanity'

export const revalidate = 3600

export default async function ContactPage() {
  const faqs = await getFaqs(4)

  const faqJsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: (faq.answer as { _type: string; children?: { text: string }[] }[])
          .filter((b) => b._type === 'block')
          .map((b) => b.children?.map((c) => c.text).join('') ?? '')
          .join(' '),
      },
    })),
  } : null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <NavBar />
      <ContactForm />

      {/* ── FAQ section ──────────────────────────────────── */}
      {faqs.length > 0 && (
        <section className="py-16 lg:py-24 border-t" style={{ backgroundColor: '#FAF8F5', borderColor: '#E8E4DC' }}>
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <div className="max-w-3xl mx-auto">
              <p className="section-label mb-4">FAQ</p>
              <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-10">
                Common questions
              </h2>
              <FaqAccordion faqs={faqs} />
              <div className="mt-8 text-center">
                <Link
                  href="/faq"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#633806] hover:gap-2.5 transition-all"
                >
                  See all FAQs
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      <Footer />
    </div>
  )
}
