import Link from 'next/link'

const FOOTER_LINKS = ['About', 'Work', 'Books', 'Academy', 'Resources', 'Blog']

export default function Footer() {
  return (
    <footer className="bg-[#2C2C2A]">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-10">

        {/* Top grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-white/10">

          {/* Brand */}
          <div className="lg:col-span-2">
            <p className="font-lora text-xl font-semibold text-white mb-3">
              Subramaniam P G
            </p>
            <p className="text-sm text-white/50 leading-relaxed max-w-xs">
              Growth Architect · Executive Coach · Author.<br />
              Ancient wisdom. Modern execution. Meaningful growth.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white/30 mb-5">
              Navigation
            </p>
            <ul className="space-y-3">
              {FOOTER_LINKS.map((link) => (
                <li key={link}>
                  <Link
                    href={`/${link.toLowerCase()}`}
                    className="text-sm text-white/55 hover:text-white transition-colors"
                  >
                    {link}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Connect */}
          <div>
            <p className="text-xs font-semibold tracking-[0.15em] uppercase text-white/30 mb-5">
              Connect
            </p>
            <ul className="space-y-3">
              <li>
                <a
                  href="#"
                  className="text-sm text-white/55 hover:text-white transition-colors"
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-white/55 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <a href="https://cal.id/pgs/short-discussion" target="_blank" rel="noopener noreferrer" className="text-sm text-white/55 hover:text-white transition-colors">
                  Book a call
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Subramaniam P G. All rights reserved.
          </p>
          <p className="text-xs text-white/30">Built with purpose.</p>
        </div>
      </div>
    </footer>
  )
}
