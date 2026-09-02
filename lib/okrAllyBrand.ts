/**
 * Brand surfaces for the review app.
 *
 * `/okr-ally` and `/goal-ally` are the SAME product — same backend, database,
 * credit system, auth and admin tooling. They differ only in presentation and
 * in the natural-language vocabulary the UI and the AI use:
 *
 *   Objective    → Goal
 *   Key Result   → Sub-goal   (short form too — no "KR")
 *   OKR          → Goal Plan
 *   OKR Ally     → Goal Ally
 *
 * This is a vocabulary layer, not a data change. Database columns
 * (`submissions.objective`, `krs`, `context_snapshot.*`) and the review tool
 * schema's JSON keys (`objective`, `key_results`, `kr_feedback`, …) are
 * IDENTICAL across brands. Only the words a human or the model reads change.
 *
 * `submissions.brand` records which surface a submission came through, for
 * analytics only.
 */

export type Brand = 'okr_ally' | 'goal_ally'

export const BRANDS: Brand[] = ['okr_ally', 'goal_ally']
export const DEFAULT_BRAND: Brand = 'okr_ally'

export function isBrand(x: unknown): x is Brand {
  return x === 'okr_ally' || x === 'goal_ally'
}

/** Coerce anything (a request body field, a query param) to a valid Brand. */
export function toBrand(x: unknown): Brand {
  return isBrand(x) ? x : DEFAULT_BRAND
}

/** Which brand a request path belongs to. `/goal-ally`, `/goal-ally/corporate`,
 *  `/api/goal-ally/*` → 'goal_ally'; everything else → 'okr_ally'. */
export function brandFromPath(pathname: string | null | undefined): Brand {
  return pathname && /(^|\/)goal-ally(\/|$)/.test(pathname) ? 'goal_ally' : 'okr_ally'
}

export interface BrandVocab {
  /** 'okr_ally' | 'goal_ally' — echoed where code needs the key. */
  key: Brand
  /** Product name, e.g. "OKR Ally". */
  product: string
  /** Route base without a trailing slash, e.g. "/okr-ally". */
  path: string
  /** Logo / wordmark image for the app header and PDF. */
  logo: string
  /** The single-outcome statement — "Objective" / "Goal". */
  objective: string
  objectiveLower: string
  /** A measurable result — "Key Result" / "Sub-goal". */
  kr: string
  krLower: string
  /** Plural — "Key Results" / "Sub-goals". */
  krPlural: string
  /** Short form for tight UI and model references — "KR" / "Sub-goal". */
  krShort: string
  /** Plural short form — "KRs" / "Sub-goals". */
  krShortPlural: string
  /** The whole artifact (Objective + its Key Results) — "OKR" / "Goal Plan". */
  plan: string
  planLower: string
  /** Plural of `plan`, with the historical casing — "OKRs" / "Goal Plans". */
  planPlural: string
}

const OKR_ALLY: BrandVocab = {
  key: 'okr_ally',
  product: 'OKR Ally',
  path: '/okr-ally',
  logo: '/okr-ally/report-logo.jpg',
  objective: 'Objective',
  objectiveLower: 'objective',
  kr: 'Key Result',
  krLower: 'key result',
  krPlural: 'Key Results',
  krShort: 'KR',
  krShortPlural: 'KRs',
  plan: 'OKR',
  planLower: 'OKR',
  planPlural: 'OKRs',
}

const GOAL_ALLY: BrandVocab = {
  key: 'goal_ally',
  product: 'Goal Ally',
  path: '/goal-ally',
  logo: '/goal-ally/report-logo.png',
  objective: 'Goal',
  objectiveLower: 'goal',
  kr: 'Sub-goal',
  krLower: 'sub-goal',
  krPlural: 'Sub-goals',
  krShort: 'Sub-goal',
  krShortPlural: 'Sub-goals',
  plan: 'Goal Plan',
  planLower: 'goal plan',
  planPlural: 'Goal Plans',
}

export const VOCAB: Record<Brand, BrandVocab> = {
  okr_ally: OKR_ALLY,
  goal_ally: GOAL_ALLY,
}

/** Vocabulary for a brand. `vocab()` with no argument is the default (OKR Ally). */
export function vocab(brand: Brand = DEFAULT_BRAND): BrandVocab {
  return VOCAB[brand]
}
