/**
 * Metrics CSV export — flattens one suggested-option (Refined Original or
 * Fresh Rewrite) into a CSV of the metric/from/to/period behind each KR and
 * each initiative under it. No CSV library is installed and none of the
 * sizes here justify one (repo house style — raw fetch/serializers over
 * small deps, see lib/okrAllyReview.ts's header comment).
 */

import { type Brand, vocab } from '@/lib/okrAllyBrand'
import type { SuggestedOkrOption } from '@/lib/okrAllyReview'

const HEADERS = ['Type', '#', 'Text', 'Metric', 'From', 'To', 'Period', 'Owning team']

function csvField(value: string | undefined | null): string {
  // Reviews stored before the metric fields existed have no metric_name/
  // from_value/to_value/period on their KRs or initiatives at all — treat
  // that as an intentional blank cell rather than letting it ride on
  // Array.prototype.join's implicit undefined-to-'' coercion.
  const v = value ?? ''
  if (/[",\n\r]/.test(v)) {
    return `"${v.replace(/"/g, '""')}"`
  }
  return v
}

function csvRow(fields: string[]): string {
  return fields.map(csvField).join(',')
}

/** One CSV per suggested option: one row per KR, followed by one row per
 *  initiative under it (initiative rows commonly have blank metric fields —
 *  most initiatives are action items with no measurable target of their own). */
export function buildKrCsv(option: SuggestedOkrOption, brand: Brand): string {
  const v = vocab(brand)
  const rows: string[] = [csvRow(HEADERS)]

  option.key_results.forEach((kr, i) => {
    rows.push(
      csvRow([v.krShort, String(i + 1), kr.text, kr.metric_name, kr.from_value, kr.to_value, kr.period, ''])
    )
    kr.initiatives.forEach((it) => {
      rows.push(
        csvRow(['Initiative', String(i + 1), it.action, it.metric_name, it.from_value, it.to_value, it.period, it.owning_team])
      )
    })
  })

  return rows.join('\r\n') + '\r\n'
}

/** Filename-safe slug for the Content-Disposition header. */
export function csvFilename(submissionId: string, brand: Brand, label: SuggestedOkrOption['label']): string {
  const optionSlug = label === 'Refined Original' ? 'refined-original' : 'fresh-rewrite'
  return `${vocab(brand).path.slice(1)}-${submissionId}-${optionSlug}.csv`
}
