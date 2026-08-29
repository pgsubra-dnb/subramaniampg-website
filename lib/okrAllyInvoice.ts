import type { PoolClient } from 'pg'
import { withTransaction, getSiteSettings } from '@/lib/okrAlly'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { putPdf } from '@/lib/okrAllyBlob'
import { GST_STATES, stateCode, stateCodeFromGstin } from '@/lib/indiaGstStates'

/**
 * OKR Ally GST invoice generation (build sequence step 5).
 *
 * - One invoice per Razorpay payment, numbered OKR/YY-MM/XXXX, sequential
 *   within the calendar month via an atomic counter (invoice_counters) — the
 *   same race-safe INSERT ... ON CONFLICT DO UPDATE approach as credit
 *   deduction (design doc section 3).
 * - Supplier details are snapshotted from Sanity okrAllySettings onto the row,
 *   so historical invoices stay accurate if those details change later.
 * - Tax total is always 18% of base; the split is CGST+SGST when the buyer is
 *   in the supplier's state, IGST otherwise.
 * - PDF is rendered server-side with jsPDF and emailed as a Brevo attachment.
 *   Persisting it to Vercel Blob (invoices.pdf_url) is deferred until Blob is
 *   provisioned; downloads regenerate from the row (the row is the source of
 *   truth, not the file).
 */

export interface InvoiceRow {
  id: string
  user_id: string
  razorpay_payment_id: string
  invoice_number: string
  gstin: string | null
  base_amount: string
  gst_amount: string
  total_amount: string
  place_of_supply: string
  cgst_amount: string | null
  sgst_amount: string | null
  igst_amount: string | null
  supplier_name: string
  supplier_gstin: string
  supplier_pan: string
  supplier_address: string
  supplier_sac_code: string | null
  pdf_url: string | null
  created_at: string
}

export interface CreateInvoiceInput {
  userId: string
  razorpayPaymentId: string
  /** INR, from lib/okrAllyBilling gstBreakdown — base excl. GST. */
  baseAmount: number
  gstAmount: number
  totalAmount: number
  /** Buyer's GSTIN if they supplied one at checkout (optional). */
  buyerGstin: string | null
  /** Buyer's state — the mandatory checkout dropdown value (name or 2-digit code). */
  placeOfSupply: string
  buyerName: string
  buyerEmail: string
}

export type CreateInvoiceResult =
  | { ok: true; created: boolean; invoice: InvoiceRow }
  | { ok: false; reason: 'supplier-not-configured' | 'invalid-place-of-supply' | 'error' }

function ym(date: Date): string {
  const yy = String(date.getUTCFullYear()).slice(-2)
  const mm = String(date.getUTCMonth() + 1).padStart(2, '0')
  return `${yy}-${mm}`
}

/** Atomic per-month invoice sequence. Mirrors the invoice_counters comment in the schema. */
async function nextInvoiceNumber(client: PoolClient, yearMonth: string): Promise<string> {
  const res = await client.query<{ last_number: number }>(
    `INSERT INTO invoice_counters (year_month, last_number)
     VALUES ($1, 1)
     ON CONFLICT (year_month)
     DO UPDATE SET last_number = invoice_counters.last_number + 1
     RETURNING last_number`,
    [yearMonth]
  )
  const n = String(res.rows[0].last_number).padStart(4, '0')
  return `OKR/${yearMonth}/${n}`
}

interface TaxSplit {
  cgst: number | null
  sgst: number | null
  igst: number | null
}

function computeTaxSplit(
  gstAmount: number,
  buyerStateCode: string | null,
  supplierStateCode: string | null
): TaxSplit {
  if (buyerStateCode && supplierStateCode && buyerStateCode === supplierStateCode) {
    const cgst = Math.round((gstAmount / 2) * 100) / 100
    return { cgst, sgst: Math.round((gstAmount - cgst) * 100) / 100, igst: null }
  }
  return { cgst: null, sgst: null, igst: gstAmount }
}

const amount = (v: number | string) =>
  Number(v).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** Currency for the emailed invoice (HTML/text) — the real ₹ symbol. */
const money = (v: number | string) => `₹${amount(v)}`

/**
 * Currency for the rendered PDF — deliberately "Rs." not "₹".
 *
 * jsPDF's built-in Helvetica uses WinAnsi encoding, which has no glyph for
 * U+20B9 (₹); it renders as a stray superscript. The emailed invoice keeps the
 * real ₹ (via money() above) because HTML has no such font limitation. This
 * PDF-vs-email divergence is intentional — do NOT "unify" the PDF back to ₹
 * without first embedding a Unicode font that actually has the glyph.
 */
const moneyPdf = (v: number | string) => `Rs. ${amount(v)}`

/** Render the invoice as a base64-encoded PDF (A4, jsPDF — same conventions as app/assessment/page.tsx). */
export async function renderInvoicePdf(
  inv: InvoiceRow,
  buyer: { name: string; email: string }
): Promise<string> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const M = 18
  const PW = doc.internal.pageSize.getWidth()
  let y = 20

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('TAX INVOICE', M, y)
  doc.setFontSize(10)
  doc.text(inv.invoice_number, PW - M, y, { align: 'right' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(
    `Date: ${new Date(inv.created_at).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })}`,
    PW - M,
    y,
    { align: 'right' }
  )
  y += 8

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(inv.supplier_name, M, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  ;(doc.splitTextToSize(inv.supplier_address, PW - 2 * M) as string[]).forEach((line) => {
    doc.text(line, M, y)
    y += 4.5
  })
  doc.text(`GSTIN: ${inv.supplier_gstin}    PAN: ${inv.supplier_pan}`, M, y)
  y += 4.5
  if (inv.supplier_sac_code) {
    doc.text(`SAC: ${inv.supplier_sac_code}`, M, y)
    y += 4.5
  }
  y += 4

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('Bill to', M, y)
  y += 5
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text(buyer.name, M, y)
  y += 4.5
  doc.text(buyer.email, M, y)
  y += 4.5
  if (inv.gstin) {
    doc.text(`GSTIN: ${inv.gstin}`, M, y)
    y += 4.5
  }
  doc.text(`Place of supply: ${inv.place_of_supply}`, M, y)
  y += 8

  const rows: [string, string][] = [
    [
      `OKR Ally — OKR review credits${inv.supplier_sac_code ? ` (SAC ${inv.supplier_sac_code})` : ''}`,
      moneyPdf(inv.base_amount),
    ],
  ]
  if (inv.igst_amount != null) {
    rows.push(['IGST @ 18%', moneyPdf(inv.igst_amount)])
  } else {
    rows.push(['CGST @ 9%', moneyPdf(inv.cgst_amount ?? 0)])
    rows.push(['SGST @ 9%', moneyPdf(inv.sgst_amount ?? 0)])
  }

  doc.setDrawColor(200)
  doc.line(M, y, PW - M, y)
  y += 6
  doc.setFontSize(10)
  for (const [label, value] of rows) {
    doc.setFont('helvetica', 'normal')
    doc.text(label, M, y)
    doc.text(value, PW - M, y, { align: 'right' })
    y += 6
  }
  doc.line(M, y, PW - M, y)
  y += 7
  doc.setFont('helvetica', 'bold')
  doc.text('Total', M, y)
  doc.text(moneyPdf(inv.total_amount), PW - M, y, { align: 'right' })
  y += 14

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(110)
  doc.text('This is a system-generated invoice and does not require a signature.', M, y)
  y += 4
  doc.text('subramaniampg.guru  |  pgs@embiggen.co.in', M, y)

  return Buffer.from(doc.output('arraybuffer')).toString('base64')
}

/** One invoice by id, scoped to its owner (for the authenticated download route). */
export async function getInvoiceForUser(invoiceId: string, userId: string): Promise<InvoiceRow | null> {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!UUID_RE.test(invoiceId)) return null
  return withTransaction(async (client) => {
    const r = await client.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE id = $1 AND user_id = $2`,
      [invoiceId, userId]
    )
    return r.rows[0] ?? null
  })
}

async function fetchInvoiceByPayment(paymentId: string): Promise<InvoiceRow | null> {
  return withTransaction(async (client) => {
    const r = await client.query<InvoiceRow>(
      `SELECT * FROM invoices WHERE razorpay_payment_id = $1`,
      [paymentId]
    )
    return r.rows[0] ?? null
  })
}

/**
 * Create the invoice for a payment (idempotent on razorpay_payment_id) and
 * email the PDF to the buyer. Never throws — a config problem returns a soft
 * failure so the caller's payment confirmation still succeeds; the credits are
 * already granted and PGS can backfill the invoice.
 */
export async function createAndSendInvoice(input: CreateInvoiceInput): Promise<CreateInvoiceResult> {
  try {
    const settings = await getSiteSettings()
    if (
      !settings.legalBusinessName ||
      !settings.supplierGstin ||
      !settings.supplierPan ||
      !settings.registeredAddress
    ) {
      console.error('OKR Ally invoice: supplier details not configured in okrAllySettings')
      return { ok: false, reason: 'supplier-not-configured' }
    }

    const placeCode = stateCode(input.placeOfSupply)
    const resolvedPlace = placeCode
      ? GST_STATES.find((s) => s.code === placeCode)!.name
      : null
    if (!resolvedPlace) {
      console.error('OKR Ally invoice: invalid place of supply', input.placeOfSupply)
      return { ok: false, reason: 'invalid-place-of-supply' }
    }

    const buyerStateCode = input.buyerGstin ? stateCodeFromGstin(input.buyerGstin) : placeCode
    const supplierStateCode = stateCodeFromGstin(settings.supplierGstin)
    const split = computeTaxSplit(input.gstAmount, buyerStateCode, supplierStateCode)

    const existing = await fetchInvoiceByPayment(input.razorpayPaymentId)
    if (existing) return { ok: true, created: false, invoice: existing }

    let row: InvoiceRow
    let created = true
    try {
      row = await withTransaction<InvoiceRow>(async (client) => {
        // Serialise invoice creation per payment so a verify-payment/webhook
        // race cannot both pass the existence check and burn two counter
        // numbers. The lock releases at COMMIT/ROLLBACK.
        await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [
          `okr-ally-invoice:${input.razorpayPaymentId}`,
        ])
        const dup = await client.query<InvoiceRow>(
          `SELECT * FROM invoices WHERE razorpay_payment_id = $1`,
          [input.razorpayPaymentId]
        )
        if (dup.rows[0]) {
          created = false
          return dup.rows[0]
        }

        const number = await nextInvoiceNumber(client, ym(new Date()))
        const inserted = await client.query<InvoiceRow>(
          `INSERT INTO invoices (
             user_id, razorpay_payment_id, invoice_number, gstin,
             base_amount, gst_amount, total_amount, place_of_supply,
             cgst_amount, sgst_amount, igst_amount,
             supplier_name, supplier_gstin, supplier_pan, supplier_address, supplier_sac_code
           ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
           RETURNING *`,
          [
            input.userId,
            input.razorpayPaymentId,
            number,
            input.buyerGstin,
            input.baseAmount,
            input.gstAmount,
            input.totalAmount,
            resolvedPlace,
            split.cgst,
            split.sgst,
            split.igst,
            settings.legalBusinessName,
            settings.supplierGstin,
            settings.supplierPan,
            settings.registeredAddress,
            settings.supplierSacCode,
          ]
        )
        return inserted.rows[0]
      })
    } catch (err: unknown) {
      // 23505 = verify-payment and the webhook raced; the other one won.
      if (typeof err === 'object' && err && (err as { code?: string }).code === '23505') {
        const won = await fetchInvoiceByPayment(input.razorpayPaymentId)
        if (won) return { ok: true, created: false, invoice: won }
      }
      throw err
    }

    if (!created) return { ok: true, created: false, invoice: row }

    try {
      const pdfBase64 = await renderInvoicePdf(row, { name: input.buyerName, email: input.buyerEmail })

      // Store to Vercel Blob (step 7 — same store as the review report). Best
      // effort; the download route regenerates from the row if pdf_url is null.
      const blobUrl = await putPdf(
        `invoices/${row.invoice_number.replace(/\//g, '-')}.pdf`,
        Buffer.from(pdfBase64, 'base64')
      )
      if (blobUrl) {
        await withTransaction((client) =>
          client.query('UPDATE invoices SET pdf_url = $2 WHERE id = $1', [row.id, blobUrl])
        )
        row.pdf_url = blobUrl
      }

      await sendBrevoEmail({
        to: input.buyerEmail,
        toName: input.buyerName,
        subject: `GST invoice ${row.invoice_number} — OKR Ally`,
        htmlContent: `
          <div style="font-family:Inter,Arial,sans-serif;color:#2C2C2A;line-height:1.6;">
            <p>Your GST invoice <strong>${row.invoice_number}</strong> for your OKR Ally purchase is attached (PDF).</p>
            <p>Amount: <strong>${money(row.total_amount)}</strong> (incl. GST). Place of supply: ${row.place_of_supply}.</p>
            <p style="font-size:13px;color:#6b6b66;">This is a system-generated invoice and does not require a signature.</p>
            <p style="font-size:13px;color:#6b6b66;">${settings.legalBusinessName}</p>
          </div>`,
        textContent:
          `Your GST invoice ${row.invoice_number} for your OKR Ally purchase is attached (PDF). ` +
          `Amount: ${money(row.total_amount)} (incl. GST). ` +
          `This is a system-generated invoice and does not require a signature.`,
        attachments: [{ name: `${row.invoice_number.replace(/\//g, '-')}.pdf`, content: pdfBase64 }],
      })
    } catch (mailErr) {
      console.error('OKR Ally invoice: row created but PDF/email failed', mailErr)
    }

    return { ok: true, created: true, invoice: row }
  } catch (err) {
    console.error('OKR Ally createAndSendInvoice error:', err)
    return { ok: false, reason: 'error' }
  }
}
