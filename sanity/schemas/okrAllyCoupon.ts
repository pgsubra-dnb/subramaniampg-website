import { defineType, defineField } from 'sanity'

/**
 * OKR Ally coupon — same shape as the Academy `coupon` schema, but anchored to
 * `okrAllyCourse` and living only in the isolated `okr-ally` dataset. Used for
 * the 100%-off first-review flow (put its code in OKR_ALLY_FREE_REVIEW_COUPON).
 * One-per-user enforcement is in Neon (`coupon_redemptions`), not here.
 *
 * Validated by validateCoupon() in lib/okrAllyBilling.ts:
 *   *[_type == 'okrAllyCoupon' && code == $code
 *      && applicableCourse->slug.current == $slug][0]
 */
export default defineType({
  name: 'okrAllyCoupon',
  title: 'OKR Ally Coupon',
  type: 'document',
  fields: [
    defineField({
      name: 'code',
      title: 'Coupon Code',
      type: 'string',
      description: 'The code users type. Compared case-insensitively (upper-cased at validation).',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'discountPercent',
      title: 'Discount Percentage',
      type: 'number',
      description: 'Between 1 and 100. 100 = a fully free review. Only 100 is currently honoured at review time.',
      validation: (Rule) => Rule.required().min(1).max(100),
    }),
    defineField({
      name: 'expiryDate',
      title: 'Expiry Date',
      type: 'date',
      description:
        'Optional. Coupon stops working after this date. Leave EMPTY for a coupon that never expires — validateCoupon() treats a missing expiry as "never expires", not as invalid. The free-first-review coupon is intentionally open-ended (see the go-live checklist).',
    }),
    defineField({
      name: 'applicableCourse',
      title: 'Applicable Course',
      type: 'reference',
      to: [{ type: 'okrAllyCourse' }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'active',
      title: 'Active',
      type: 'boolean',
      description: 'Switch off to disable this coupon immediately.',
      initialValue: true,
    }),
  ],
  preview: { select: { title: 'code', subtitle: 'discountPercent' } },
})
