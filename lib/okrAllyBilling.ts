import type { PoolClient } from 'pg'
import { okrAllySanityClient } from '@/lib/okrAllySanity'
import { query, withTransaction } from '@/lib/okrAlly'

/**
 * OKR Ally billing — credit packs, GST math, coupon validation, and the
 * atomic credit-grant used by both the client-side verify-payment path and the
 * server-side Razorpay webhook fallback (design doc sections 3, 5 and build
 * sequence step 4).
 *
 * The GST math mirrors app/api/create-order/route.ts exactly:
 *   gst   = round(basePrice * 0.18)
 *   total = basePrice + gst
 *   amount to Razorpay = round(total * 100)  (paise)
 */

// The `okrAllyCourse` anchor document's slug, in the `okr-ally` Sanity dataset
// (created once in the OKR Ally Studio workspace). Override with
// OKR_ALLY_COURSE_SLUG if a different slug is used.
export const OKR_ALLY_COURSE_SLUG = process.env.OKR_ALLY_COURSE_SLUG || 'okr-ally'

export type PackId = 'single' | 'pack5' | 'pack10'

export interface Pack {
  id: PackId
  label: string
  credits: number
  basePrice: number // INR, excl. GST
}

// Pricing table, section 5. Single source of truth — not read from Sanity.
// basePrice is INR excl. GST; the Pricing tab and /api/okr-ally/status derive
// every displayed figure from here (per-review, GST, total).
export const PACKS: Record<PackId, Pack> = {
  single: { id: 'single', label: 'Single review', credits: 1, basePrice: 100 },
  pack5: { id: 'pack5', label: '5-pack', credits: 5, basePrice: 375 },
  pack10: { id: 'pack10', label: '10-pack', credits: 10, basePrice: 500 },
}

export function getPack(pack: unknown): Pack | null {
  if (typeof pack === 'string' && pack in PACKS) return PACKS[pack as PackId]
  return null
}

export interface GstBreakdown {
  base: number
  gst: number
  total: number
  amountInPaise: number
}

export function gstBreakdown(basePrice: number): GstBreakdown {
  const base = Math.round(basePrice)
  const gst = Math.round(base * 0.18)
  const total = base + gst
  return { base, gst, total, amountInPaise: Math.round(total * 100) }
}

// ─── Coupon validation ──────────────────────────────────────────────────

export interface CouponResult {
  valid: boolean
  discountPercent: number
  reason?: string
  code?: string
}

interface CouponDoc {
  discountPercent: number
  active: boolean
  /** ISO date (YYYY-MM-DD), or null when the coupon has no expiry (never expires). */
  expiryDate: string | null
}

/**
 * Validate a coupon for OKR Ally: the Sanity `okrAllyCoupon` document must be
 * active, anchored to the OKR Ally `course`, and either have no expiry date or
 * an expiry date that is today or later; and the user must not have already
 * redeemed a coupon with this code (enforced in Neon `coupon_redemptions`, not
 * by Sanity alone — section 3).
 *
 * A missing/null `expiryDate` means "never expires" — the field is optional in
 * the schema. The free-first-review coupon is intentionally open-ended.
 */
export async function validateCoupon(code: string, userId: string): Promise<CouponResult> {
  const upperCode = code.trim().toUpperCase()
  if (!upperCode) return { valid: false, discountPercent: 0, reason: 'Enter a coupon code' }

  const today = new Date().toISOString().split('T')[0]
  // coalesce(expiryDate, null) so the key is always present (as null) when the
  // document omits it, rather than being absent from the projection.
  const coupon = await okrAllySanityClient.fetch<CouponDoc | null>(
    `*[_type == 'okrAllyCoupon' && code == $code && applicableCourse->slug.current == $slug][0]{
      discountPercent, active, "expiryDate": coalesce(expiryDate, null)
    }`,
    { code: upperCode, slug: OKR_ALLY_COURSE_SLUG },
    { cache: 'no-store' }
  )

  if (!coupon) return { valid: false, discountPercent: 0, reason: 'Coupon not found' }
  if (!coupon.active) return { valid: false, discountPercent: 0, reason: 'Coupon is inactive' }
  // No expiryDate => never expires. Only reject when a date is set AND it is past.
  if (coupon.expiryDate && coupon.expiryDate < today) {
    return { valid: false, discountPercent: 0, reason: 'Coupon has expired' }
  }

  const redeemed = await query(
    'SELECT 1 FROM coupon_redemptions WHERE user_id = $1 AND coupon_code = $2 LIMIT 1',
    [userId, upperCode]
  )
  if (redeemed.rowCount) {
    return { valid: false, discountPercent: 0, reason: 'You have already used this coupon' }
  }

  return { valid: true, discountPercent: coupon.discountPercent, code: upperCode }
}

// ─── Atomic credit grant ────────────────────────────────────────────────

export interface GrantResult {
  granted: boolean
  alreadyProcessed: boolean
  creditsRemaining: number
}

interface GrantArgs {
  userId: string
  credits: number
  /** Razorpay payment id — the idempotency key for paid grants. Null for a
   *  fully-coupon-covered (₹0) grant, where the coupon redemption row is the
   *  idempotency guard instead. */
  razorpayPaymentId: string | null
  razorpayOrderId?: string | null
  couponCode?: string | null
}

/**
 * Grant `credits` to a user exactly once. Safe to call from both verify-payment
 * and the webhook for the same payment — the second call is a no-op.
 *
 * Idempotency:
 *  - paid grant: a prior `credit_transactions` row with the same
 *    `razorpay_payment_id` short-circuits.
 *  - ₹0 coupon grant: the `coupon_redemptions (user_id, coupon_code)` unique
 *    index rejects a duplicate; we treat that as already-processed.
 */
export async function grantCredits(args: GrantArgs): Promise<GrantResult> {
  const { userId, credits, razorpayPaymentId, razorpayOrderId = null, couponCode = null } = args

  if (!razorpayPaymentId && !couponCode) {
    throw new Error('grantCredits requires a razorpayPaymentId or a couponCode as the idempotency key')
  }

  return withTransaction(async (client: PoolClient) => {
    const balanceOf = async () => {
      const bal = await client.query<{ credits_remaining: number }>(
        'SELECT credits_remaining FROM user_credit_balance WHERE user_id = $1',
        [userId]
      )
      return bal.rows[0]?.credits_remaining ?? 0
    }

    // Idempotency guard 1: the coupon redemption. ON CONFLICT DO NOTHING against
    // idx_coupon_one_per_user (user_id, coupon_code) — 0 rows means this coupon
    // was already redeemed by this user, so the grant already happened.
    if (couponCode) {
      const redemption = await client.query(
        `INSERT INTO coupon_redemptions (user_id, coupon_code, applied_to_order_id)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, coupon_code) DO NOTHING`,
        [userId, couponCode, razorpayOrderId]
      )
      if (redemption.rowCount === 0) {
        return { granted: false, alreadyProcessed: true, creditsRemaining: await balanceOf() }
      }
    }

    // Idempotency guard 2: the purchase transaction. ON CONFLICT DO NOTHING
    // against idx_credit_txn_purchase_payment (partial unique on
    // razorpay_payment_id WHERE type = 'purchase') — 0 rows means verify-payment
    // and the webhook raced and this payment was already credited.
    if (razorpayPaymentId) {
      const txn = await client.query(
        `INSERT INTO credit_transactions (user_id, razorpay_payment_id, amount, type)
         VALUES ($1, $2, $3, 'purchase')
         ON CONFLICT (razorpay_payment_id) WHERE type = 'purchase' DO NOTHING`,
        // arbiter: idx_credit_txn_purchase_payment (partial unique, predicate `type = 'purchase'`)
        [userId, razorpayPaymentId, credits]
      )
      if (txn.rowCount === 0) {
        return { granted: false, alreadyProcessed: true, creditsRemaining: await balanceOf() }
      }
    } else {
      await client.query(
        `INSERT INTO credit_transactions (user_id, razorpay_payment_id, amount, type)
         VALUES ($1, NULL, $2, 'purchase')`,
        [userId, credits]
      )
    }

    const updated = await client.query<{ credits_remaining: number }>(
      `INSERT INTO user_credit_balance (user_id, credits_remaining, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (user_id)
       DO UPDATE SET credits_remaining = user_credit_balance.credits_remaining + EXCLUDED.credits_remaining,
                     updated_at = now()
       RETURNING credits_remaining`,
      [userId, credits]
    )

    return {
      granted: true,
      alreadyProcessed: false,
      creditsRemaining: updated.rows[0].credits_remaining,
    }
  })
}
