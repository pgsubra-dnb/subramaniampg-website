import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Customers — Admin',
  robots: { index: false, follow: false },
}

export default function AdminCustomersLayout({ children }: { children: React.ReactNode }) {
  return children
}
