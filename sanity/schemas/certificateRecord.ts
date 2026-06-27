import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'certificateRecord',
  title: 'Certificate Record',
  type: 'document',
  fields: [
    defineField({ name: 'certificateId', title: 'Certificate ID', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'learnerRef', title: 'Learner', type: 'reference', to: [{ type: 'learnerRecord' }] }),
    defineField({ name: 'courseRef', title: 'Course', type: 'reference', to: [{ type: 'course' }] }),
    defineField({ name: 'learnerName', title: 'Learner Name', type: 'string' }),
    defineField({ name: 'courseName', title: 'Course Name', type: 'string' }),
    defineField({ name: 'dateIssued', title: 'Date Issued', type: 'datetime', validation: Rule => Rule.required() }),
    defineField({ name: 'pointsScored', title: 'Points Scored', type: 'number' }),
    defineField({ name: 'brevoSynced', title: 'Brevo Synced', type: 'boolean', initialValue: false }),
  ],
  preview: {
    select: { title: 'certificateId', subtitle: 'learnerName' },
  },
})
