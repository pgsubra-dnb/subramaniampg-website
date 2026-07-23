import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { query } from '@/lib/worklifeDb'
import {
  AGE_GROUP,
  EXPERIENCE_YEARS,
  CURRENT_ROLE,
  INDUSTRY,
  CITY_TYPE,
  GUIDANCE_NEED,
  SITUATION_TYPE,
  GUIDANCE_SOURCE,
  GUIDANCE_SATISFACTION,
  PAID_LEARNING,
  PAID_AMOUNT,
  COMPLETION,
  WORTH_PAYING,
  SOURCE_VALUES,
  ONE_PROBLEM_MAX_LEN,
  OTHER_TEXT_MAX_LEN,
} from '@/lib/worklifeSurveyOptions'

const RATE_LIMIT_MAX_PER_HOUR = 3
const MIN_COMPLETION_SECONDS = 40

function isIn<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === 'string' && (list as readonly string[]).includes(value)
}

function badRequest(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 })
}

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'unknown'
}

async function verifyTurnstile(token: unknown, ip: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    console.warn('[worklife-survey] TURNSTILE_SECRET_KEY not set — skipping Turnstile verification')
    return true
  }
  if (!token || typeof token !== 'string') return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    })
    const data = await res.json()
    return data.success === true
  } catch (err) {
    console.error('[worklife-survey] Turnstile verification threw:', err)
    return false
  }
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return badRequest('invalid_body')
  }

  // ── Honeypot ──────────────────────────────────────────────
  if (typeof body.hp_field === 'string' && body.hp_field.trim() !== '') {
    return NextResponse.json({ ok: true })
  }

  const ip = getClientIp(req)
  const userAgent = req.headers.get('user-agent') || 'unknown'

  // ── Turnstile ─────────────────────────────────────────────
  const turnstilePassed = await verifyTurnstile(body.turnstileToken, ip)
  if (!turnstilePassed) {
    return badRequest('turnstile_failed')
  }

  // ── Field validation ─────────────────────────────────────
  if (!isIn(AGE_GROUP, body.age_group)) return badRequest('invalid_age_group')
  if (!isIn(EXPERIENCE_YEARS, body.experience_years)) return badRequest('invalid_experience_years')
  if (!isIn(CURRENT_ROLE, body.current_role)) return badRequest('invalid_current_role')
  if (!isIn(INDUSTRY, body.industry)) return badRequest('invalid_industry')
  if (!isIn(CITY_TYPE, body.city_type)) return badRequest('invalid_city_type')
  if (!isIn(GUIDANCE_NEED, body.guidance_need)) return badRequest('invalid_guidance_need')

  let currentRoleOther: string | null = null
  if (body.current_role === 'Other') {
    if (typeof body.current_role_other !== 'string' || !body.current_role_other.trim()) {
      return badRequest('missing_current_role_other')
    }
    currentRoleOther = body.current_role_other.trim().slice(0, OTHER_TEXT_MAX_LEN)
  }

  let industryOther: string | null = null
  if (body.industry === 'Other') {
    if (typeof body.industry_other !== 'string' || !body.industry_other.trim()) {
      return badRequest('missing_industry_other')
    }
    industryOther = body.industry_other.trim().slice(0, OTHER_TEXT_MAX_LEN)
  }

  // ── Section 2 ─────────────────────────────────────────────
  let situationType: string[] = []
  let situationTypeOther: string | null = null
  if (body.guidance_need !== 'No') {
    if (!Array.isArray(body.situation_type) || body.situation_type.length === 0 || body.situation_type.length > 2) {
      return badRequest('invalid_situation_type')
    }
    if (!body.situation_type.every((v) => isIn(SITUATION_TYPE, v))) return badRequest('invalid_situation_type')
    situationType = body.situation_type as string[]
    if (situationType.includes('Something else')) {
      if (typeof body.situation_type_other !== 'string' || !body.situation_type_other.trim()) {
        return badRequest('missing_situation_type_other')
      }
      situationTypeOther = body.situation_type_other.trim().slice(0, OTHER_TEXT_MAX_LEN)
    }
  }

  if (!isIn(GUIDANCE_SOURCE, body.guidance_source)) return badRequest('invalid_guidance_source')
  let guidanceSourceOther: string | null = null
  if (body.guidance_source === 'Other') {
    if (typeof body.guidance_source_other !== 'string' || !body.guidance_source_other.trim()) {
      return badRequest('missing_guidance_source_other')
    }
    guidanceSourceOther = body.guidance_source_other.trim().slice(0, OTHER_TEXT_MAX_LEN)
  }

  if (!isIn(GUIDANCE_SATISFACTION, body.guidance_satisfaction)) return badRequest('invalid_guidance_satisfaction')

  // ── Section 3 ─────────────────────────────────────────────
  if (!Array.isArray(body.paid_learning) || body.paid_learning.length === 0) return badRequest('invalid_paid_learning')
  if (!body.paid_learning.every((v) => isIn(PAID_LEARNING, v))) return badRequest('invalid_paid_learning')
  const paidLearning = body.paid_learning as string[]
  const paidNothing = paidLearning.includes('No, nothing paid')
  if (paidNothing && paidLearning.length > 1) return badRequest('invalid_paid_learning')

  let paidAmount: string | null = null
  let completion: string | null = null
  if (!paidNothing) {
    if (!isIn(PAID_AMOUNT, body.paid_amount)) return badRequest('invalid_paid_amount')
    paidAmount = body.paid_amount
    if (!isIn(COMPLETION, body.completion)) return badRequest('invalid_completion')
    completion = body.completion
  }

  if (!Array.isArray(body.worth_paying) || body.worth_paying.length === 0 || body.worth_paying.length > 2) {
    return badRequest('invalid_worth_paying')
  }
  if (!body.worth_paying.every((v) => isIn(WORTH_PAYING, v))) return badRequest('invalid_worth_paying')
  const worthPaying = body.worth_paying as string[]

  // ── Section 4 ─────────────────────────────────────────────
  let oneProblem: string | null = null
  if (typeof body.one_problem === 'string' && body.one_problem.trim()) {
    oneProblem = body.one_problem.trim().slice(0, ONE_PROBLEM_MAX_LEN)
  }

  if (typeof body.update_optin !== 'boolean') return badRequest('invalid_update_optin')
  const updateOptin = body.update_optin

  let email: string | null = null
  if (updateOptin) {
    if (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())) {
      return badRequest('invalid_email')
    }
    email = body.email.trim().toLowerCase()
  }

  if (typeof body.interview_optin !== 'boolean') return badRequest('invalid_interview_optin')
  const interviewOptin = body.interview_optin

  const calendarClicked = body.calendar_clicked === true

  if (typeof body.completion_seconds !== 'number' || body.completion_seconds < 0) {
    return badRequest('invalid_completion_seconds')
  }
  const completionSeconds = Math.round(body.completion_seconds)

  const source = isIn(SOURCE_VALUES, body.source) ? body.source : 'direct'

  // ── Signature + rate limit ────────────────────────────────
  const salt = process.env.WORKLIFE_SIGNATURE_SALT || 'worklife-survey-salt'
  const submissionSignature = crypto.createHash('sha256').update(`${ip}${userAgent}${salt}`).digest('hex')

  try {
    const { rows: recentRows } = await query<{ count: string }>(
      `select count(*)::int as count from worklife_survey_responses
       where submission_signature = $1 and created_at > now() - interval '1 hour'`,
      [submissionSignature]
    )
    const recentCount = Number(recentRows[0]?.count ?? 0)
    if (recentCount >= RATE_LIMIT_MAX_PER_HOUR) {
      return NextResponse.json({ ok: false, error: 'rate_limited' }, { status: 429 })
    }

    let isFlaggedDuplicate = recentCount > 0 || completionSeconds < MIN_COMPLETION_SECONDS

    if (!isFlaggedDuplicate && email) {
      const { rows: emailRows } = await query('select 1 from worklife_survey_responses where email = $1 limit 1', [email])
      if (emailRows.length > 0) isFlaggedDuplicate = true
    }

    const { rows: inserted } = await query<{ id: string }>(
      `insert into worklife_survey_responses
        (source, age_group, experience_years, role_type, role_type_other, industry, industry_other,
         city_type, guidance_need, situation_type, situation_type_other, guidance_source, guidance_source_other,
         guidance_satisfaction, paid_learning, paid_amount, completion, worth_paying, one_problem, update_optin,
         email, interview_optin, calendar_clicked, submission_signature, is_flagged_duplicate, turnstile_passed,
         completion_seconds)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27)
       returning id`,
      [
        source, body.age_group, body.experience_years, body.current_role, currentRoleOther,
        body.industry, industryOther, body.city_type, body.guidance_need,
        situationType.length ? situationType : null, situationTypeOther,
        body.guidance_source, guidanceSourceOther, body.guidance_satisfaction,
        paidLearning, paidAmount, completion, worthPaying, oneProblem, updateOptin,
        email, interviewOptin, calendarClicked, submissionSignature, isFlaggedDuplicate,
        turnstilePassed, completionSeconds,
      ]
    )

    return NextResponse.json({ ok: true, id: inserted[0].id })
  } catch (err) {
    console.error('[worklife-survey] insert failed:', err)
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 })
  }
}
