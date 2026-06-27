import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import EmailGatedResources from '@/components/EmailGatedResources'
import { client } from '@/lib/sanity'

const Divider = () => (
  <div className="w-full h-px" style={{ backgroundColor: '#E8E4DC' }} />
)

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4 shrink-0">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
  </svg>
)

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

const FALLBACK_FREE = [
  { _id: 'f1', title: 'Awaken Your Potential Sample', accessType: 'free', filename: 'Awaken Your Potential Sample.pdf' },
  { _id: 'f2', title: 'Elevate Your Leadership Sample', accessType: 'free', filename: 'Elevate your Leadership Sample.pdf' },
  { _id: 'f3', title: 'OKR Maturity Model', accessType: 'free', filename: 'OKR Maturity Model.pdf' },
  { _id: 'f4', title: 'RACI Guideline', accessType: 'free', filename: 'RACI guideline.pdf' },
]

const FALLBACK_GATED = [
  { _id: 'g1', title: 'Language of OKR', filename: 'Language of OKR.pdf' },
  { _id: 'g2', title: 'Master Execution Gap', filename: 'Master Execution Gap.pdf' },
]

type SanityResource = {
  _id: string
  title: string
  description?: string
  accessType: 'free' | 'gated'
  externalUrl?: string
  file?: { asset?: { url?: string } }
}

function getResourceFilename(title: string): string {
  const map: Record<string, string> = {
    'Awaken Your Potential Sample': 'Awaken Your Potential Sample.pdf',
    'Elevate Your Leadership Sample': 'Elevate your Leadership Sample.pdf',
    'OKR Maturity Model': 'OKR Maturity Model.pdf',
    'RACI Guideline': 'RACI guideline.pdf',
    'Language of OKR': 'Language of OKR.pdf',
    'Master Execution Gap': 'Master Execution Gap.pdf',
  }
  return map[title] ?? `${title}.pdf`
}

export default async function ResourcesPage() {
  let freeResources: SanityResource[] = []
  let gatedResources: SanityResource[] = []

  try {
    const resources: SanityResource[] = await client.fetch(
      `*[_type == "resource"] | order(accessType asc, title asc) {
        _id,
        title,
        description,
        accessType,
        externalUrl,
        file { asset->{ url } }
      }`,
      {},
      { next: { revalidate: 3600 } }
    )

    freeResources = resources.filter(r => r.accessType === 'free')
    gatedResources = resources.filter(r => r.accessType === 'gated')
  } catch {
    // Sanity unavailable — fall through to fallbacks below
  }

  const displayFree = freeResources.length > 0
    ? freeResources
    : FALLBACK_FREE.map(f => ({ ...f, accessType: 'free' as const }))

  const displayGated = gatedResources.length > 0
    ? gatedResources.map(r => ({ title: r.title, filename: getResourceFilename(r.title) }))
    : FALLBACK_GATED

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20 text-center">
        <p className="section-label mb-6">RESOURCES</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
          Tools and frameworks for leaders
        </h1>
        <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Tools for intentional growth.</p>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl mx-auto">
          Practical resources you can use today — free to download or access with your email.
        </p>
      </section>

      <Divider />

      {/* ── Section 1: Free downloads ─────────────────────── */}
      <section className="py-16 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="section-label mb-4">FREE DOWNLOADS</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-3">
              Free resources
            </h2>
            <p className="text-[#5F5E5A] max-w-xl leading-relaxed">
              No email needed. Click Download to get the file immediately.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayFree.map((res) => {
              const fileUrl = (res as SanityResource).file?.asset?.url
                ?? (res as SanityResource).externalUrl
                ?? `/resources/free/${encodeURIComponent(getResourceFilename(res.title))}`
              return (
                <div
                  key={res._id}
                  className="flex flex-col p-7 rounded-2xl border bg-white shadow-sm"
                  style={{ borderColor: '#E8E4DC' }}
                >
                  {/* Icon */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 shrink-0"
                    style={{ backgroundColor: '#E1F5EE', color: '#0D6E4E' }}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                    </svg>
                  </div>

                  {/* Badge */}
                  <span
                    className="text-xs font-semibold px-3 py-1 rounded-full w-fit mb-4"
                    style={{ backgroundColor: '#E1F5EE', color: '#0D6E4E' }}
                  >
                    Free Download
                  </span>

                  <h3 className="font-lora text-lg font-bold text-[#2C2C2A] mb-6 leading-snug flex-1">
                    {res.title}
                  </h3>

                  <a
                    href={fileUrl}
                    download={getResourceFilename(res.title)}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 text-white text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: '#633806' }}
                  >
                    Download
                    <DownloadIcon />
                  </a>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Section 2: Email-gated resources ──────────────── */}
      <section className="py-16 lg:py-24" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="mb-12">
            <p className="section-label mb-4">GATED RESOURCES</p>
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-[#2C2C2A] mb-3">
              Free with your email
            </h2>
            <p className="text-[#5F5E5A] max-w-xl leading-relaxed">
              Share your email to get instant access. You will also receive occasional insights from Subramaniam P G.
            </p>
          </div>

          <EmailGatedResources resources={displayGated} />
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#2C2C2A' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-4">
              Looking for something specific?
            </h2>
            <p className="text-white/60 leading-relaxed mb-8">
              If you need a particular framework or tool for your team, reach out and we can discuss.
            </p>
            <a
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-medium rounded-lg transition-colors hover:border-white"
            >
              Get in touch
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
