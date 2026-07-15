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

export default defineConfig({
  name: 'default',
  title: 'subramaniampg-website',
  basePath: '/studio',

  projectId: 'vpwi5zan',
  dataset: 'production',

  plugins: [
    structureTool(),
  ],

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
})
