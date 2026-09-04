import type { ReviewOutput, ReviewContextSnapshot, SubmittedKR, ScoreTone } from '@/lib/okrAllyReview'
import type { OkrAllySiteSettings } from '@/lib/okrAlly'
import { RUBRIC, scoreTone } from '@/lib/okrAllyReview'
import { getSiteSettings } from '@/lib/okrAlly'
import { REPORT_LOGO_JPEG, REPORT_LOGO_W, REPORT_LOGO_H } from '@/lib/okrAllyReportAssets'
import { putPdf } from '@/lib/okrAllyBlob'
import { markReviewDelivered } from '@/lib/okrAllySubmission'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'
import { tokens, rgb } from '@/lib/okrAllyTokens'
import { type Brand, DEFAULT_BRAND, vocab, scoreBreakdownNote } from '@/lib/okrAllyBrand'

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
  /** Vocabulary + header treatment. Omitted → 'okr_ally' (unchanged). */
  brand?: Brand
}

// Palette — all from lib/okrAllyTokens.ts so the PDF can't drift from the web
// surface. MUTE is the one PDF-only value (a lighter grey that reads better at
// print sizes than the on-screen secondary text colour).
const CHARCOAL = rgb.textPrimary
const BODY = rgb.textSecondary
const MUTE: [number, number, number] = [150, 140, 130]
const EMERALD = rgb.primary
const EMERALD_DARK = rgb.primaryHover
// Score-radar fill + grid — deliberately punchy (see <ScoreInfographic> on the
// web, which uses the identical values so the two surfaces stay in step).
const RADAR_FILL = rgb.radarFill
const RADAR_GRID = rgb.radarGrid
const BROWN = rgb.warning
const RULE = rgb.border
const CREAM = rgb.background
const TONE_RED = rgb.error

/** Band colour for a 0-10 score — mirrors the web report (`scoreTone` is shared). */
function toneRgb(tone: ScoreTone): [number, number, number] {
  return tone === 'low' ? TONE_RED : tone === 'mid' ? BROWN : EMERALD
}

function ctxText(f: ReviewContextSnapshot[keyof ReviewContextSnapshot] | undefined): string {
  const t = (f?.final_text || f?.raw_input || '').trim()
  return t || '(not provided)'
}

/**
 * jsPDF's built-in Helvetica is WinAnsi (cp1252) only. A character outside that
 * set - the rupee sign (U+20B9), arrows, primes, non-breaking hyphens,
 * checkmarks, math glyphs - is not merely dropped: jsPDF mis-measures its
 * width, which throws splitTextToSize's wrap point off AND makes doc.text
 * render the whole line with runaway letter-spacing that overflows the right
 * margin. That is the root cause of the beta "inconsistent paragraph
 * formatting" report (any feedback line quoting a "Rs 1.4 crore" figure, etc.).
 * The web report is unaffected (real fonts), so only the PDF path needs this.
 *
 * Transliterate the common offenders to ASCII, keep the cp1252 "extras" jsPDF
 * can render (en/em dash, ellipsis, curly quotes, bullet, euro, tm), replace
 * anything else outside cp1252 with a space. Same spirit as money()/moneyPdf()
 * in lib/okrAllyInvoice.ts.
 */
const WINANSI_EXTRAS = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160,
  0x2039, 0x0152, 0x017d, 0x2018, 0x2019, 0x201c, 0x201d, 0x2022, 0x2013, 0x2014,
  0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
])
const PDF_CHAR_MAP: Record<string, string> = {
  '→': '->', '←': '<-', '↑': '^', '↓': 'v', '↔': '<->',
  '⇒': '=>', '⇐': '<=', '⇔': '<=>',
  '⟶': '->', '⟵': '<-', '➔': '->', '➙': '->', '➜': '->',
  '′': "'", '″': '"', '‵': "'", '‶': '"',
  '‑': '-', '‒': '-', '―': '-', '−': '-', '⁃': '-',
  '▪': '-', '●': '-', '‣': '-', '‧': '-',
  '≤': '<=', '≥': '>=', '≠': '!=', '≈': '~', '∞': 'infinity',
  '✖': 'x',
  '✓': 'yes', '✔': 'yes', '✅': 'yes',
  '✗': 'no', '✘': 'no', '❌': 'no',
  ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', ' ': ' ', '　': ' ',
  '­': '', '​': '', '‌': '', '‍': '', '﻿': '',
}

/** Make model/user text renderable by jsPDF's WinAnsi standard font. */
export function pdfSafe(input: string | null | undefined): string {
  if (!input) return ''
  const s = input.replace(/\r\n?/g, '\n').replace(/₹\s*/g, 'Rs. ')
  let out = ''
  for (const ch of s) {
    const code = ch.codePointAt(0)!
    if (Object.prototype.hasOwnProperty.call(PDF_CHAR_MAP, ch)) {
      out += PDF_CHAR_MAP[ch]
      continue
    }
    if (code <= 0x7f || (code >= 0xa0 && code <= 0xff)) {
      out += ch
      continue
    }
    if (WINANSI_EXTRAS.has(code)) {
      out += ch
      continue
    }
    if (code < 0xa0) {
      out += ' ' // C0 / C1 control
      continue
    }
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn(`[pdfSafe] replaced unsupported U+${code.toString(16).toUpperCase().padStart(4, '0')}`)
    }
    out += ' '
  }
  return out
}

export async function renderReportPdf(data: ReportData): Promise<Buffer> {
  const v = vocab(data.brand ?? DEFAULT_BRAND)
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

  // Every string that reaches doc.text / splitTextToSize goes through pdfSafe:
  // model- and user-authored text can carry glyphs jsPDF's standard font cannot
  // render, which corrupts wrapping and letter-spacing for the whole line.
  const body = (text: string, indent = 0) => {
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(...BODY)
    for (const l of doc.splitTextToSize(pdfSafe(text), CW - indent) as string[]) {
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
    doc.text(pdfSafe(text), M, y)
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
    doc.text(pdfSafe(text).toUpperCase(), M, y)
    y += 5
  }

  /**
   * The shared score infographic: overall ring (band-coloured) + a 5-axis
   * radar over the rubric criteria + a value legend. Visually matched to the
   * web report's <ScoreInfographic> (colours via the shared scoreTone()).
   * Returns the y after the block.
   */
  const drawScoreInfographic = (startY: number): number => {
    let yy = startY
    const overall = data.review.overall_score
    const oTone = toneRgb(scoreTone(overall))
    const scores = RUBRIC.map((r) => {
      const c = data.review.criteria_scores.find((x) => x.criterion === r.criterion)
      return { criterion: r.criterion, score: c ? c.score : 0, weight: r.weight }
    })

    guard(118)

    // Overall ring + label
    const ringR = 13
    const ringCx = M + ringR
    const ringCy = yy + ringR
    doc.setLineWidth(3.4)
    doc.setLineCap('round')
    doc.setDrawColor(...RULE)
    doc.circle(ringCx, ringCy, ringR, 'S')
    const frac = Math.max(0, Math.min(1, overall / 10))
    if (frac > 0) {
      doc.setDrawColor(...oTone)
      const segs = Math.max(2, Math.round(64 * frac))
      const pts: [number, number][] = []
      for (let i = 0; i <= segs; i++) {
        const a = (-90 + (i / segs) * frac * 360) * (Math.PI / 180)
        pts.push([ringCx + ringR * Math.cos(a), ringCy + ringR * Math.sin(a)])
      }
      for (let i = 1; i < pts.length; i++) doc.line(pts[i - 1][0], pts[i - 1][1], pts[i][0], pts[i][1])
    }
    doc.setLineWidth(0.2)
    doc.setLineCap('butt')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.setTextColor(...oTone)
    doc.text(overall.toFixed(1), ringCx, ringCy + 1.6, { align: 'center' })
    doc.setFontSize(11)
    doc.setTextColor(...CHARCOAL)
    doc.text('Overall score', ringCx + ringR + 6, ringCy - 1)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8.5)
    doc.setTextColor(...MUTE)
    doc.text('Weighted across the five criteria', ringCx + ringR + 6, ringCy + 4)
    yy += ringR * 2 + 10

    // Radar
    const R = 21
    const cx = PW / 2
    const cy = yy + R + 4
    const ang = (i: number) => (-90 + i * 72) * (Math.PI / 180)
    const ptAt = (i: number, rad: number): [number, number] => [cx + rad * Math.cos(ang(i)), cy + rad * Math.sin(ang(i))]

    doc.setDrawColor(...RADAR_GRID)
    for (const level of [2, 4, 6, 8, 10]) {
      const rr = R * (level / 10)
      doc.setLineWidth(level === 10 ? 0.5 : 0.35)
      for (let i = 0; i < 5; i++) {
        const a = ptAt(i, rr)
        const b = ptAt((i + 1) % 5, rr)
        doc.line(a[0], a[1], b[0], b[1])
      }
    }
    doc.setLineWidth(0.35)
    for (let i = 0; i < 5; i++) {
      const o = ptAt(i, R)
      doc.line(cx, cy, o[0], o[1])
    }

    const dataPts = scores.map((s, i) => ptAt(i, R * Math.max(0, Math.min(1, s.score / 10))))
    const rel: [number, number][] = []
    for (let i = 1; i < dataPts.length; i++) {
      rel.push([dataPts[i][0] - dataPts[i - 1][0], dataPts[i][1] - dataPts[i - 1][1]])
    }
    doc.setFillColor(...RADAR_FILL)
    doc.setDrawColor(...EMERALD_DARK)
    doc.setLineWidth(1.4)
    doc.setLineJoin('round')
    doc.lines(rel, dataPts[0][0], dataPts[0][1], [1, 1], 'FD', true)
    doc.setFillColor(...EMERALD_DARK)
    for (const p of dataPts) doc.circle(p[0], p[1], 1.3, 'F')

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7.5)
    doc.setTextColor(...CHARCOAL)
    scores.forEach((s, i) => {
      const lp = ptAt(i, R + 7)
      const cos = Math.cos(ang(i))
      const align: 'left' | 'center' | 'right' = cos > 0.3 ? 'left' : cos < -0.3 ? 'right' : 'center'
      const parts = doc.splitTextToSize(s.criterion, 30) as string[]
      parts.forEach((ln, k) => doc.text(ln, lp[0], lp[1] + k * 3, { align }))
    })
    doc.setFont('helvetica', 'normal')
    doc.setLineJoin('miter')
    yy = cy + R + 12

    // Value legend — criterion name + score only (weights drive the calc but
    // are not shown to the end user).
    guard(6 + scores.length * 6)
    doc.setFontSize(8.5)
    scores.forEach((s) => {
      const tone = toneRgb(scoreTone(s.score))
      doc.setFillColor(...tone)
      doc.circle(M + 1.4, yy - 1.4, 1.4, 'F')
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...CHARCOAL)
      doc.text(s.criterion, M + 6, yy)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...tone)
      doc.text(`${s.score}/10`, PW - M, yy, { align: 'right' })
      yy += 6
    })

    // Caveat directly under the breakdown — the five criteria interact; one edit
    // can move several. Same note as the web report's <ScoreInfographic>.
    yy += 3
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(...MUTE)
    for (const l of doc.splitTextToSize(pdfSafe(scoreBreakdownNote(data.brand ?? DEFAULT_BRAND)), CW) as string[]) {
      doc.text(l, M, yy)
      yy += 4
    }
    doc.setFont('helvetica', 'normal')

    doc.setLineWidth(0.2)
    return yy + 2
  }

  // ── Logo ───────────────────────────────────────────────────
  if ((data.brand ?? DEFAULT_BRAND) === 'okr_ally') {
    const lw = 64
    const lh = (lw * REPORT_LOGO_H) / REPORT_LOGO_W
    doc.addImage(REPORT_LOGO_JPEG, 'JPEG', (PW - lw) / 2, y, lw, lh)
    y += lh + 12
  } else {
    // Goal Ally — a typographic wordmark (no image asset yet). Icon-mark logo
    // to follow in Tier 2.
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(20)
    doc.setTextColor(...EMERALD_DARK)
    doc.text(v.product, PW / 2, y + 6, { align: 'center' })
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTE)
    doc.text('POWERED BY AI', PW / 2, y + 12, { align: 'center' })
    y += 24
  }

  // ── Cover ───────────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...MUTE)
  doc.text(`${v.product.toUpperCase()}  ·  ${v.plan.toUpperCase()} REVIEW`, M, y)
  y += 11

  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...CHARCOAL)
  doc.text(`Your ${v.plan} Review`, M, y)
  y += 11
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...BODY)
  doc.text(pdfSafe(data.userName), M, y)
  y += 6
  doc.text(data.dateText, M, y)
  y += 14

  // ── Score infographic (ring + radar + legend) ───────────────
  y = drawScoreInfographic(y)
  y += 4

  // ── Submitted plan (verbatim) ──────────────────────────────
  heading(`Your ${v.plan}, as submitted`)
  subLabel(v.objective)
  body(data.objective)
  y += 3
  subLabel(v.krPlural)
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

  // Per-criterion scores are shown in the infographic legend above; the
  // per-criterion rationale is intentionally not shown to the end user.

  // ── Feedback ────────────────────────────────────────────────
  heading(`${v.objective} feedback`)
  subLabel('What works')
  body(data.review.objective_feedback.what_works)
  y += 2
  subLabel('What to improve')
  body(data.review.objective_feedback.what_to_improve)

  heading(`${v.kr} feedback`)
  data.review.key_result_feedback.forEach((f) => {
    guard(14)
    doc.setFontSize(10.5)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...CHARCOAL)
    for (const l of doc.splitTextToSize(pdfSafe(f.kr_reference), CW) as string[]) {
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
    heading(`Suggested ${v.plan} — ${opt.label}`)
    subLabel(v.objective)
    body(opt.objective)
    y += 2
    subLabel(v.krPlural)
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
  brand?: Brand
}): Promise<{ pdfUrl: string | null; emailed: boolean }> {
  let pdfUrl: string | null = null
  let emailed = false
  const brand = args.brand ?? DEFAULT_BRAND
  const v = vocab(brand)
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
      brand,
    })

    pdfUrl = await putPdf(`reports/${args.submissionId}.pdf`, pdf)

    try {
      emailed = await sendBrevoEmail({
        to: args.userEmail,
        toName: args.userName,
        subject: `Your ${v.product} review`,
        htmlContent: `
          <div style="font-family:Inter,Arial,sans-serif;color:${tokens.textPrimary};line-height:1.6;">
            <p>Your ${v.planLower} review is ready — the full report is attached as a PDF.</p>
            <p>Overall score: <strong>${args.review.overall_score.toFixed(1)} / 10</strong>. It includes the score breakdown, feedback on your ${v.objective} and each ${v.kr}, and two suggested rewrites.</p>
            <p style="font-size:13px;color:${tokens.textSecondary};">This review reflects the quality of the context you provided.</p>
          </div>`,
        textContent:
          `Your ${v.planLower} review is ready (attached, PDF). Overall score ${args.review.overall_score.toFixed(1)}/10. ` +
          `Includes the score breakdown, ${v.objective} + ${v.kr} feedback, and two suggested rewrites.`,
        attachments: [{ name: `${v.plan.replace(/\s+/g, '-')}-Review-${args.submissionId.slice(0, 8)}.pdf`, content: pdf.toString('base64') }],
        // Delivering the review is not a payment event — PGS is not copied.
        // (The ₹0 free-review invoice, sent separately, still BCCs him.)
        skipBcc: true,
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
