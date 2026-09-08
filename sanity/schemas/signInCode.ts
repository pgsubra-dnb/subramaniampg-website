import { defineField, defineType } from 'sanity'

/**
 * One-time 6-digit sign-in code — the sign-in mechanism for both the Academy
 * (`production` dataset, lib/academy.ts) and OKR Ally / Goal Ally (`okr-ally`
 * dataset, lib/okrAllySanity.ts). Stored per-dataset; replaces the old
 * `magicToken` link so sign-in never leaves the tab where it was requested.
 *
 * The code itself is never stored: `codeHash` is HMAC-SHA256(code, keyed by the
 * email + a server secret). `attempts` counts wrong guesses; the verify path
 * deletes the doc once it reaches the cap, forcing a fresh request.
 */
export default defineType({
  name: 'signInCode',
  title: 'Sign-in Code',
  type: 'document',
  fields: [
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'codeHash',
      title: 'Code Hash',
      type: 'string',
      description: 'HMAC of the 6-digit code, keyed by email + a server secret. Never the code itself.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'attempts',
      title: 'Wrong attempts',
      type: 'number',
      initialValue: 0,
    }),
    defineField({
      name: 'expiresAt',
      title: 'Expires At',
      type: 'datetime',
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: { title: 'email', subtitle: 'expiresAt' },
  },
})
