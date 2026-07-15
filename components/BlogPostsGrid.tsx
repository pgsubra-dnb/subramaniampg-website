'use client'

import { useState } from 'react'
import type { SanityPost } from '@/lib/sanity'
import { formatPostDate } from '@/lib/sanity'

const ImagePlaceholderIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-10 h-10" style={{ color: '#C4B49E' }}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
  </svg>
)

function BlogCard({ post }: { post: SanityPost }) {
  const category = post.categories?.[0] ?? 'Leadership'
  const date = formatPostDate(post.publishedAt)

  return (
    <article
      className="flex flex-col bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 group"
      style={{ borderColor: '#E8E4DC' }}
    >
      {/* Cover image */}
      <div
        className="aspect-[16/9] flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: '#F1EFE8' }}
      >
        {post.mainImage ? (
          <img
            src={post.mainImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <ImagePlaceholderIcon />
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-6">
        <span
          className="text-xs font-semibold px-3 py-1 rounded-full w-fit mb-4"
          style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
        >
          {category}
        </span>

        <h3 className="font-lora text-base font-bold text-[#2C2C2A] leading-snug mb-3 line-clamp-2 group-hover:text-[#633806] transition-colors">
          {post.title}
        </h3>

        <p className="text-[#5F5E5A] text-sm leading-relaxed flex-1 mb-4">
          {post.excerpt}
        </p>

        <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#E8E4DC' }}>
          <span className="text-xs" style={{ color: '#888780' }}>{date}</span>
          <a
            href={`/blog/${post.slug}`}
            className="text-xs font-semibold flex items-center gap-1 transition-all hover:gap-2"
            style={{ color: '#633806' }}
          >
            Read more
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 shrink-0">
              <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
            </svg>
          </a>
        </div>
      </div>
    </article>
  )
}

export default function BlogPostsGrid({ posts, categories: categoryList }: { posts: SanityPost[]; categories: string[] }) {
  const [activeCategory, setActiveCategory] = useState('All')

  const categories = ['All', ...categoryList]

  const filtered = activeCategory === 'All'
    ? posts
    : posts.filter((p) => (p.categories ?? []).includes(activeCategory))

  return (
    <>
      {/* Sticky category filter bar */}
      <div className="sticky top-16 z-40 bg-white border-b" style={{ borderColor: '#E8E4DC' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-none">
            {categories.map((cat) => {
              const isActive = cat === activeCategory
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className="shrink-0 px-4 py-2 rounded-full text-sm font-semibold transition-all"
                  style={{
                    backgroundColor: isActive ? '#633806' : '#ffffff',
                    color:            isActive ? '#ffffff' : '#633806',
                    border:           '1.5px solid #633806',
                  }}
                >
                  {cat}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Blog grid */}
      <section className="py-12 lg:py-16" style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          {filtered.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-[#5F5E5A] text-lg">No posts in this category yet.</p>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
