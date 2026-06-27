import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'feedbackRecord',
  title: 'Feedback Record',
  type: 'document',
  fields: [
    defineField({ name: 'learnerRef', title: 'Learner', type: 'reference', to: [{ type: 'learnerRecord' }] }),
    defineField({ name: 'courseRef', title: 'Course', type: 'reference', to: [{ type: 'course' }] }),
    defineField({ name: 'starRating', title: 'Star Rating', type: 'number', validation: Rule => Rule.required().min(1).max(5) }),
    defineField({ name: 'mostUseful', title: 'Most Useful Learning', type: 'text', rows: 4 }),
    defineField({
      name: 'wouldRecommend',
      title: 'Would Recommend',
      type: 'string',
      options: { list: ['yes', 'no', 'maybe'] },
    }),
    defineField({
      name: 'advancedInterest',
      title: 'Advanced Course Interest',
      type: 'string',
      options: { list: ['yes', 'not-yet'] },
    }),
    defineField({ name: 'displayPermission', title: 'Display Permission Given', type: 'boolean', initialValue: false }),
    defineField({ name: 'published', title: 'Published as Testimonial', type: 'boolean', initialValue: false }),
    defineField({ name: 'submittedAt', title: 'Submitted At', type: 'datetime' }),
  ],
  preview: {
    select: { title: 'submittedAt' },
  },
})
