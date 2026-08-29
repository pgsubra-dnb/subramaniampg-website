import type { ReviewOutput, ReviewContextSnapshot, SubmittedKR } from '@/lib/okrAllyReview'
import type { OkrAllySiteSettings } from '@/lib/okrAlly'
import { RUBRIC } from '@/lib/okrAllyReview'
import { getSiteSettings } from '@/lib/okrAlly'
import { putPdf } from '@/lib/okrAllyBlob'
import { markReviewDelivered } from '@/lib/okrAllySubmission'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

/**
 * OKR Ally review report PDF (build sequence step 7).
 *
 * jsPDF, A4, same layout conventions as app/assessment/page.tsx (portrait/mm,
 * helvetica, the site's cream/charcoal/emerald/brown palette, page-guarded
 * flowing sections, footer with page numbers). Runs server-side (bytes for
 * Blob + Brevo attachment); the same builder can be imported client-side for
 * an instant `doc.save()` on the report screen.
 *
 * The Objective, Key Results and context are printed verbatim from the stored
 * submission — never regenerated or rephrased (design doc "Verbatim
 * reproduction").
 */

export interface ReportData {
  userName: string
  dateText: string
  objective: string
  krs: SubmittedKR[]
  contextSnapshot: ReviewContextSnapshot
  review: ReviewOutput
  settings: OkrAllySiteSettings
}

const CHARCOAL: [number, number, number] = [44, 44, 42]
const BODY: [number, number, number] = [95, 94, 90]
const MUTE: [number, number, number] = [150, 140, 130]
const EMERALD: [number, number, number] = [29, 158, 117]
const BROWN: [number, number, number] = [99, 56, 6]
const RULE: [number, number, number] = [232, 228, 220]
const CREAM: [number, number, number] = [250, 248, 245]

function ctxText(f: ReviewContextSnapshot[keyof ReviewContextSnapshot] | undefined): string {
  const t = (f?.final_text || f?.raw_input || '').trim()
  return t || '(not provided)'
}

export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

  const PW = 210
  const M = 20
  const CW = PW - 2 * M
  let y = 24

  const addFooter = () => {
    const n = doc.getNumberOfPages()
    const links = [data.settings.substackUrl, data.settings.linkedinUrl].filter(Boolean)
    for (let i = 1; i <= n; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(...MUTE)
      doc.text('subramaniampg.guru  |  pgs@embiggen.co.in', M, 290)
      doc.text(`${i} / ${n}`, PW - M, 290, { align: 'right' })
      if (links.length) doc.text(links.join('   '), M, 285)
    }
  }

  const guard = (need: number) => {
    if (y + need > 278) {
      doc.addPage()
      y = 20
    }
  }

  const body = (text: string, indent = 0) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BODY)
    for (const l of doc.splitTextToSize(text, CW - indent) as string[]) {
      guard(6)
      doc.text(l, M + indent, y)
      y += 5.5
    }
  }

  const heading = (text: string) => {
    guard(20)
    y += 4
    doc.setFontSize(13)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...CHARCOAL)
    doc.text(text, M, y)
    y += 3
    doc.setDrawColor(...RULE)
    doc.line(M, y, PW - M, y)
    y += 7
  }

  const subLabel = (text: string) => {
    guard(9)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BROWN)
    doc.text(text.toUpperCase(), M, y)
    y += 5
  }

  // ── Cover ───────────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTE)
  doc.text('OKR ALLY  ·  OKR REVIEW', M, y)
  y += 11

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...CHARCOAL)
  doc.text('Your OKR Review', M, y)
  y += 11
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BODY)
  doc.text(data.userName, M, y)
  y += 6
  doc.text(data.dateText, M, y)
  y += 12

  doc.setFillColor(...EMERALD)
  doc.roundedRect(M, y, 74, 20, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(255, 255, 255)
  doc.text('OVERALL SCORE', M + 6, y + 8)
  doc.setFontSize(16)
  doc.text(`${data.review.overall_score.toFixed(1)} / 10`, M + 6, y + 16)
  doc.setTextColor(...CHARCOAL)
  y += 30

  // ── Submitted OKR (verbatim) ────────────────────────────────
  heading('Your OKR, as submitted')
  subLabel('Objective')
  body(data.objective)
  y += 3
  subLabel('Key Results')
  data.krs.forEach((kr, i) => {
    body(`${i + 1}. ${kr.text}`)
    for (const it of kr.initiatives || []) body(`– ${it}`, 6)
    y += 1
  })

  // ── Context (verbatim) ──────────────────────────────────────
  heading('Context you provided')
  subLabel('Company')
  body(ctxText(data.contextSnapshot.company_context))
  y += 2
  subLabel('Business')
  body(ctxText(data.contextSnapshot.business_context))
  y += 2
  subLabel('Your role')
  body(ctxText(data.contextSnapshot.role_context))

  // ── Score breakdown ─────────────────────────────────────────
  heading('Score breakdown')
  for (const c of data.review.criteria_scores) {
    const weight = RUBRIC.find((r) => r.criterion === c.criterion)?.weight ?? c.weight
    guard(12)
    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...CHARCOAL)
    doc.text(`${c.criterion} — ${c.score}/10  (${Math.round(weight * 100)}%)`, M, y)
    y += 5.5
    body(c.rationale)
    y += 3
  }

  // ── Feedback ────────────────────────────────────────────────
  heading('Objective feedback')
  subLabel('What works')
  body(data.review.objective_feedback.what_works)
  y += 2
  subLabel('What to improve')
  body(data.review.objective_feedback.what_to_improve)

  heading('Key Result feedback')
  data.review.key_result_feedback.forEach((f) => {
    guard(14)
    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...CHARCOAL)
    for (const l of doc.splitTextToSize(f.kr_reference, CW) as string[]) {
      guard(6)
      doc.text(l, M, y)
      y += 5.5
    }
    subLabel('What works')
    body(f.what_works)
    subLabel('What to improve')
    body(f.what_to_improve)
    y += 3
  })

  // ── Suggested options ───────────────────────────────────────
  for (const opt of data.review.suggested_okr_options) {
    heading(`Suggested OKR — ${opt.label}`)
    subLabel('Objective')
    body(opt.objective)
    y += 2
    subLabel('Key Results')
    opt.key_results.forEach((kr, i) => {
      body(`${i + 1}. ${kr.text}   [${kr.status}]`)
      for (const it of kr.initiatives || []) body(`– ${it.action}  (${it.owning_team})`, 6)
      y += 1
    })
    y += 2
    subLabel('Why')
    body(opt.rationale)
  }

  // ── Caution note ────────────────────────────────────────────
  guard(24)
  y += 4
  doc.setFillColor(...CREAM)
  doc.roundedRect(M, y, CW, 18, 3, 3, 'F')
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BROWN)
  doc.text(
    doc.splitTextToSize(
      'This review reflects the quality of the context you provided. Thin or vague context produces a thinner review — revisit your inputs if the feedback feels generic.',
      CW - 10
    ) as string[],
    M + 5,
    y + 6
  )
  y += 24

  // ── Booking prompt ──────────────────────────────────────────
  const booking = data.settings.okrAllyBookingUrl
  if (booking) {
    guard(16)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...BROWN)
    doc.text(`Talk it through with PGS: ${booking}`, M, y)
    y += 8
  }

  addFooter()
  return Buffer.from(doc.output('arraybuffer'))
}

export function reportDateText(d: Date = new Date()): string {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
}

/**
 * Render the report, store it to Blob, and email it to the user. Best-effort —
 * a failure here never fails the review (it is already persisted); the report
 * screen and the download route regenerate from the row if pdf_url is null.
 * Returns what was actually achieved so the caller can surface it.
 */
export async function generateStoreAndEmailReport(args: {
  reviewId: string
  submissionId: string
  userName: string
  userEmail: string
  objective: string
  krs: SubmittedKR[]
  contextSnapshot: ReviewContextSnapshot
  review: ReviewOutput
}): Promise<{ pdfUrl: string | null; emailed: boolean }> {
  let pdfUrl: string | null = null
  let emailed = false
  try {
    const settings = await getSiteSettings()
    const pdf = await renderReportPdf({
      userName: args.userName,
      dateText: reportDateText(),
      objective: args.objective,
      krs: args.krs,
      contextSnapshot: args.contextSnapshot,
      review: args.review,
      settings,
    })

    pdfUrl = await putPdf(`reports/${args.submissionId}.pdf`, pdf)

    try {
      emailed = await sendBrevoEmail({
        to: args.userEmail,
        toName: args.userName,
        subject: 'Your OKR Ally review',
        htmlContent: `
          <div style="font-family:Inter,Arial,sans-serif;color:#2C2C2A;line-height:1.6;">
            <p>Your OKR review is ready — the full report is attached as a PDF.</p>
            <p>Overall score: <strong>${args.review.overall_score.toFixed(1)} / 10</strong>. It includes the score breakdown, feedback on your Objective and each Key Result, and two suggested rewrites.</p>
            <p style="font-size:13px;color:#6b6b66;">This review reflects the quality of the context you provided.</p>
          </div>`,
        textContent:
          `Your OKR review is ready (attached, PDF). Overall score ${args.review.overall_score.toFixed(1)}/10. ` +
          `Includes the score breakdown, Objective + Key Result feedback, and two suggested rewrites.`,
        attachments: [{ name: `OKR-Review-${args.submissionId.slice(0, 8)}.pdf`, content: pdf.toString('base64') }],
      })
    } catch (mailErr) {
      console.error('OKR Ally report: email failed', args.submissionId, mailErr)
    }

    await markReviewDelivered({ reviewId: args.reviewId, pdfUrl, emailSent: emailed })
  } catch (err) {
    console.error('OKR Ally report: generateStoreAndEmailReport failed', args.submissionId, err)
  }
  return { pdfUrl, emailed }
}
