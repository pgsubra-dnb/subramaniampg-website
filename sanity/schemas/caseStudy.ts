import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'caseStudy',
  title: 'Case Study',
  type: 'document',
  fields: [
    defineField({
      name: 'number',
      title: 'Display Number',
      type: 'string',
      description: 'e.g. 01, 02, 03',
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'context',
      title: 'Context',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'revealed',
      title: 'What the Assessment Revealed',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'workedOn',
      title: 'What Was Worked On',
      type: 'array',
      of: [{ type: 'string' }],
      description: 'Add each bullet point as a separate item',
    }),
    defineField({
      name: 'resultLabel',
      title: 'Result Label',
      type: 'string',
      description: 'e.g. What changed, What is changing',
    }),
    defineField({
      name: 'result',
      title: 'Result',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
})
