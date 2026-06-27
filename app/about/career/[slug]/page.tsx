import { notFound } from 'next/navigation'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { client } from '@/lib/sanity'

type CareerEntry = {
  _id: string
  slug: string
  role: string
  organisation: string
  city: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  description: string
  order: number
}

function formatPeriod(entry: CareerEntry): string {
  return `${entry.startDate} – ${entry.isCurrent ? 'Present' : (entry.endDate ?? '')}`
}

async function getAllEntries(): Promise<CareerEntry[]> {
  return client.fetch(
    `*[_type == "careerEntry"] | order(order asc) {
      _id,
      "slug": slug.current,
      role,
      organisation,
      city,
      startDate,
      endDate,
      isCurrent,
      description,
      order
    }`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export async function generateStaticParams() {
  const entries = await getAllEntries()
  return entries.map((e) => ({ slug: e.slug }))
}

export default async function CareerDetailPage({ params }: { params: { slug: string } }) {
  const entries = await getAllEntries()
  const currentIdx = entries.findIndex((e) => e.slug === params.slug)

  if (currentIdx === -1) notFound()

  const entry = entries[currentIdx]
  const prev = entries[currentIdx + 1] ?? null
  const next = entries[currentIdx - 1] ?? null

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* Header */}
      <section style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-0">
          <Link
            href="/about"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#5F5E5A' }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
              <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
            </svg>
            Back to About
          </Link>
        </div>

        <div className="max-w-3xl mx-auto px-6 lg:px-10 pt-10 pb-14 lg:pb-16">
          <p className="text-xs font-semibold tracking-widest uppercase text-[#1D9E75] mb-3">
            {formatPeriod(entry)}
          </p>
          <h1 className="font-lora text-3xl sm:text-4xl lg:text-[2.6rem] font-bold text-[#2C2C2A] leading-[1.15] tracking-tight mb-3">
            {entry.role}
          </h1>
          <p className="text-lg font-medium" style={{ color: '#633806' }}>{entry.organisation}</p>
          {entry.city && (
            <p className="text-sm mt-1" style={{ color: '#888780' }}>{entry.city}</p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-3xl mx-auto px-6 lg:px-10">
          <p className="text-[#2C2C2A] text-lg leading-[1.85] whitespace-pre-line">
            {entry.description}
          </p>
        </div>
      </section>

      {/* Prev / Next navigation */}
      <section
        className="py-10 lg:py-14 border-t"
        style={{ backgroundColor: '#FAF8F5', borderColor: '#E8E4DC' }}
      >
        <div className="max-w-3xl mx-auto px-6 lg:px-10 flex items-center justify-between gap-6">
          {prev ? (
            <Link
              href={`/about/career/${prev.slug}`}
              className="flex flex-col gap-0.5 group max-w-[45%]"
            >
              <span className="text-xs font-semibold tracking-wider uppercase text-[#888780] group-hover:text-[#633806] transition-colors">
                ← Earlier
              </span>
              <span className="font-lora text-base font-semibold text-[#2C2C2A] group-hover:text-[#633806] transition-colors line-clamp-2">
                {prev.role}
              </span>
              <span className="text-xs text-[#888780]">{prev.organisation}</span>
            </Link>
          ) : (
            <div />
          )}

          {next ? (
            <Link
              href={`/about/career/${next.slug}`}
              className="flex flex-col gap-0.5 group max-w-[45%] text-right"
            >
              <span className="text-xs font-semibold tracking-wider uppercase text-[#888780] group-hover:text-[#633806] transition-colors">
                More recent →
              </span>
              <span className="font-lora text-base font-semibold text-[#2C2C2A] group-hover:text-[#633806] transition-colors line-clamp-2">
                {next.role}
              </span>
              <span className="text-xs text-[#888780]">{next.organisation}</span>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </section>

      <Footer />
    </div>
  )
}
