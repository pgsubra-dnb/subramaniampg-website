'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import post from './sanity/schemas/post'
import book from './sanity/schemas/book'
import academyModule from './sanity/schemas/academyModule'
import resource from './sanity/schemas/resource'
import testimonial from './sanity/schemas/testimonial'
import siteSettings from './sanity/schemas/siteSettings'

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
    types: [post, book, academyModule, resource, testimonial, siteSettings],
  },
})
