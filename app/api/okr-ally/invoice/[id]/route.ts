import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getInvoiceForUser, renderInvoicePdf } from '@/lib/okrAllyInvoice'
import { getPdfBytes } from '@/lib/okrAllyBlob'

export const dynamic = 'force-dynamic'

/**
 * Download a GST invoice PDF (History / Pricing tabs). Serves the stored Blob
 * when present, otherwise regenerates from the `invoices` row — the row is the
 * source of truth (supplier details are snapshotted onto it).
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getSessionUser(req)
  if (!user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const invoice = await getInvoiceForUser(params.id, user.id)
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  let bytes: Buffer | null = invoice.pdf_url ? await getPdfBytes(invoice.pdf_url) : null
  if (!bytes) {
    const pdfBase64 = await renderInvoicePdf(invoice, { name: user.name, email: user.email })
    bytes = Buffer.from(pdfBase64, 'base64')
  }

  return new NextResponse(new Uint8Array(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${invoice.invoice_number.replace(/\//g, '-')}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
