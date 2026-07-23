import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/worklifeDb'
import { sendBrevoEmail } from '@/lib/sendBrevoEmail'

const REPORT_RECIPIENT = 'pgs@embiggen.co.in'

interface Totals {
  [key: string]: string
  total: string
  last_24h: string
  interview_optin_count: string
  calendar_clicked_count: string
  update_optin_count: string
  flagged_duplicate_count: string
}

interface GroupRow {
  [key: string]: string
  key: string
  count: string
}

function formatDate(d: Date): string {
  return d.toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatGroup(rows: GroupRow[]): string {
  if (rows.length === 0) return '  (none)'
  return rows.map((r) => `  ${r.key}: ${r.count}`).join('\n')
}

async function buildReport() {
  const { rows: totalsRows } = await query<Totals>(
    `select
       count(*)::text as total,
       count(*) filter (where created_at > now() - interval '24 hours')::text as last_24h,
       count(*) filter (where interview_optin = true)::text as interview_optin_count,
       count(*) filter (where calendar_clicked = true)::text as calendar_clicked_count,
       count(*) filter (where update_optin = true)::text as update_optin_count,
       count(*) filter (where is_flagged_duplicate = true)::text as flagged_duplicate_count
     from worklife_survey_responses`
  )
  const totals = totalsRows[0]

  const { rows: sourceRows } = await query<GroupRow>(
    `select coalesce(source, 'unknown') as key, count(*)::text as count
     from worklife_survey_responses
     where created_at > now() - interval '24 hours'
     group by key
     order by count(*) desc`
  )

  const { rows: experienceRows } = await query<GroupRow>(
    `select coalesce(experience_years, 'unknown') as key, count(*)::text as count
     from worklife_survey_responses
     group by key
     order by key`
  )

  const generatedAt = formatDate(new Date())

  const text = `Work Life Survey — Daily Report
Generated ${generatedAt} IST

Total responses: ${totals.total}
Responses in last 24 hours: ${totals.last_24h}

Last 24 hours by source:
${formatGroup(sourceRows)}

Totals by experience_years:
${formatGroup(experienceRows)}

Interview opt-in count: ${totals.interview_optin_count}
Calendar clicked count: ${totals.calendar_clicked_count}
Update opt-in count: ${totals.update_optin_count}
Flagged duplicate count: ${totals.flagged_duplicate_count}`

  return {
    subject: `Work Life Survey — Daily Report — ${generatedAt}`,
    text,
    html: text.replace(/\n/g, '<br>'),
  }
}

async function handleReport(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error('[worklife-daily-report] CRON_SECRET is not set')
    return NextResponse.json({ ok: false, error: 'not_configured' }, { status: 500 })
  }
  if (authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const report = await buildReport()
    await sendBrevoEmail({
      to: REPORT_RECIPIENT,
      toName: 'Subramaniam P G',
      subject: report.subject,
      htmlContent: report.html,
      textContent: report.text,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[worklife-daily-report] failed:', err)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  return handleReport(req)
}
