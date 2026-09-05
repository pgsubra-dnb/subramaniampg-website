/**
 * Minimal CSV parser/writer — RFC4180 quoting (quoted fields, doubled `""` for
 * a literal quote), CRLF or LF line endings, optional UTF-8 BOM. No external
 * dependency; the only shapes this project needs are small admin files
 * (e.g. the bulk-allocation upload).
 */

const BOM = String.fromCharCode(0xfeff)

export function parseCsv(text: string): string[][] {
  const src = text.startsWith(BOM) ? text.slice(1) : text
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  const pushField = () => {
    row.push(field)
    field = ''
  }
  const pushRow = () => {
    pushField()
    rows.push(row)
    row = []
  }

  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += c
      }
    } else if (c === '"') {
      inQuotes = true
    } else if (c === ',') {
      pushField()
    } else if (c === '\r') {
      // no-op — the following \n (or end of string) closes the row
    } else if (c === '\n') {
      pushRow()
    } else {
      field += c
    }
  }
  if (field.length > 0 || row.length > 0) pushRow()

  // Drop wholly-blank rows (a trailing newline, stray blank lines).
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

export function toCsvField(value: string | number): string {
  const s = String(value)
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function toCsvRow(fields: (string | number)[]): string {
  return fields.map(toCsvField).join(',')
}
