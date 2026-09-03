'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import post from './sanity/schemas/post'
import category from './sanity/schemas/category'
import book from './sanity/schemas/book'
import resource from './sanity/schemas/resource'
import testimonial from './sanity/schemas/testimonial'
import siteSettings from './sanity/schemas/siteSettings'
import caseStudy from './sanity/schemas/caseStudy'
import careerEntry from './sanity/schemas/careerEntry'
import course from './sanity/schemas/course'
import academyModule from './sanity/schemas/academyModule'
import lesson from './sanity/schemas/lesson'
import learnerRecord from './sanity/schemas/learnerRecord'
import certificateRecord from './sanity/schemas/certificateRecord'
import feedbackRecord from './sanity/schemas/feedbackRecord'
import magicToken from './sanity/schemas/magicToken'
import faq from './sanity/schemas/faq'
import coupon from './sanity/schemas/coupon'
import assignment from './sanity/schemas/assignment'
import assignmentSubmission from './sanity/schemas/assignmentSubmission'
import bookingLink from './sanity/schemas/bookingLink'
import bookingPurchase from './sanity/schemas/bookingPurchase'
import okrAllySettings from './sanity/schemas/okrAllySettings'
import okrAllyCourse from './sanity/schemas/okrAllyCourse'
import okrAllyCoupon from './sanity/schemas/okrAllyCoupon'
import signInCode from './sanity/schemas/signInCode'

/**
 * Two workspaces under /studio (Sanity shows a workspace switcher; visiting
 * bare /studio lists both). Every workspace basePath must have the same number
 * of segments, so the site workspace moves from /studio to /studio/website.
 *
 *  - "Website"  (/studio/website)  → the `production` dataset: marketing site +
 *                 Academy. Schema and dataset unchanged from before.
 *  - "OKR Ally" (/studio/okr-ally) → the isolated `okr-ally` dataset: only the
 *                 document types OKR Ally reads (course anchor + coupon for the
 *                 free-review flow, signInCode for auth, okrAllySettings for
 *                 footer/GST config).
 *
 * Auth for OKR Ally / Goal Ally is a 6-digit `signInCode` (this dataset only).
 * The shared `magicToken` schema is still registered here for legacy Academy
 * parity / any un-expired old docs, but nothing writes it any more. The
 * OKR Ally workspace has its own `okrAllyCourse` / `okrAllyCoupon` /
 * `okrAllySettings` — the Academy `course`/`coupon` schemas pull in
 * academyModule / bookingLink references that don't belong in this dataset.
 * Editing one workspace never touches the other's data.
 */
export default defineConfig([
  {
    name: 'default',
    title: 'Website',
    basePath: '/studio/website',

    projectId: 'vpwi5zan',
    dataset: 'production',

    plugins: [structureTool()],

    schema: {
      types: [
        post,
        category,
        book,
        resource,
        testimonial,
        siteSettings,
        caseStudy,
        careerEntry,
        course,
        academyModule,
        lesson,
        learnerRecord,
        certificateRecord,
        feedbackRecord,
        magicToken,
        faq,
        coupon,
        assignment,
        assignmentSubmission,
        bookingLink,
        bookingPurchase,
      ],
    },
  },
  {
    name: 'okrAlly',
    title: 'OKR Ally',
    basePath: '/studio/okr-ally',

    projectId: 'vpwi5zan',
    dataset: 'okr-ally',

    plugins: [structureTool()],

    schema: {
      types: [okrAllyCourse, okrAllyCoupon, magicToken, signInCode, okrAllySettings],
    },
  },
])
