'use client'

import { useState } from 'react'
import Link from 'next/link'

const NAV_LINKS = [
  { label: 'About',      href: '/about' },
  { label: 'Work',         href: '/work' },
  { label: 'Case Studies', href: '/case-studies' },
  { label: 'Books',        href: '/books' },
  { label: 'Academy',    href: '/academy' },
  { label: 'Resources',  href: '/resources' },
  { label: 'Blog',       href: '/blog' },
]

export default function NavBar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-sm border-b border-[#2C2C2A]/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="font-lora text-lg font-semibold text-[#2C2C2A] tracking-tight shrink-0">
          Subramaniam P G
        </Link>

        {/* Desktop nav — visible at lg+ to accommodate 7 items */}
        <nav className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-[#5F5E5A] hover:text-[#633806] transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <Link
          href="/contact"
          className="hidden lg:inline-flex items-center px-5 py-2.5 bg-[#633806] text-white text-sm font-medium rounded-lg hover:bg-[#633806]/90 transition-colors shrink-0"
        >
          Let&apos;s Connect
        </Link>

        {/* Mobile hamburger — visible below lg */}
        <button
          onClick={() => setOpen(!open)}
          aria-label="Toggle navigation"
          className="lg:hidden flex flex-col gap-1.5 p-2"
        >
          <span className={`block w-5 h-0.5 bg-[#2C2C2A] transition-transform duration-200 ${open ? 'rotate-45 translate-y-2' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#2C2C2A] transition-opacity duration-200 ${open ? 'opacity-0' : ''}`} />
          <span className={`block w-5 h-0.5 bg-[#2C2C2A] transition-transform duration-200 ${open ? '-rotate-45 -translate-y-2' : ''}`} />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-[#FAF8F5] border-t border-[#2C2C2A]/10 px-6 py-4 flex flex-col gap-4">
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              onClick={() => setOpen(false)}
              className="text-sm text-[#5F5E5A] hover:text-[#633806] transition-colors py-1"
            >
              {label}
            </Link>
          ))}
          <Link
            href="/contact"
            onClick={() => setOpen(false)}
            className="mt-2 inline-flex justify-center px-5 py-2.5 bg-[#633806] text-white text-sm font-medium rounded-lg"
          >
            Let&apos;s Connect
          </Link>
        </div>
      )}
    </header>
  )
}
