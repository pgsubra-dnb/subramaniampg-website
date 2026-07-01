import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  style: ['normal', 'italic'],
})

const BASE = 'https://www.subramaniampg.guru'

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'Subramaniam P G | OKR Coach, Executive Coach & Growth Architect',
    template: '%s | Subramaniam P G',
  },
  description:
    'Subramaniam P G is an OKR coach, executive coach, and strategy consultant helping founders and CXOs in India align purpose with performance. 40+ years experience, 7 books published.',
  keywords: [
    'OKR coach India',
    'executive coach Chennai',
    'OKR consulting',
    'executive coaching India',
    'strategy consulting',
    'Subramaniam PG',
    'growth architect',
    'leadership coach India',
  ],
  authors: [{ name: 'Subramaniam P G', url: BASE }],
  creator: 'Subramaniam P G',
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: BASE,
    siteName: 'Subramaniam P G',
    title: 'Subramaniam P G | OKR Coach, Executive Coach & Growth Architect',
    description:
      'OKR coach, executive coach, and strategy consultant helping founders and CXOs align purpose with performance. Based in Chennai, India.',
    images: [
      {
        url: '/images/PGS Coach.png',
        width: 800,
        height: 800,
        alt: 'Subramaniam P G — Growth Architect and Executive Coach',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Subramaniam P G | OKR Coach & Executive Coach',
    description:
      'OKR coach, executive coach, and strategy consultant. 40+ years experience, 7 books. Chennai, India.',
    images: ['/images/PGS Coach.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  alternates: { canonical: BASE },
}

const personJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'Subramaniam P G',
  url: BASE,
  image: `${BASE}/images/PGS Coach.png`,
  jobTitle: 'Growth Architect, OKR Coach & Executive Coach',
  description:
    'Subramaniam P G is a certified OKR coach and executive coach with 40+ years of experience helping founders, CXOs, and leadership teams in India and Asia align purpose with performance through OKR, strategy, and coaching.',
  worksFor: {
    '@type': 'Organization',
    name: 'Embiggen Consulting LLP',
    url: 'https://embiggen.co.in',
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Chennai',
    addressCountry: 'IN',
  },
  knowsAbout: [
    'OKR (Objectives and Key Results)',
    'Executive Coaching',
    'Strategy Consulting',
    'Leadership Development',
    'Ancient Indian Philosophy',
    'Bhagavad Gita',
    'Arthashastra',
    'Thirukkural',
  ],
  hasCredential: [
    { '@type': 'EducationalOccupationalCredential', credentialCategory: 'Certified OKR Coach' },
    { '@type': 'EducationalOccupationalCredential', credentialCategory: 'Executive Coach' },
  ],
  sameAs: [
    'https://www.linkedin.com/in/subramaniampg/',
  ],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${lora.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
