import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'bookingLink',
  title: 'Booking Link',
  type: 'document',
  fields: [
    defineField({ name: 'label', title: 'Label', type: 'string', description: 'Internal label, e.g. RACI Decoded Paid Consultation.' }),
    defineField({ name: 'url', title: 'Booking URL', type: 'url', validation: Rule => Rule.required() }),
  ],
})
