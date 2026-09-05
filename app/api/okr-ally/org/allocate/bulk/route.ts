import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { bulkAllocateOrgCredits, OrgError } from '@/lib/okrAllyOrg'
import { toBrand, vocab } from '@/lib/okrAllyBrand'
import { parseCsv } from '@/lib/csv'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 2 * 1024 * 1024

/** Company Admin — bulk-allocate from an uploaded CSV (email, review count).
 *  multipart/form-data: file=<csv>, brand=okr_ally|goal_ally. */
export async function POST(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const form = await req.formData().catch(() => null)
  if (!form) return NextResponse.json({ error: 'Malformed upload.' }, { status: 400 })

  const brand = toBrand(form.get('brand'))
  const v = vocab(brand)
  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 })
  }
  if (file.size === 0) {
    return NextResponse.json({ error: 'The file is empty.' }, { status: 400 })
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File exceeds 2 MB.' }, { status: 400 })
  }

  const table = parseCsv(await file.text())
  if (table.length === 0) {
    return NextResponse.json({ error: 'The file is empty.' }, { status: 400 })
  }

  const header = table[0]
  if (header.length !== 2) {
    return NextResponse.json(
      { error: `The file must have exactly two columns: email and ${v.reviews}.` },
      { status: 400 }
    )
  }

  const dataRows = table.slice(1)
  if (dataRows.length === 0) {
    return NextResponse.json(
      { errors: [{ row: 0, email: '', error: 'The file has no data rows.' }] },
      { status: 400 }
    )
  }

  const shapeErrors: { row: number; email: string; error: string }[] = []
  const rows: { email: string; credits: number }[] = []
  dataRows.forEach((cols, i) => {
    const row = i + 2
    if (cols.length !== 2) {
      shapeErrors.push({
        row,
        email: cols[0] ?? '',
        error: `Row must have exactly two columns: email and ${v.reviews}.`,
      })
      return
    }
    rows.push({ email: (cols[0] ?? '').trim(), credits: Number((cols[1] ?? '').trim()) })
  })
  if (shapeErrors.length > 0) {
    return NextResponse.json({ errors: shapeErrors }, { status: 400 })
  }

  try {
    const result = await bulkAllocateOrgCredits(user, rows, brand)
    if (!result.ok) return NextResponse.json({ errors: result.errors }, { status: 400 })
    return NextResponse.json(result)
  } catch (e) {
    if (e instanceof OrgError) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    console.error('OKR Ally org bulk allocate error:', e)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
