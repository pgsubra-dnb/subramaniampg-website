import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OKR Health Check | Subramaniam P G',
  description:
    'Answer 8 quick questions and get your OKR Health Check in under two minutes.',
  robots: {
    index: false,
    follow: false,
    googleBot: { index: false, follow: false },
  },
}

export default function OKRHealthCheckLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
