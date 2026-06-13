import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'academyModule',
  title: 'Academy Module',
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
      options: { source: 'title', maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'status',
      title: 'Status',
      type: 'string',
      options: {
        list: [
          { title: 'Available', value: 'available' },
          { title: 'Coming Soon', value: 'coming-soon' },
        ],
        layout: 'radio',
      },
      initialValue: 'coming-soon',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'releaseQuarter',
      title: 'Release Quarter',
      type: 'string',
      description: 'e.g. Q3 2025 — only shown when status is Coming Soon',
    }),
    defineField({
      name: 'thumbnail',
      title: 'Thumbnail',
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'status',
      media: 'thumbnail',
    },
  },
})
