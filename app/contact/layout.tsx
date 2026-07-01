import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact Subramaniam P G — Book a Discovery Call',
  description:
    'Get in touch with Subramaniam P G to explore OKR consulting, executive coaching, or strategy engagements. Book a 30-minute discovery call or send a message.',
  alternates: { canonical: 'https://www.subramaniampg.guru/contact' },
  openGraph: {
    title: 'Contact Subramaniam P G',
    description: 'Book a discovery call or enquire about OKR consulting, executive coaching, or speaking.',
    url: 'https://www.subramaniampg.guru/contact',
  },
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
