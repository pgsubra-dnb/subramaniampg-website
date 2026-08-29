import { query } from '@/lib/okrAlly'

/**
 * OKR Ally — draft autosave + saved profile (build sequence step 8, design §4).
 *
 * `drafts.form_state` is opaque JSON owned by the form client; the backend only
 * persists and size-limits it. `user_profile` stores the user's approved
 * (never raw) context text plus company name, so returning users start from
 * cleaner material.
 */

export const MAX_DRAFT_BYTES = 100_000

export interface DraftRow {
  form_state: unknown
  updated_at: string
}

export async function getDraft(userId: string): Promise<{ formState: unknown; updatedAt: string } | null> {
  const res = await query<DraftRow>(`SELECT form_state, updated_at FROM drafts WHERE user_id = $1`, [userId])
  const r = res.rows[0]
  return r ? { formState: r.form_state, updatedAt: r.updated_at } : null
}

export async function saveDraft(userId: string, formState: unknown): Promise<void> {
  await query(
    `INSERT INTO drafts (user_id, form_state, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (user_id) DO UPDATE SET form_state = EXCLUDED.form_state, updated_at = now()`,
    [userId, JSON.stringify(formState)]
  )
}

export async function clearDraft(userId: string): Promise<void> {
  await query(`DELETE FROM drafts WHERE user_id = $1`, [userId])
}

export interface OkrAllyProfile {
  name: string
  phone: string | null
  companyName: string | null
  companyContext: string | null
  businessContext: string | null
  roleContext: string | null
}

export async function getProfile(userId: string): Promise<OkrAllyProfile | null> {
  const res = await query<{
    name: string
    phone: string | null
    company_name: string | null
    company_context: string | null
    business_context: string | null
    role_context: string | null
  }>(
    `SELECT u.name, u.phone,
            p.company_name, p.company_context, p.business_context, p.role_context
     FROM users u
     LEFT JOIN user_profile p ON p.user_id = u.id
     WHERE u.id = $1`,
    [userId]
  )
  const r = res.rows[0]
  if (!r) return null
  return {
    name: r.name,
    phone: r.phone,
    companyName: r.company_name,
    companyContext: r.company_context,
    businessContext: r.business_context,
    roleContext: r.role_context,
  }
}

export interface ProfileUpdate {
  name?: string
  phone?: string | null
  companyName?: string | null
  companyContext?: string | null
  businessContext?: string | null
  roleContext?: string | null
}

/** Update the users name/phone and upsert the user_profile context fields. */
export async function saveProfile(userId: string, update: ProfileUpdate): Promise<void> {
  if (update.name !== undefined || update.phone !== undefined) {
    await query(
      `UPDATE users
         SET name  = COALESCE($2, name),
             phone = CASE WHEN $3::boolean THEN $4 ELSE phone END
       WHERE id = $1`,
      [
        userId,
        update.name?.trim() || null,
        update.phone !== undefined,
        update.phone === undefined ? null : update.phone,
      ]
    )
  }

  const hasProfileFields =
    update.companyName !== undefined ||
    update.companyContext !== undefined ||
    update.businessContext !== undefined ||
    update.roleContext !== undefined
  if (hasProfileFields) {
    await query(
      `INSERT INTO user_profile (user_id, company_name, company_context, business_context, role_context, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON CONFLICT (user_id) DO UPDATE SET
         company_name     = COALESCE(EXCLUDED.company_name, user_profile.company_name),
         company_context  = COALESCE(EXCLUDED.company_context, user_profile.company_context),
         business_context = COALESCE(EXCLUDED.business_context, user_profile.business_context),
         role_context     = COALESCE(EXCLUDED.role_context, user_profile.role_context),
         updated_at       = now()`,
      [
        userId,
        update.companyName ?? null,
        update.companyContext ?? null,
        update.businessContext ?? null,
        update.roleContext ?? null,
      ]
    )
  }
}
