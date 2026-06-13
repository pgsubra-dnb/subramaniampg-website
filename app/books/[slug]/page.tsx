import { notFound } from 'next/navigation'
import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { BOOKS, getBookBySlug } from '@/lib/books-data'

export function generateStaticParams() {
  return BOOKS.map((book) => ({ slug: book.slug }))
}

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

export default function BookDetailPage({ params }: { params: { slug: string } }) {
  const book = getBookBySlug(params.slug)
  if (!book) notFound()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Breadcrumb ───────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8">
        <nav className="flex items-center gap-2 text-sm text-[#5F5E5A]">
          <a href="/" className="hover:text-[#633806] transition-colors">Home</a>
          <span className="text-[#2C2C2A]/30">/</span>
          <a href="/books" className="hover:text-[#633806] transition-colors">Books</a>
          <span className="text-[#2C2C2A]/30">/</span>
          <span className="text-[#2C2C2A] font-medium truncate max-w-[200px]">{book.title}</span>
        </nav>
      </div>

      {/* ── Hero / Detail ────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-10 pb-16 lg:pt-14 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-start">

          {/* Left — cover */}
          <div className="flex justify-center lg:justify-start">
            <div
              className="relative w-full max-w-[320px] aspect-[2/3] rounded-2xl overflow-hidden"
              style={{ backgroundColor: '#FAF8F5' }}
            >
              <Image
                src={book.coverImage}
                alt={`${book.title} book cover`}
                fill
                sizes="320px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Right — content */}
          <div className="flex flex-col">
            <h1 className="font-lora text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-[#2C2C2A] leading-[1.15] tracking-tight mb-3">
              {book.title}
            </h1>

            <p className="text-base font-medium text-[#633806] leading-relaxed mb-6">
              {book.subtitle}
            </p>

            <p className="text-[#5F5E5A] leading-relaxed mb-8">
              {book.seoDescription}
            </p>

            {/* Key themes */}
            <div className="mb-10">
              <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#5F5E5A]/60 mb-3">
                Key Themes
              </p>
              <div className="flex flex-wrap gap-2">
                {book.themes.map((theme) => (
                  <span
                    key={theme}
                    className="text-sm font-medium px-4 py-1.5 rounded-full text-[#633806]"
                    style={{ backgroundColor: '#FAEEDA' }}
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex flex-wrap gap-4">
              <a
                href={book.amazonUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#633806] text-white font-medium rounded-lg hover:bg-[#633806]/90 transition-colors text-sm"
              >
                Buy on Amazon
                <ArrowIcon />
              </a>
              <a
                href="/books"
                className="inline-flex items-center gap-2 px-8 py-4 border border-[#2C2C2A]/20 text-[#5F5E5A] font-medium rounded-lg hover:border-[#633806] hover:text-[#633806] transition-colors text-sm"
              >
                ← All Books
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── More Books ───────────────────────────────────── */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-lora text-2xl lg:text-3xl font-bold text-[#2C2C2A]">
              More Books
            </h2>
            <a
              href="/books"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[#633806] hover:gap-2.5 transition-all"
            >
              View all
              <ArrowIcon />
            </a>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BOOKS.filter((b) => b.slug !== book.slug).slice(0, 3).map((related) => (
              <a
                key={related.slug}
                href={`/books/${related.slug}`}
                className="group flex gap-5 p-5 rounded-2xl border bg-white hover:shadow-lg transition-all duration-300"
                style={{ borderColor: '#2C2C2A14' }}
              >
                <div
                  className="relative w-[64px] aspect-[2/3] rounded-xl overflow-hidden shrink-0"
                  style={{ backgroundColor: '#FAF8F5' }}
                >
                  <Image
                    src={related.coverImage}
                    alt={`${related.title} book cover`}
                    fill
                    sizes="64px"
                    className="object-contain"
                  />
                </div>
                <div className="flex flex-col justify-center min-w-0">
                  <h3 className="font-lora text-base font-semibold text-[#2C2C2A] leading-snug group-hover:text-[#633806] transition-colors">
                    {related.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── bg: #633806 ───────────────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#633806' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-8">
              Connect with Subramaniam P G
            </h2>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Let&apos;s Connect
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
