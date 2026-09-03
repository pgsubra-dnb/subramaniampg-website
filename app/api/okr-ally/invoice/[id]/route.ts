import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser, query } from '@/lib/okrAlly'
import { getInvoiceForUser, renderInvoicePdf } from '@/lib/okrAllyInvoice'
import { getPdfBytes } from '@/lib/okrAllyBlob'
import { toBrand, vocab } from '@/lib/okrAllyBrand'

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
    // Regenerating from the row (stored Blob missing). serviceLabel isn't
    // persisted, so reconstruct the free-review label from the submission's
    // brand — otherwise a Goal Ally invoice would regenerate with OKR Ally
    // wording. Paid / corporate / consulting invoices keep their own defaults.
    let serviceLabel: string | undefined
    if (invoice.submission_id && Number(invoice.total_amount) === 0) {
      const b = await query<{ brand: string | null }>(
        `SELECT brand FROM submissions WHERE id = $1`,
        [invoice.submission_id]
      )
      const brand = toBrand(b.rows[0]?.brand)
      if (brand === 'goal_ally') {
        serviceLabel = `${vocab(brand).product} — ${vocab(brand).reviews}`
      }
    }
    const pdfBase64 = await renderInvoicePdf(invoice, { name: user.name, email: user.email }, serviceLabel)
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
