import { defineField, defineType } from 'sanity'

export default defineType({
  name: 'magicToken',
  title: 'Magic Token',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'tokenHash',
      title: 'Token Hash',
      type: 'string',
      validation: Rule => Rule.required(),
    }),
    defineField({
      name: 'learnerId',
      title: 'Learner ID',
      type: 'string',
      description: 'The learnerRecord _id resolved at token-creation time, so verify does not need to re-look-up the learner by email.',
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      validation: Rule => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'expiresAt' },
  },
})
