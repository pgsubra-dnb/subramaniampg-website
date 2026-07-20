'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function StickyMobileCTA() {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const target = document.getElementById('final-cta')
    if (!target) return

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { rootMargin: '0px 0px -10% 0px' }
    )
    observer.observe(target)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      className={`fixed bottom-0 inset-x-0 z-40 lg:hidden px-4 py-3 transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      style={{ backgroundColor: '#FAF8F5', borderTop: '1px solid #E8E4DC' }}
    >
      <Link
        href="/tools/okr-health-check"
        className="block w-full text-center px-6 py-3 rounded font-medium text-sm"
        style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
      >
        Take the 2-Minute OKR Health Check
      </Link>
    </div>
  )
}
