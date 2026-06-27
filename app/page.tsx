import Link from 'next/link'
import Image from 'next/image'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import WhatLeadersSay from '@/components/WhatLeadersSay'
import { getLatestPosts, getTestimonials, formatPostDate, client } from '@/lib/sanity'
import { getPlaylistVideos } from '@/lib/getPlaylistVideos'
import { BOOKS } from '@/lib/books-data'

export const revalidate = 3600

const SERVICES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="8" />
        <line x1="12" y1="16" x2="12" y2="22" />
        <line x1="2" y1="12" x2="8" y2="12" />
        <line x1="16" y1="12" x2="22" y2="12" />
      </svg>
    ),
    title: 'OKR Consulting',
    description:
      'Implement the Objectives & Key Results framework to align your organisation around measurable goals that drive real outcomes — from leadership to frontline teams.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    title: 'Executive Coaching',
    description:
      'One-on-one coaching for founders and CXOs navigating growth, transition, and leadership complexity. A trusted thinking partner for the hardest decisions.',
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-7 h-7">
        <polygon points="12 2 2 7 12 12 22 7 12 2" />
        <polyline points="2 17 12 22 22 17" />
        <polyline points="2 12 12 17 22 12" />
      </svg>
    ),
    title: 'Strategy Consulting',
    description:
      'Facilitate strategic clarity through proven frameworks that connect your long-term vision to daily execution — building alignment across the leadership team.',
  },
]

const CREDENTIALS = [
  'Certified OKR Coach',
  'Executive Coach',
  'Author · 7 Books',
  '40+ Years Experience',
]

const ACADEMY_MODULES = [
  {
    num: '01',
    title: 'OKR Foundations',
    description: 'Master the fundamentals of Objectives & Key Results — from writing great OKRs to running effective check-ins and scoring cycles.',
    status: 'available' as const,
  },
  {
    num: '02',
    title: 'Leadership through Ancient Wisdom',
    description: 'Draw on the Bhagavad Gita, Arthashastra, and Thirukkural to navigate modern leadership challenges with clarity and purpose.',
    status: 'available' as const,
  },
  {
    num: '03',
    title: 'Executive Coaching Essentials',
    description: 'Build the core coaching skills that unlock performance — active listening, powerful questions, and growth conversations.',
    status: 'coming-soon' as const,
  },
  {
    num: '04',
    title: 'Strategy for Growth',
    description: 'Translate vision into strategy and strategy into the daily decisions that move the needle — a practical framework for leaders.',
    status: 'coming-soon' as const,
  },
]


const RESOURCES = [
  {
    title: 'OKR Starter Template',
    description: 'A ready-to-use spreadsheet for teams beginning their OKR journey — includes worked examples and a scoring guide.',
    access: 'free' as const,
  },
  {
    title: 'RACI Matrix Guide',
    description: 'A practical RACI framework to clarify roles, reduce confusion, and drive accountability across your organisation.',
    access: 'free' as const,
  },
  {
    title: 'Leadership Assessment Tool',
    description: 'A structured self-assessment to identify strengths, blind spots, and growth areas across eight leadership dimensions.',
    access: 'gated' as const,
  },
]

export default async function HomePage() {
  const [latestPosts, videos, sanityTestimonials, siteSettings] = await Promise.all([
    getLatestPosts(3),
    getPlaylistVideos(),
    getTestimonials(),
    client.fetch(`*[_type == "siteSettings"][0]{yearsExperience,booksPublished,articlesWritten,leadersCoached}`),
  ])

  const STATS = [
    { value: siteSettings?.yearsExperience || '40+', label: 'Years Experience' },
    { value: siteSettings?.booksPublished   || '7',   label: 'Books Published' },
    { value: siteSettings?.articlesWritten  || '182', label: 'Articles Written' },
    { value: siteSettings?.leadersCoached   || '100+',label: 'Leaders Coached' },
  ]
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--brand-bg)' }}>
      <NavBar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-20 pb-24 lg:pt-28 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

          {/* Left */}
          <div>
            {/* Mobile photo — centered above text */}
            <div className="flex justify-center mb-10 lg:hidden">
              <Image
                src="/images/PGS Coach.png"
                alt="Subramaniam P G — Growth Architect and Executive Coach"
                width={220}
                height={220}
                className="rounded-2xl object-cover object-top"
                style={{ width: 220, height: 220 }}
                priority
              />
            </div>

            <p className="section-label mb-6">
              Growth Architect&nbsp;·&nbsp;Executive Coach&nbsp;·&nbsp;Author
            </p>

            <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] xl:text-6xl font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
              Ancient wisdom.<br />
              Modern execution.<br />
              <em className="not-italic text-[#633806]">Meaningful growth.</em>
            </h1>

            <p className="text-sm italic mb-7" style={{ color: '#1D9E75' }}>Helping Leaders Grow. Helping Organisations Grow.</p>

            <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-xl mb-10">
              Helping founders, CXOs and leadership teams align purpose with
              performance through OKR, strategy, and coaching.
            </p>

            <div className="flex flex-wrap gap-4 mb-10">
              <Link
                href="#work"
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#633806] text-white font-medium rounded-lg hover:bg-[#633806]/90 transition-colors text-sm"
              >
                Work with me
              </Link>
              <Link
                href="#academy"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-[#633806] text-[#633806] font-medium rounded-lg hover:bg-[#633806]/5 transition-colors text-sm"
              >
                Explore the Academy
              </Link>
            </div>

            {/* Credential tags */}
            <div className="flex flex-wrap gap-2">
              {CREDENTIALS.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-medium px-3.5 py-1.5 rounded-full bg-[#633806]/10 text-[#633806]"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right — profile photo (desktop) */}
          <div className="hidden lg:flex justify-end">
            <Image
              src="/images/PGS Coach.png"
              alt="Subramaniam P G — Growth Architect and Executive Coach"
              width={340}
              height={340}
              className="rounded-2xl object-cover object-top"
              style={{ width: 340, height: 340 }}
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Credential Strip ─────────────────────────────── */}
      <section className="bg-[#2C2C2A] py-14">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p className="font-lora text-4xl lg:text-5xl font-bold text-[#1D9E75] mb-2">
                  {value}
                </p>
                <p className="text-sm text-white/60 tracking-wide">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Work / Services ──────────────────────────────── */}
      <section id="work" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="section-label mb-4">How I Can Help</p>
          <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
            Work with me
          </h2>
          <p className="mt-4 text-[#5F5E5A] max-w-xl mx-auto leading-relaxed">
            Three focused engagements — each grounded in decades of field experience
            with organisations across India and Asia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {SERVICES.map(({ icon, title, description }) => (
            <div
              key={title}
              className="group flex flex-col p-8 rounded-2xl bg-white border hover:shadow-xl transition-all duration-300"
              style={{ borderColor: '#2C2C2A14' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-[#633806]"
                style={{ backgroundColor: '#63380618' }}
              >
                {icon}
              </div>
              <h3 className="font-lora text-xl font-semibold text-[#2C2C2A] mb-3">
                {title}
              </h3>
              <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1 mb-6">
                {description}
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#633806] group-hover:gap-2.5 transition-all"
              >
                Learn more
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Books ────────────────────────────────────────── */}
      <section id="books" className="py-20 lg:py-28" style={{ backgroundColor: '#6338060d' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <p className="section-label mb-4">Published Works</p>
              <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
                Books
              </h2>
              <p className="mt-3 text-[#5F5E5A] max-w-md leading-relaxed">
                Seven books spanning leadership, strategy, and personal growth —
                drawing on ancient philosophy and modern practice.
              </p>
            </div>
            <Link
              href="/books"
              className="hidden sm:inline-flex shrink-0 items-center gap-2 px-6 py-3 border border-[#633806] text-[#633806] text-sm font-medium rounded-lg hover:bg-[#633806] hover:text-white transition-colors"
            >
              View all books
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
              </svg>
            </Link>
          </div>

          {/* Book grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {BOOKS.map((book) => (
              <Link
                key={book.slug}
                href={`/books/${book.slug}`}
                className="group flex flex-col"
              >
                <div className="relative aspect-[2/3] rounded-lg overflow-hidden shadow-md mb-3 transition-transform duration-300 group-hover:scale-[1.03]">
                  <Image
                    src={book.coverImage}
                    alt={book.title}
                    fill
                    sizes="(max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                  />
                </div>
                <p className="font-lora text-sm font-semibold text-[#2C2C2A] text-center leading-snug">
                  {book.title}
                </p>
              </Link>
            ))}
          </div>

          {/* Mobile CTA */}
          <div className="mt-8 sm:hidden text-center">
            <Link
              href="/books"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#633806] text-[#633806] text-sm font-medium rounded-lg"
            >
              View all books →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Academy ──────────────────────────────────────── */}
      <section id="academy" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="section-label mb-4">Structured Learning</p>
          <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
            Academy
          </h2>
          <p className="mt-4 text-[#5F5E5A] max-w-xl mx-auto leading-relaxed">
            Structured learning for leaders and teams — combining ancient frameworks
            with modern practice.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {ACADEMY_MODULES.map(({ num, title, description, status }) => (
            <div
              key={num}
              className="group flex flex-col p-8 rounded-2xl bg-white border hover:shadow-lg transition-all duration-300"
              style={{ borderColor: '#2C2C2A14' }}
            >
              <div className="flex items-start justify-between mb-5">
                <span
                  className="font-lora text-4xl font-bold leading-none"
                  style={{ color: '#63380620' }}
                >
                  {num}
                </span>
                {status === 'available' ? (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75]">
                    Available Now
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-600">
                    Coming Soon
                  </span>
                )}
              </div>
              <h3 className="font-lora text-xl font-semibold text-[#2C2C2A] mb-3">
                {title}
              </h3>
              <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1 mb-6">
                {description}
              </p>
              {status === 'available' ? (
                <Link
                  href="/academy"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#633806] group-hover:gap-2.5 transition-all"
                >
                  Explore module
                  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
                  </svg>
                </Link>
              ) : (
                <p className="text-xs text-[#5F5E5A]/60 italic">Launching soon — stay tuned</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ── Blog ─────────────────────────────────────────── */}
      <section id="blog" className="py-20 lg:py-28" style={{ backgroundColor: '#6338060a' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">

          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
            <div>
              <p className="section-label mb-4">Writing</p>
              <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
                Latest articles
              </h2>
              <p className="mt-3 text-[#5F5E5A] max-w-md leading-relaxed">
                Weekly insights on leadership, OKR, and ancient wisdom.
              </p>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex shrink-0 items-center gap-2 px-6 py-3 border border-[#633806] text-[#633806] text-sm font-medium rounded-lg hover:bg-[#633806] hover:text-white transition-colors"
            >
              All articles
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
              </svg>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {latestPosts.map((post) => {
              const category = post.categories?.[0] ?? 'Leadership'
              const date = formatPostDate(post.publishedAt)
              return (
                <article
                  key={post._id}
                  className="group flex flex-col bg-white rounded-2xl overflow-hidden border hover:shadow-lg transition-all duration-300"
                  style={{ borderColor: '#2C2C2A14' }}
                >
                  {/* Cover image */}
                  <div
                    className="h-44 flex items-center justify-center overflow-hidden"
                    style={{ backgroundColor: '#63380610' }}
                  >
                    {post.mainImage ? (
                      <img
                        src={post.mainImage}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1}
                        className="w-10 h-10"
                        style={{ color: '#63380640' }}
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-6">
                    <span className="inline-flex self-start text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-600 mb-4">
                      {category}
                    </span>
                    <h3 className="font-lora text-lg font-semibold text-[#2C2C2A] leading-snug mb-3 group-hover:text-[#633806] transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1 mb-4">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#2C2C2A0f' }}>
                      <time className="text-xs text-[#5F5E5A]/60">{date}</time>
                      <Link href={`/blog/${post.slug}`} className="text-xs font-semibold text-[#633806]">Read →</Link>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>

          <div className="mt-8 sm:hidden text-center">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 px-6 py-3 border border-[#633806] text-[#633806] text-sm font-medium rounded-lg"
            >
              All articles →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Resources ────────────────────────────────────── */}
      <section id="resources" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
        <div className="text-center mb-14">
          <p className="section-label mb-4">Tools & Frameworks</p>
          <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
            Resources
          </h2>
          <p className="mt-4 text-[#5F5E5A] max-w-xl mx-auto leading-relaxed">
            Free tools and frameworks for leaders — ready to use in your next
            planning session or team meeting.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {RESOURCES.map(({ title, description, access }) => (
            <div
              key={title}
              className="group flex flex-col p-8 rounded-2xl bg-white border hover:shadow-lg transition-all duration-300"
              style={{ borderColor: '#2C2C2A14' }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-6 text-[#633806]"
                style={{ backgroundColor: '#63380618' }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10 9 9 9 8 9" />
                </svg>
              </div>

              {/* Badge */}
              {access === 'free' ? (
                <span className="inline-flex self-start text-xs font-semibold px-3 py-1 rounded-full bg-[#1D9E75]/10 text-[#1D9E75] mb-4">
                  Free Download
                </span>
              ) : (
                <span className="inline-flex self-start text-xs font-semibold px-3 py-1 rounded-full bg-amber-50 text-amber-600 mb-4">
                  Email Required
                </span>
              )}

              <h3 className="font-lora text-xl font-semibold text-[#2C2C2A] mb-3">
                {title}
              </h3>
              <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1 mb-6">
                {description}
              </p>
              <Link
                href="/resources"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#633806] group-hover:gap-2.5 transition-all"
              >
                {access === 'free' ? 'Download free' : 'Get access'}
                <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                  <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── What Leaders Say ─────────────────────────────── */}
      <WhatLeadersSay
        testimonials={
          sanityTestimonials.length > 0
            ? sanityTestimonials.map((t) => ({
                quote: t.quote,
                author: t.name,
                role: t.designation ?? '',
              }))
            : [{
                quote: 'Subramaniam P G brought extraordinary clarity to our leadership team. His ability to weave ancient wisdom with the hard realities of modern business strategy is unmatched. The frameworks he introduced have changed how we think about goals, accountability, and growth — not just as a company, but as individuals.',
                author: 'Sanjay Mariwala',
                role: 'Executive Chairman and Managing Director, OmniActive Health Technologies',
              }]
        }
        videos={videos}
      />

      <Footer />
    </div>
  )
}
