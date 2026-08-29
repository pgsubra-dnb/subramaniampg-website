import { defineType, defineField } from 'sanity'

/**
 * OKR Ally course anchor — the coupon-scoping target, mirrored from the
 * Academy `course` pattern but stripped to just what a coupon needs (title +
 * slug). Lives only in the isolated `okr-ally` dataset. Create exactly one:
 * title "OKR Ally", slug `okr-ally` (or override via OKR_ALLY_COURSE_SLUG).
 *
 * Kept as a separate type from the shared `course` schema because that one
 * pulls in academyModule / bookingLink / lesson references that have no place
 * in the OKR Ally dataset.
 */
export default defineType({
  name: 'okrAllyCourse',
  title: 'OKR Ally Course Anchor',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title' },
      description: 'Must match OKR_ALLY_COURSE_SLUG (default: okr-ally).',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: { select: { title: 'title', subtitle: 'slug.current' } },
})
