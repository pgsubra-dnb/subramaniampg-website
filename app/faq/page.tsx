import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import FaqAccordion from '@/components/FaqAccordion'
import { getFaqs } from '@/lib/sanity'
import Link from 'next/link'

export const revalidate = 3600

export const metadata = {
  title: 'Frequently Asked Questions',
  description:
    'Answers to common questions about working with Subramaniam P G — OKR consulting, executive coaching, engagement models, pricing, and how to get started.',
  alternates: { canonical: 'https://www.subramaniampg.guru/faq' },
  openGraph: {
    title: 'FAQ | Subramaniam P G',
    description: 'Common questions about OKR consulting, executive coaching, and working with Subramaniam P G.',
    url: 'https://www.subramaniampg.guru/faq',
  },
}

export default async function FaqPage() {
  const faqs = await getFaqs()

  const faqJsonLd = {
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
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <NavBar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-12 lg:pt-20 lg:pb-16">
        <div className="max-w-3xl">
          <p className="section-label mb-4">HELP & GUIDANCE</p>
          <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.2rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-4">
            Frequently asked questions
          </h1>
          <p className="text-lg text-[#5F5E5A] leading-relaxed">
            Everything you need to know about working with Subramaniam P G — from how to start to what to expect.
          </p>
        </div>
      </section>

      {/* FAQ accordion */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-20 lg:pb-28">
        <div className="max-w-3xl">
          {faqs.length > 0 ? (
            <FaqAccordion faqs={faqs} />
          ) : (
            <p className="text-[#5F5E5A] text-sm">No FAQs available yet. Check back soon.</p>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-14 lg:py-20 border-t" style={{ borderColor: '#E8E4DC' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl font-bold text-[#2C2C2A] mb-4">
              Still have questions?
            </h2>
            <p className="text-[#5F5E5A] leading-relaxed mb-8">
              Book a 30-minute discovery call or send a message and I will get back to you within one business day.
            </p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 bg-[#633806] text-white font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
