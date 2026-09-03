import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/okrAlly'
import { getProfile, saveProfile, type ProfileUpdate } from '@/lib/okrAllyForm'

export const dynamic = 'force-dynamic'

// Company context gets more room (matches the review form + org-admin context);
// business + role stay at 1000.
const CONTEXT_MAX = 1000
const COMPANY_CONTEXT_MAX = 2000
const NAME_MAX = 120
const PHONE_MAX = 20

/** GET: the user's saved profile — prefills the step form for returning users. */
export async function GET(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  const profile = await getProfile(user.id)
  return NextResponse.json(profile ?? { name: user.name, phone: user.phone, companyName: null, companyContext: null, businessContext: null, roleContext: null })
}

/**
 * PUT: update name / phone and (when the user opts in) the saved context.
 * Only the APPROVED context text should be sent here, never the raw input.
 * Body: any subset of
 *   { name, phone, companyName, companyContext, businessContext, roleContext }
 */
export async function PUT(req: NextRequest) {
  const user = await getSessionUser(req)
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 })

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
  const update: ProfileUpdate = {}

  if ('name' in body) {
    if (typeof body.name !== 'string' || !body.name.trim() || body.name.length > NAME_MAX) {
      return NextResponse.json({ error: 'Name must be 1–120 characters' }, { status: 400 })
    }
    update.name = body.name.trim()
  }
  if ('phone' in body) {
    if (body.phone === null || body.phone === '') {
      update.phone = null
    } else if (typeof body.phone === 'string' && body.phone.trim().length <= PHONE_MAX) {
      update.phone = body.phone.trim()
    } else {
      return NextResponse.json({ error: 'Phone is not valid' }, { status: 400 })
    }
  }

  for (const [key, col] of [
    ['companyName', 'companyName'],
    ['companyContext', 'companyContext'],
    ['businessContext', 'businessContext'],
    ['roleContext', 'roleContext'],
  ] as const) {
    if (!(key in body)) continue
    const v = body[key]
    if (v === null || v === '') {
      ;(update as Record<string, unknown>)[col] = null
      continue
    }
    if (typeof v !== 'string') {
      return NextResponse.json({ error: `${key} must be text` }, { status: 400 })
    }
    const max = key === 'companyName' ? NAME_MAX : key === 'companyContext' ? COMPANY_CONTEXT_MAX : CONTEXT_MAX
    if (v.length > max) {
      return NextResponse.json({ error: `${key} exceeds ${max} characters` }, { status: 400 })
    }
    ;(update as Record<string, unknown>)[col] = v.trim()
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  await saveProfile(user.id, update)
  return NextResponse.json({ ok: true, profile: await getProfile(user.id) })
}
