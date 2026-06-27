import Image from 'next/image'
import Link from 'next/link'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { client } from '@/lib/sanity'

type SanityCareerEntry = {
  _id: string
  slug: string
  role: string
  organisation: string
  city: string
  startDate: string
  endDate?: string
  isCurrent: boolean
  order: number
}

function formatPeriod(entry: SanityCareerEntry): string {
  return `${entry.startDate} – ${entry.isCurrent ? 'Present' : (entry.endDate ?? '')}`
}

const FALLBACK_CAREER: SanityCareerEntry[] = [
  {
    _id: 'f1', slug: 'embiggen-consulting', order: 1,
    role: 'Chief Growth Enabler', organisation: 'Embiggen Consulting LLP', city: 'Chennai',
    startDate: 'Jul 2023', isCurrent: true,
  },
  {
    _id: 'f2', slug: 'enerji-amnet', order: 2,
    role: 'Director', organisation: 'Enerji Systems Pvt Ltd / Amnet Systems Pvt Ltd / We Are Amnet', city: 'Chennai',
    startDate: 'Mar 2022', isCurrent: true,
  },
  {
    _id: 'f3', slug: 'amnet-coo', order: 3,
    role: 'Chief Operating Officer', organisation: 'Amnet Systems / Habiliss', city: 'Chennai',
    startDate: 'Oct 2015', endDate: 'Jun 2023', isCurrent: false,
  },
]

const EDUCATION = [
  { institution: 'IIT BHU Varanasi', qualification: 'B Tech, Chemical Engineering', period: '1982 – 1986' },
  { institution: 'Kendriya Vidyalaya', qualification: 'Plus 2', period: '1979 – 1981' },
  { institution: 'Sainik School Tillaiya', qualification: 'Class 10', period: '1973 – 1978' },
]

const CERTIFICATIONS = [
  'Six Sigma Black Belt (Motorola Academy via TQMI)',
  'Certified Executive Coach',
  'Certified Senior Assessor RBNQA',
  'Certified Trainer TTI Australia',
]

const SPECIALISATIONS = [
  'Six Sigma',
  'OKR Consulting',
  'Executive Coaching',
  'Business Excellence',
  'Quality Management',
  'Strategy Consulting',
]

const Divider = () => (
  <div className="w-full h-px" style={{ backgroundColor: '#E8E4DC' }} />
)

export default async function AboutPage() {
  let careerData: SanityCareerEntry[] = []

  try {
    const fetched: SanityCareerEntry[] = await client.fetch(
      `*[_type == "careerEntry"] | order(order asc) {
        _id,
        "slug": slug.current,
        role,
        organisation,
        city,
        startDate,
        endDate,
        isCurrent,
        order
      }`,
      {},
      { next: { revalidate: 3600 } }
    )
    careerData = fetched.length > 0 ? fetched : FALLBACK_CAREER
  } catch {
    careerData = FALLBACK_CAREER
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Hero ── bg: #FAF8F5 ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">

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

            <h1 className="font-lora text-4xl sm:text-5xl lg:text-[2.6rem] xl:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2 whitespace-nowrap">
              About Subramaniam P G
            </h1>

            <p className="text-sm italic mb-7" style={{ color: '#1D9E75' }}>Enabling Growth. Purposefully.</p>

            {/* Blockquote-style bio with left border accent */}
            <blockquote
              className="pl-5 text-lg text-[#5F5E5A] leading-relaxed max-w-xl border-l-4"
              style={{ borderColor: '#633806' }}
            >
              I work with founder-led and growth-stage organizations that are
              experiencing execution complexity as they scale. My work focuses on
              helping leadership teams create strategic clarity, alignment,
              accountability, and operating rhythm across the organization. With
              4 decades of experience across industries and geographies, I have
              authored 7 books, mentored over 100 professionals, and guided 100
              plus companies in building sustainable success.
            </blockquote>
          </div>

          {/* Right — profile photo (desktop) */}
          <div className="hidden lg:flex justify-end">
            <Image
              src="/images/PGS Coach.png"
              alt="Subramaniam P G — Growth Architect and Executive Coach"
              width={320}
              height={320}
              className="rounded-2xl object-cover object-top"
              style={{ width: 320, height: 320 }}
              priority
            />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Career Timeline ── bg: #FAF8F5 ──────────────── */}
      <section style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-5">

            {/* Left column — 40% — sticky summary */}
            <div
              className="lg:col-span-2 px-6 lg:px-10 py-14 lg:py-20"
              style={{
                backgroundColor: '#F1EFE8',
                backgroundImage: 'radial-gradient(circle, #D4CFC4 1px, transparent 1px)',
                backgroundSize: '22px 22px',
              }}
            >
              <div className="sticky top-20">
                <p className="section-label mb-3">Experience</p>
                <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-8">
                  Career journey
                </h2>

                {/* Big stat */}
                <div className="mb-5">
                  <p className="font-lora text-7xl font-bold leading-none mb-1" style={{ color: '#633806' }}>
                    40+
                  </p>
                  <p className="text-xs font-semibold tracking-[0.18em] uppercase text-[#5F5E5A]">
                    years of experience
                  </p>
                </div>

                {/* Short paragraph */}
                <p className="text-sm text-[#5F5E5A] leading-relaxed mb-8">
                  From managing hazardous boiler operations at ITC in 1986 to coaching
                  CXOs at Embiggen today — four decades of building, leading, and growing
                  organisations across India and the world.
                </p>

                {/* Key highlights */}
                <ul className="space-y-3">
                  {[
                    'Worked across 6 countries',
                    'Led teams of 75 to 500 people',
                    'Built a consulting practice for 23 years',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <span
                        className="mt-1.5 w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: '#1D9E75' }}
                      />
                      <span className="text-sm text-[#5F5E5A]">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Right column — 60% — timeline */}
            <div className="lg:col-span-3 px-6 lg:px-10 py-14 lg:py-20 bg-white">
              <div className="relative">
                {/* Vertical line */}
                <div
                  className="absolute left-[7px] top-3 bottom-3 w-px"
                  style={{ backgroundColor: '#E8E4DC' }}
                />

                <ol className="space-y-6">
                  {careerData.map((entry) => (
                    <li key={entry._id} className="relative pl-10">
                      <div
                        className="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#633806] bg-white"
                      />
                      <p className="text-xs font-semibold tracking-widest uppercase text-[#1D9E75] mb-0.5">
                        {formatPeriod(entry)}
                      </p>
                      <h3 className="font-lora text-lg font-semibold text-[#2C2C2A] mb-0.5">
                        {entry.role}
                      </h3>
                      <p className="text-sm font-medium text-[#633806] mb-0.5">{entry.organisation}</p>
                      {entry.city && (
                        <p className="text-xs text-[#888780] mb-1.5">{entry.city}</p>
                      )}
                      <Link
                        href={`/about/career/${entry.slug}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold transition-all hover:gap-1.5"
                        style={{ color: '#633806' }}
                      >
                        View details
                        <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
                          <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Divider />

      {/* ── Education ── bg: #FAF8F5 ─────────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-10">
            <p className="section-label mb-3">Academic Background</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A]">
              Education
            </h2>
          </div>

          {/* 3-column grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
            {EDUCATION.map(({ institution, qualification, period }) => (
              <div
                key={institution}
                className="flex flex-col gap-3 p-6 rounded-2xl bg-white border"
                style={{ borderColor: '#E8E4DC' }}
              >
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-[#633806]"
                  style={{ backgroundColor: '#63380618' }}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c0 1.657 2.686 3 6 3s6-1.343 6-3v-5" />
                  </svg>
                </div>
                <div>
                  <p className="font-lora text-lg font-semibold text-[#2C2C2A] mb-0.5">
                    {institution}
                  </p>
                  <p className="text-sm text-[#5F5E5A] mb-1">{qualification}</p>
                  <p className="text-xs font-semibold tracking-widest uppercase text-[#1D9E75]">
                    {period}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Certifications — filled #FAEEDA tags */}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-[#5F5E5A]/60 mb-4">
              Certifications
            </p>
            <div className="flex flex-wrap gap-2.5">
              {CERTIFICATIONS.map((cert) => (
                <span
                  key={cert}
                  className="text-sm font-medium px-4 py-2 rounded-full text-[#633806]"
                  style={{ backgroundColor: '#FAEEDA' }}
                >
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Specialisations ── bg: #2C2C2A dark ─────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-[#1D9E75] mb-3">
              Areas of Expertise
            </p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white">
              Specialisations
            </h2>
          </div>

          <div className="flex flex-wrap gap-3">
            {SPECIALISATIONS.map((tag) => (
              <span
                key={tag}
                className="text-sm font-medium px-5 py-2.5 rounded-full text-[#633806]"
                style={{ backgroundColor: '#FAEEDA' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── bg: #633806 deep ochre ────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#633806' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-xs font-semibold tracking-[0.2em] uppercase text-white/50 mb-4">
              Let&apos;s Work Together
            </p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-5">
              Ready to work together?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Whether you&apos;re looking for strategic clarity, leadership coaching, or
              building a high-performance team — let&apos;s start a conversation.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Let&apos;s Connect
              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
