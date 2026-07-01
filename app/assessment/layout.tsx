import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Leadership Execution Scale Assessment | Subramaniam P G',
  description:
    'Take the free 10-minute Leadership Execution Scale assessment to find out where your organisation stands on clarity, alignment, and execution. Get an instant personalised report.',
  alternates: { canonical: 'https://www.subramaniampg.guru/assessment' },
  openGraph: {
    title: 'Free Leadership Execution Scale Assessment | Subramaniam P G',
    description: 'Find out where your organisation stands on clarity, alignment, and execution. Free 10-minute assessment with instant report.',
    url: 'https://www.subramaniampg.guru/assessment',
  },
}

export default function AssessmentLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
