import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'yearsExperience',
      title: 'Years Experience',
      type: 'string',
      description: 'e.g. 40+',
    }),
    defineField({
      name: 'booksPublished',
      title: 'Books Published',
      type: 'string',
      description: 'e.g. 7',
    }),
    defineField({
      name: 'articlesWritten',
      title: 'Articles Written',
      type: 'string',
      description: 'e.g. 182',
    }),
    defineField({
      name: 'leadersCoached',
      title: 'Leaders Coached',
      type: 'string',
      description: 'e.g. 100+',
    }),
    defineField({
      name: 'motionBookingUrl',
      title: 'Motion Booking URL',
      type: 'url',
      description: 'Calendly or Motion link for booking sessions',
    }),
    defineField({
      name: 'email',
      title: 'Contact Email',
      type: 'string',
    }),
    defineField({
      name: 'phone',
      title: 'Contact Phone',
      type: 'string',
    }),
  ],
  preview: {
    select: {
      title: 'email',
    },
    prepare() {
      return { title: 'Site Settings' }
    },
  },
})
