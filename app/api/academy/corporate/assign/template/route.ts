import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/** A starter CSV for the bulk seat upload — one `email` column. */
export async function GET() {
  const csv = 'email\nalice@example.com\nbob@example.com\n'
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="academy-seats-template.csv"',
    },
  })
}
