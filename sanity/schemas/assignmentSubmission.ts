import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'assignmentSubmission',
  title: 'Assignment Submission',
  type: 'document',
  fields: [
    defineField({ name: 'learnerEmail', title: 'Learner Email', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'course', title: 'Course', type: 'reference', to: [{ type: 'course' }] }),
    defineField({ name: 'assignment', title: 'Assignment', type: 'reference', to: [{ type: 'assignment' }] }),
    defineField({ name: 'moduleSlug', title: 'Module Slug', type: 'string' }),
    defineField({ name: 'submissionType', title: 'Submission Type', type: 'string', options: { list: ['text', 'file', 'link'] } }),
    defineField({ name: 'textResponse', title: 'Text Response', type: 'text' }),
    defineField({ name: 'fileUpload', title: 'File Upload', type: 'file' }),
    defineField({ name: 'linkUrl', title: 'Link URL', type: 'url', description: 'Google Doc or Sheet link if file was too large.' }),
    defineField({ name: 'submittedAt', title: 'Submitted At', type: 'datetime' }),
    defineField({ name: 'feedbackSent', title: 'Feedback Sent', type: 'boolean', initialValue: false, description: 'PGS marks this true once feedback email has been sent.' }),
    defineField({ name: 'feedbackSentAt', title: 'Feedback Sent At', type: 'datetime' }),
  ],
  orderings: [
    {
      title: 'Submitted (newest first)',
      name: 'submittedAtDesc',
      by: [{ field: 'submittedAt', direction: 'desc' }],
    },
  ],
  preview: {
    select: { title: 'learnerEmail', subtitle: 'moduleSlug' },
  },
})
