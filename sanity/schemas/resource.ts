import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'resource',
  title: 'Resource',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'file',
      title: 'File',
      type: 'file',
      description: 'Upload a PDF or document — used when there is no external URL',
    }),
    defineField({
      name: 'externalUrl',
      title: 'External URL',
      type: 'url',
      description: 'Link to an external resource — overrides the uploaded file',
    }),
    defineField({
      name: 'accessType',
      title: 'Access Type',
      type: 'string',
      options: {
        list: [
          { title: 'Free', value: 'free' },
          { title: 'Gated (email required)', value: 'gated' },
        ],
        layout: 'radio',
      },
      initialValue: 'free',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'accessType',
    },
  },
})
