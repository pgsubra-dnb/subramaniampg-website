import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'lesson',
  title: 'Lesson',
  type: 'document',
  fields: [
    defineField({ name: 'title', title: 'Lesson Title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'moduleRef', title: 'Module', type: 'reference', to: [{ type: 'academyModule' }] }),
    defineField({ name: 'order', title: 'Order', type: 'number', validation: Rule => Rule.required().min(1) }),
    defineField({
      name: 'body',
      title: 'Lesson Content',
      type: 'array',
      of: [{ type: 'block' }, { type: 'image', options: { hotspot: true } }],
    }),
    defineField({
      name: 'interactiveType',
      title: 'Interactive Element Type',
      type: 'string',
      options: { list: ['reflection', 'true-false', 'fill-blank', 'sort', 'spot-mistake'] },
    }),
    defineField({
      name: 'interactiveContent',
      title: 'Interactive Element Content',
      type: 'text',
      description: 'JSON string. Stores questions, options, and answers for the interactive element.',
      rows: 6,
    }),
    defineField({ name: 'pointsValue', title: 'Points Value', type: 'number', initialValue: 10 }),
  ],
  preview: {
    select: { title: 'title' },
  },
})
