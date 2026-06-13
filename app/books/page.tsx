import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { SERIES_BOOKS, OTHER_BOOKS } from '@/lib/books-data'
import type { Book } from '@/lib/books-data'

function BookCover({ src, title }: { src: string; title: string }) {
  return (
    <div
      className="relative mx-auto w-full max-w-[280px] aspect-[2/3] rounded-xl overflow-hidden mb-6"
      style={{ backgroundColor: '#FAF8F5' }}
    >
      <Image
        src={src}
        alt={`${title} book cover`}
        fill
        sizes="280px"
        className="object-contain"
      />
    </div>
  )
}

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

const Divider = () => (
  <div className="w-full h-px" style={{ backgroundColor: '#E8E4DC' }} />
)

function SeriesBookCard({ book }: { book: Book }) {
  return (
    <div
      className="flex flex-col p-8 rounded-2xl bg-white border hover:shadow-xl transition-all duration-300"
      style={{ borderColor: '#2C2C2A14' }}
    >
      <BookCover src={book.coverImage} title={book.title} />
      <h3 className="font-lora text-xl font-semibold text-[#2C2C2A] mb-3">
        {book.title}
      </h3>
      <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1 mb-6">
        {book.description}
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <a
          href={book.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#633806] text-white text-sm font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
        >
          Buy on Amazon
          <ArrowIcon />
        </a>
        <a
          href={`/books/${book.slug}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#633806] text-[#633806] text-sm font-medium rounded-lg hover:bg-[#633806]/5 transition-colors"
        >
          Learn more
        </a>
      </div>
    </div>
  )
}

function OtherBookCard({ book }: { book: Book }) {
  return (
    <div
      className="flex flex-col p-8 rounded-2xl border hover:shadow-xl transition-all duration-300"
      style={{ backgroundColor: '#FAF8F5', borderColor: '#2C2C2A14' }}
    >
      <BookCover src={book.coverImage} title={book.title} />
      <h3 className="font-lora text-xl font-semibold text-[#2C2C2A] mb-3">
        {book.title}
      </h3>
      <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1 mb-6">
        {book.description}
      </p>
      <div className="flex flex-col gap-3">
        <a
          href={book.amazonUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#633806] text-white text-sm font-medium rounded-lg hover:bg-[#633806]/90 transition-colors"
        >
          Buy on Amazon
          <ArrowIcon />
        </a>
        <a
          href={`/books/${book.slug}`}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-[#633806] text-[#633806] text-sm font-medium rounded-lg hover:bg-[#633806]/5 transition-colors"
        >
          Learn more
        </a>
      </div>
    </div>
  )
}

export default function BooksPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Hero ── bg: #FAF8F5 ──────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20 text-center">
        <p className="section-label mb-6">PUBLISHED WORKS</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
          Books by Subramaniam P G
        </h1>
        <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Every book is a step toward deliberate growth.</p>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl mx-auto">
          Seven books on leadership, strategy, OKR, and personal growth — drawing on
          ancient philosophy and modern practice.
        </p>
      </section>

      <Divider />

      {/* ── Series ── bg: #FAF8F5 ────────────────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-4">
              Timeless Leadership Wisdom from Ancient Hindu Texts
            </h2>
            <p className="text-[#5F5E5A] max-w-2xl mx-auto leading-relaxed">
              A four-book series connecting ancient Indian philosophy with modern
              leadership practice.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-8">
            {SERIES_BOOKS.map((book) => (
              <SeriesBookCard key={book.slug} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Other Books ── bg: white ─────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              Other Books
            </h2>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {OTHER_BOOKS.map((book) => (
              <OtherBookCard key={book.slug} book={book} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── bg: #633806 deep ochre ────────────────── */}
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
