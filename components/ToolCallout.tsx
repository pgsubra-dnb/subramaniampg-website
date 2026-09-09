import Link from 'next/link'

/**
 * Promotional callout for a live AI tool (OKR Ally, Goal Ally).
 * Rendered as a distinct card so it stands out against surrounding page content.
 * Content only — links out to the tool on app.subramaniampg.guru.
 */
export default function ToolCallout({
  heading,
  body,
  ctaLabel,
  ctaHref,
}: {
  heading: string
  body: string
  ctaLabel: string
  ctaHref: string
}) {
  return (
    <div
      className="rounded-xl border p-6 sm:p-8"
      style={{ backgroundColor: '#FAEEDA', borderColor: '#E8D9BE' }}
    >
      <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mb-3">{heading}</h2>
      <p className="text-sm text-[#5F5E5A] leading-relaxed mb-5 max-w-2xl">{body}</p>
      <Link
        href={ctaHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-6 py-3 rounded font-medium text-sm"
        style={{ backgroundColor: '#633806', color: '#FAEEDA' }}
      >
        {ctaLabel}
      </Link>
    </div>
  )
}
