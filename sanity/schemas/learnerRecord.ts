import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'learnerRecord',
  title: 'Learner Record',
  type: 'document',
  fields: [
    defineField({ name: 'name', title: 'Full Name', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'email', title: 'Email', type: 'string', validation: Rule => Rule.required().email() }),
    defineField({ name: 'company', title: 'Company', type: 'string' }),
    defineField({
      name: 'enrolledCourses',
      title: 'Enrolled Courses',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'course' }] }],
    }),
    defineField({
      name: 'completionLog',
      title: 'Completion Log',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'lessonId', title: 'Lesson ID', type: 'string' },
          { name: 'completedAt', title: 'Completed At', type: 'datetime' },
        ],
        preview: { select: { title: 'lessonId', subtitle: 'completedAt' } },
      }],
    }),
    defineField({ name: 'pointsTotal', title: 'Total Points', type: 'number', initialValue: 0 }),
    defineField({
      name: 'certificateRefs',
      title: 'Certificates',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'certificateRecord' }] }],
    }),
    defineField({ name: 'advancedCourseInterest', title: 'Interested in Advanced Course', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'name', subtitle: 'email' },
  },
})
