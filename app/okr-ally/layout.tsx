import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'OKR Ally — Powered by AI',
  description:
    'OKR Ally reviews the Objective and Key Results you wrote, scores them against a clear rubric, and rewrites them two ways. Powered by AI.',
  robots: { index: false, follow: false },
}

export default function OkrAllyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
