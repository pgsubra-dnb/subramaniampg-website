import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url'

export const config = {
  projectId: 'vpwi5zan',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: process.env.NODE_ENV === 'production',
}

export const client = createClient(config)

const builder = imageUrlBuilder(client)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

export type SanityPost = {
  _id: string
  slug: string
  title: string
  excerpt: string
  publishedAt: string | null
  categories: string[]
  author: string
  mainImage: string | null
}

const POST_FIELDS = `
  _id,
  "slug": slug.current,
  title,
  excerpt,
  publishedAt,
  categories,
  author,
  "mainImage": mainImage.asset->url
`

export async function getPosts(): Promise<SanityPost[]> {
  return client.fetch(
    `*[_type == "post"] | order(publishedAt desc) { ${POST_FIELDS} }`
  )
}

export async function getLatestPosts(count: number = 3): Promise<SanityPost[]> {
  return client.fetch(
    `*[_type == "post"] | order(publishedAt desc) [0...${count}] { ${POST_FIELDS} }`
  )
}

// Extended type that includes body (Portable Text) for the full article page
export type SanityFullPost = SanityPost & {
  body: unknown[] | null
}

export async function getSanityPostBySlug(slug: string): Promise<SanityFullPost | null> {
  return client.fetch(
    `*[_type == "post" && slug.current == $slug][0] { ${POST_FIELDS}, body }`,
    { slug }
  )
}

export async function getAllSlugs(): Promise<string[]> {
  const results: { slug: string }[] = await client.fetch(
    `*[_type == "post"] { "slug": slug.current }`
  )
  return results.map((r) => r.slug).filter(Boolean)
}

export type SanityTestimonial = {
  _id: string
  quote: string
  name: string
  designation?: string
}

export async function getTestimonials(): Promise<SanityTestimonial[]> {
  return client.fetch(
    `*[_type == "testimonial"] | order(_createdAt asc) { _id, quote, name, designation }`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export type SanityFaq = {
  _id: string
  question: string
  answer: unknown[]
}

export async function getFaqs(limit?: number): Promise<SanityFaq[]> {
  const slice = limit ? `[0...${limit}]` : ''
  return client.fetch(
    `*[_type == "faq" && active == true] | order(sortOrder asc) ${slice} { _id, question, answer }`,
    {},
    { next: { revalidate: 3600 } }
  )
}

export function formatPostDate(publishedAt: string | null): string {
  if (!publishedAt) return ''
  const d = new Date(publishedAt)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}
