/**
 * OKR Ally / Goal Ally — semantic colour tokens.
 *
 * The single source of truth for every colour on the product surface
 * (`app/okr-ally/**`, `app/goal-ally/**`, and the server-rendered review PDF,
 * GST invoice and transactional emails). Plain values — no `next/font`, no
 * `'use client'` — so a server route can import it too.
 *
 * This is NOT a rebrand. The palette is exactly the emerald / cream / charcoal
 * / gold from `Scripts/okr-ally/okr-ally-ui-mockup.html`; this file only gives
 * it named roles and fills in the four state colours (success / warning / error
 * / info) that were previously expressed ad hoc. There is deliberately no blue.
 *
 * `app/okr-ally/_ui.tsx` re-exports these as `T`, keeping its historical key
 * names (`T.emerald`, `T.charcoal`, …) as aliases so existing call sites keep
 * working; new code should prefer the semantic names.
 */
export const tokens = {
  // ── Brand / primary ──────────────────────────────────────────
  /** Emerald — primary actions, active states, the Ally identity. */
  primary: '#1D9E75',
  /** Darker emerald — hover/pressed, and primary-coloured text on light grounds. */
  primaryHover: '#0F6E56',
  /** Pale emerald wash — Ally speech bubbles, selected rows, subtle fills. */
  primaryLight: '#E1F5EE',
  /** Border companion to `primaryLight`. */
  primaryBorder: '#CDEBE0',
  /** Readable ink for text sitting on `primaryLight`. */
  primaryContrast: '#0D3D2F',

  // ── Text ─────────────────────────────────────────────────────
  /** Charcoal — headings and body copy. */
  textPrimary: '#2C2C2A',
  /** Warm grey — secondary copy, captions, metadata. */
  textSecondary: '#5F5E5A',

  // ── Surfaces ─────────────────────────────────────────────────
  /** Cream — the page ground. */
  background: '#FAF8F5',
  /** White — cards, inputs, raised surfaces. */
  surface: '#FFFFFF',
  /** Hairline — dividers, input and card borders. */
  border: '#E8E4DC',

  // ── State: success ───────────────────────────────────────────
  success: '#1B7F63',
  successLight: '#E1F5EE',
  successBorder: '#CDEBE0',

  // ── State: warning (the existing gold) ───────────────────────
  warning: '#633806',
  warningLight: '#FAEEDA',
  warningBorder: '#EAD9B0',

  // ── State: error ─────────────────────────────────────────────
  error: '#B91C1C',
  errorLight: '#FEF2F2',
  errorBorder: '#FECACA',

  // ── State: info (neutral — intentionally not blue) ───────────
  info: '#4A4A46',
  infoLight: '#F1EEE9',
  infoBorder: '#E0DACE',

  // ── Fixed ────────────────────────────────────────────────────
  /** Text/icons on a `primary`-filled ground. */
  onPrimary: '#FFFFFF',
} as const

export type TokenName = keyof typeof tokens

/** `#RRGGBB` → `[r, g, b]`, for jsPDF's `setTextColor(...)` / `setFillColor(...)`. */
export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]
}

/** Score-radar treatment, shared verbatim between the on-screen infographic
 *  (`_ui.tsx`) and the generated PDF (`lib/okrAllyReport.ts`). */
export const dataViz = {
  radarFill: '#9FD9C7',
  radarGrid: '#B8B1A3',
} as const

/** The same palette as RGB tuples — the generated review PDF (`lib/okrAllyReport.ts`)
 *  draws with jsPDF, which takes component values, not hex. */
export const rgb = {
  textPrimary: hexToRgb(tokens.textPrimary),
  textSecondary: hexToRgb(tokens.textSecondary),
  primary: hexToRgb(tokens.primary),
  primaryHover: hexToRgb(tokens.primaryHover),
  warning: hexToRgb(tokens.warning),
  warningLight: hexToRgb(tokens.warningLight),
  error: hexToRgb(tokens.error),
  border: hexToRgb(tokens.border),
  background: hexToRgb(tokens.background),
  radarFill: hexToRgb(dataViz.radarFill),
  radarGrid: hexToRgb(dataViz.radarGrid),
} as const
