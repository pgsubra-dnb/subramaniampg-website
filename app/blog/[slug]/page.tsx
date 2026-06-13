import { notFound } from 'next/navigation'
import { PortableText, type PortableTextComponents } from '@portabletext/react'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import { getSanityPostBySlug, getLatestPosts, getAllSlugs, formatPostDate } from '@/lib/sanity'

export const revalidate = 3600

export async function generateStaticParams() {
  const slugs = await getAllSlugs()
  return slugs.map((slug) => ({ slug }))
}

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
    <path d="M6.22 3.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 0 1 0-1.06z" />
  </svg>
)

const ptComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="text-[#2C2C2A] text-lg leading-[1.85] mb-6">{children}</p>
    ),
    h2: ({ children }) => (
      <h2 className="font-lora text-2xl font-bold text-[#2C2C2A] mt-12 mb-5 leading-snug">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="font-lora text-xl font-semibold text-[#2C2C2A] mt-8 mb-4 leading-snug">{children}</h3>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 pl-6 italic text-[#5F5E5A] my-8" style={{ borderColor: '#633806' }}>
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => <ul className="list-disc pl-6 mb-6 space-y-2 text-[#2C2C2A] text-lg leading-relaxed">{children}</ul>,
    number: ({ children }) => <ol className="list-decimal pl-6 mb-6 space-y-2 text-[#2C2C2A] text-lg leading-relaxed">{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
  marks: {
    strong: ({ children }) => <strong className="font-semibold text-[#2C2C2A]">{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    code: ({ children }) => <code className="bg-gray-100 px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>,
    link: ({ value, children }) => (
      <a href={value?.href} target="_blank" rel="noopener noreferrer" className="text-[#633806] underline underline-offset-2 hover:opacity-75">
        {children}
      </a>
    ),
  },
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = await getSanityPostBySlug(params.slug)
  if (!post) notFound()

  const related = (await getLatestPosts(6)).filter((p) => p.slug !== post.slug).slice(0, 3)
  const category = post.categories?.[0] ?? 'Leadership'
  const date = formatPostDate(post.publishedAt)

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Post header */}
      <section style={{ backgroundColor: '#FAF8F5' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-8 pb-0">
          <a
            href="/blog"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
            style={{ color: '#5F5E5A' }}
          >
            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
              <path d="M9.78 12.78a.75.75 0 0 1-1.06 0L4.47 8.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 1.06L6.06 8l3.72 3.72a.75.75 0 0 1 0 1.06Z" />
            </svg>
            Back to Blog
          </a>
        </div>
        <div className="max-w-4xl mx-auto px-6 lg:px-10 pt-8 pb-14 lg:pb-16">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
            >
              {category}
            </span>
            {date && <span className="text-xs" style={{ color: '#888780' }}>{date}</span>}
          </div>

          <h1 className="font-lora text-3xl sm:text-4xl lg:text-[2.8rem] font-bold text-[#2C2C2A] leading-[1.15] tracking-tight mb-6">
            {post.title}
          </h1>

          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 font-lora font-bold text-base"
              style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
            >
              PG
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2C2C2A] leading-none mb-0.5">Subramaniam P G</p>
              <p className="text-xs" style={{ color: '#888780' }}>Growth Architect · Executive Coach · Author</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured image */}
      {post.mainImage ? (
        <div className="w-full aspect-[16/9] max-h-[480px] overflow-hidden">
          <img
            src={post.mainImage}
            alt={post.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div
          className="w-full aspect-[16/9] max-h-[480px] flex items-center justify-center"
          style={{ backgroundColor: '#F1EFE8' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-14 h-14" style={{ color: '#C4B49E' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
          </svg>
        </div>
      )}

      {/* Post content */}
      <section className="py-14 lg:py-20 bg-white">
        <div className="max-w-[720px] mx-auto px-6 lg:px-0">
          {post.body && (post.body as unknown[]).length > 0 ? (
            <PortableText value={post.body as Parameters<typeof PortableText>[0]['value']} components={ptComponents} />
          ) : post.excerpt ? (
            <p className="text-[#2C2C2A] text-lg leading-[1.85]">{post.excerpt}</p>
          ) : null}
        </div>
      </section>

      {/* Author bio */}
      <section className="py-12 lg:py-16 border-t" style={{ backgroundColor: '#FAF8F5', borderColor: '#E8E4DC' }}>
        <div className="max-w-[720px] mx-auto px-6 lg:px-0">
          <div
            className="flex items-start gap-5 p-7 rounded-2xl border bg-white"
            style={{ borderColor: '#E8E4DC' }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center shrink-0 font-lora font-bold text-xl"
              style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
            >
              PG
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-lora font-bold text-[#2C2C2A] text-lg mb-0.5">Subramaniam P G</p>
              <p className="text-xs font-medium mb-3" style={{ color: '#888780' }}>
                Growth Architect · Executive Coach · Author
              </p>
              <p className="text-[#5F5E5A] text-sm leading-relaxed mb-4">
                Writing at the intersection of ancient wisdom and modern leadership since 2008.
              </p>
              <a
                href="/about"
                className="inline-flex items-center gap-1.5 text-sm font-semibold transition-all hover:gap-2"
                style={{ color: '#633806' }}
              >
                About Subramaniam P G
                <ArrowIcon />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {related.length > 0 && (
        <section className="py-14 lg:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-10">
            <h2 className="font-lora text-2xl lg:text-3xl font-bold text-[#2C2C2A] mb-10">
              More articles
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {related.map((rel) => (
                <article
                  key={rel._id}
                  className="flex flex-col bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  style={{ borderColor: '#E8E4DC' }}
                >
                  <div
                    className="aspect-[16/9] flex items-center justify-center shrink-0 overflow-hidden"
                    style={{ backgroundColor: '#F1EFE8' }}
                  >
                    {rel.mainImage ? (
                      <img
                        src={rel.mainImage}
                        alt={rel.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} className="w-8 h-8" style={{ color: '#C4B49E' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                      </svg>
                    )}
                  </div>
                  <div className="flex flex-col flex-1 p-6">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-full w-fit mb-3"
                      style={{ backgroundColor: '#FAEEDA', color: '#633806' }}
                    >
                      {rel.categories?.[0] ?? 'Leadership'}
                    </span>
                    <h3 className="font-lora text-base font-bold text-[#2C2C2A] leading-snug mb-3 line-clamp-2 flex-1 group-hover:text-[#633806] transition-colors">
                      {rel.title}
                    </h3>
                    <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: '#E8E4DC' }}>
                      <span className="text-xs" style={{ color: '#888780' }}>{formatPostDate(rel.publishedAt)}</span>
                      <a
                        href={`/blog/${rel.slug}`}
                        className="text-xs font-semibold flex items-center gap-1 hover:gap-2 transition-all"
                        style={{ color: '#633806' }}
                      >
                        Read more
                        <ArrowIcon />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-14 lg:py-20" style={{ backgroundColor: '#633806' }}>
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="font-lora text-3xl lg:text-4xl font-bold text-white mb-4">
              Found this useful?
            </h2>
            <p className="text-white/70 leading-relaxed mb-8">
              Explore coaching and consulting with Subramaniam P G.
            </p>
            <a
              href="/work"
              className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-[#633806] transition-colors"
            >
              Work with me
              <ArrowIcon />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
