import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'PACE Maturity Assessment | Strategy Consulting | Subramaniam P G',
  description:
    'Take the free PACE Maturity Assessment to find out where your organisation stands on Planning, Alignment, Cadence, and Execution. Get an instant report.',
  alternates: { canonical: 'https://www.subramaniampg.guru/work/strategy-consulting/assessment' },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
