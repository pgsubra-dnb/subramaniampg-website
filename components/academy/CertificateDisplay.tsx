'use client'
import { useEffect } from 'react'

interface CertProps {
  certificate: {
    certificateId: string
    learnerName: string
    courseTitle: string
    descriptionLine: string
    dateIssued: string
    badgeImageUrl?: string
  }
}

export default function CertificateDisplay({ certificate }: CertProps) {
  useEffect(() => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@600&display=swap'
    document.head.appendChild(link)
    return () => { document.head.removeChild(link) }
  }, [])

  const dateFormatted = new Date(certificate.dateIssued).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  async function downloadPDF() {
    const { jsPDF } = await import('jspdf')
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
    const W = 297, H = 210

    // Background
    doc.setFillColor(250, 248, 245)
    doc.rect(0, 0, W, H, 'F')

    // Outer border ochre
    doc.setDrawColor(99, 56, 6)
    doc.setLineWidth(1.2)
    doc.rect(6, 6, W - 12, H - 12)
    doc.setLineWidth(0.3)
    doc.rect(10, 10, W - 20, H - 20)

    // Top ochre bar + teal accent
    doc.setFillColor(99, 56, 6)
    doc.rect(6, 6, W - 12, 5, 'F')
    doc.setFillColor(29, 158, 117)
    doc.rect(6, 11, W - 12, 1.5, 'F')

    // Bottom ochre bar + teal accent
    doc.setFillColor(99, 56, 6)
    doc.rect(6, H - 11, W - 12, 5, 'F')
    doc.setFillColor(29, 158, 117)
    doc.rect(6, H - 12.5, W - 12, 1.5, 'F')

    // Watermark
    doc.setTextColor(200, 195, 185)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(52)
    doc.text('EMBIGGEN', W / 2, H / 2 + 8, { align: 'center', charSpace: 6 })

    // Badge image
    if (certificate.badgeImageUrl) {
      try {
        const response = await fetch(certificate.badgeImageUrl)
        const blob = await response.blob()
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.readAsDataURL(blob)
        })
        doc.addImage(base64, 'WEBP', W / 2 - 12, 14, 24, 24)
      } catch { /* skip if unavailable */ }
    }

    // Certificate label
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(95, 94, 90)
    doc.text('CERTIFICATE OF COMPLETION', W / 2, 46, { align: 'center', charSpace: 2 })

    // Teal divider
    doc.setDrawColor(29, 158, 117)
    doc.setLineWidth(0.5)
    doc.line(90, 49, 207, 49)

    // This certifies that
    doc.setFont('times', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(95, 94, 90)
    doc.text('This certifies that', W / 2, 60, { align: 'center' })

    // Learner name
    doc.setFont('times', 'bold')
    doc.setFontSize(28)
    doc.setTextColor(44, 44, 42)
    doc.text(certificate.learnerName, W / 2, 78, { align: 'center' })

    // Name underline
    doc.setDrawColor(99, 56, 6)
    doc.setLineWidth(0.4)
    const nameW = doc.getTextWidth(certificate.learnerName)
    doc.line(W / 2 - nameW / 2 - 5, 81, W / 2 + nameW / 2 + 5, 81)

    // Has successfully completed
    doc.setFont('times', 'italic')
    doc.setFontSize(10)
    doc.setTextColor(95, 94, 90)
    doc.text('has successfully completed', W / 2, 92, { align: 'center' })

    // Course title
    doc.setFont('times', 'bold')
    doc.setFontSize(22)
    doc.setTextColor(99, 56, 6)
    doc.text(certificate.courseTitle, W / 2, 106, { align: 'center' })

    // Description
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(95, 94, 90)
    doc.text(certificate.descriptionLine, W / 2, 115, { align: 'center' })

    // Divider
    doc.setDrawColor(211, 209, 199)
    doc.setLineWidth(0.3)
    doc.line(20, 122, W - 20, 122)

    // Footer — date
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.setTextColor(95, 94, 90)
    doc.text('DATE OF COMPLETION', 55, 132, { align: 'center', charSpace: 1 })
    doc.setFontSize(9)
    doc.setTextColor(44, 44, 42)
    doc.text(dateFormatted, 55, 140, { align: 'center' })
    doc.setDrawColor(99, 56, 6)
    doc.line(22, 143, 88, 143)

    // Footer — cert ID
    doc.setFontSize(7)
    doc.setTextColor(95, 94, 90)
    doc.text('CERTIFICATE ID', W / 2, 132, { align: 'center', charSpace: 1 })
    doc.setFontSize(9)
    doc.setTextColor(44, 44, 42)
    doc.text(certificate.certificateId, W / 2, 140, { align: 'center' })
    doc.setDrawColor(99, 56, 6)
    doc.line(W / 2 - 38, 143, W / 2 + 38, 143)

    // Footer — signature
    doc.setFont('times', 'italic')
    doc.setFontSize(20)
    doc.setTextColor(44, 44, 42)
    doc.text('Subramaniam P G', W - 58, 136, { align: 'center' })
    doc.setDrawColor(99, 56, 6)
    doc.line(W - 88, 139, W - 28, 139)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(95, 94, 90)
    doc.text('GROWTH ARCHITECT | EXECUTIVE COACH', W - 58, 145, { align: 'center' })
    doc.setTextColor(99, 56, 6)
    doc.text('EMBIGGEN CONSULTING LLP', W - 58, 151, { align: 'center', charSpace: 1 })

    doc.save(`Certificate-${certificate.certificateId}.pdf`)
  }

  return (
    <div className="my-8 w-full max-w-2xl mx-auto">
      {/* On-screen preview */}
      <div className="relative border-4 rounded overflow-hidden"
        style={{ borderColor: '#633806', background: '#FAF8F5' }}>
        {/* Top bars */}
        <div className="h-2" style={{ background: '#633806' }} />
        <div className="h-0.5" style={{ background: '#1D9E75' }} />

        {/* Watermark — Embiggen logo SVG */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
          style={{ opacity: 0.10 }}>
          <svg width="340" height="120" viewBox="0 0 340 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Plant icon */}
            <g stroke="#2D6A2D" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <ellipse cx="52" cy="38" rx="16" ry="20" transform="rotate(-20 52 38)" />
              <ellipse cx="72" cy="32" rx="14" ry="18" transform="rotate(15 72 32)" />
              <path d="M62 88 C62 70 55 55 52 42" />
              <path d="M62 88 C62 70 70 55 72 40" />
              <path d="M35 96 Q62 88 89 96" />
              <line x1="62" y1="88" x2="62" y2="96" />
            </g>
            {/* Vertical divider */}
            <line x1="108" y1="20" x2="108" y2="100" stroke="#2D6A2D" strokeWidth="1.5" />
            {/* EMBIGGEN text */}
            <text x="120" y="68" fontFamily="Georgia, serif" fontSize="36" fontWeight="700" fill="#2D6A2D" letterSpacing="3">EMBIGGEN</text>
            {/* ENABLING GROWTH subtext */}
            <text x="121" y="86" fontFamily="Arial, sans-serif" fontSize="13" fill="#888" letterSpacing="4">ENABLING GROWTH</text>
          </svg>
        </div>

        <div className="px-8 py-6 text-center relative">
          {/* Badge */}
          {certificate.badgeImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={certificate.badgeImageUrl} alt="Course badge"
              className="w-20 h-20 mx-auto mb-3 object-contain" />
          )}

          <p className="text-xs tracking-widest mb-3" style={{ color: '#5F5E5A', letterSpacing: 3 }}>
            CERTIFICATE OF COMPLETION
          </p>
          <div className="h-px w-48 mx-auto mb-4" style={{ background: '#1D9E75' }} />

          <p className="text-sm italic mb-2" style={{ color: '#5F5E5A' }}>This certifies that</p>
          <h2 className="text-3xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#2C2C2A' }}>
            {certificate.learnerName}
          </h2>
          <div className="h-px mx-16 mb-4" style={{ background: '#633806' }} />

          <p className="text-sm italic mb-2" style={{ color: '#5F5E5A' }}>has successfully completed</p>
          <h3 className="text-xl font-bold mb-1" style={{ fontFamily: 'Georgia, serif', color: '#633806' }}>
            {certificate.courseTitle}
          </h3>
          <p className="text-xs mb-5" style={{ color: '#5F5E5A' }}>{certificate.descriptionLine}</p>

          <div className="h-px mx-4 mb-5" style={{ background: '#D3D1C7' }} />

          {/* Three-column footer */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs tracking-wider mb-1" style={{ color: '#888780' }}>DATE</p>
              <p className="text-xs font-medium" style={{ color: '#2C2C2A' }}>{dateFormatted}</p>
              <div className="h-px mt-2 mx-2" style={{ background: '#633806' }} />
            </div>
            <div>
              <p className="text-xs tracking-wider mb-1" style={{ color: '#888780' }}>CERTIFICATE ID</p>
              <p className="text-xs font-medium" style={{ color: '#2C2C2A' }}>{certificate.certificateId}</p>
              <div className="h-px mt-2 mx-2" style={{ background: '#633806' }} />
            </div>
            <div>
              <p style={{
                fontFamily: "'Dancing Script', Georgia, cursive",
                fontSize: '1.5rem',
                color: '#2C2C2A',
                letterSpacing: '0.02em',
                lineHeight: 1.2,
                marginBottom: '4px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}>
                Subramaniam P G
              </p>
              <div className="h-px mt-1 mx-2" style={{ background: '#633806' }} />
              <p className="text-xs mt-1" style={{ color: '#5F5E5A', whiteSpace: 'nowrap' }}>Growth Architect | Executive Coach</p>
              <p className="text-xs" style={{ color: '#633806' }}>Embiggen Consulting LLP</p>
            </div>
          </div>
        </div>

        {/* Bottom bars */}
        <div className="h-0.5" style={{ background: '#1D9E75' }} />
        <div className="h-2" style={{ background: '#633806' }} />
      </div>

      {/* Download button */}
      <div className="text-center mt-6">
        <button onClick={downloadPDF}
          className="px-8 py-3 rounded font-medium text-sm"
          style={{ background: '#633806', color: '#FAEEDA' }}>
          Download certificate PDF
        </button>
      </div>
    </div>
  )
}
