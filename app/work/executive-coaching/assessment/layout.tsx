import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Coaching Readiness Assessment | Executive Coaching | Subramaniam P G',
  description:
    'Find out if executive coaching is the right next step. A 5-minute assessment to help you understand what kind of support would move you forward.',
  alternates: { canonical: 'https://www.subramaniampg.guru/work/executive-coaching/assessment' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
