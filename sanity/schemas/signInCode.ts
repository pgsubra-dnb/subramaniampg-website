import { defineField, defineType } from 'sanity'

/**
 * OKR Ally / Goal Ally — one-time 6-digit sign-in code.
 *
 * Lives ONLY in the isolated `okr-ally` dataset (registered in the okrAlly
 * workspace, never the main one). Replaces the old `magicToken` link mechanism
 * for OKR Ally — Academy still uses `magicToken` in `production`, untouched.
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
      description: 'HMAC of the 6-digit code, keyed by email + OKR_ALLY_SESSION_SECRET. Never the code itself.',
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
