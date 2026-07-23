import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'How Is Work Really Going For You? | A Research Survey',
  description:
    'A short 5 minute research survey on the everyday challenges working professionals face. Anonymous. No sales, no signup.',
  robots: { index: false, follow: false },
}

export default function WorklifeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
