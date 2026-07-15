import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import BlogPostsGrid from '@/components/BlogPostsGrid'
import { getPosts, getCategories } from '@/lib/sanity'

export const revalidate = 3600

export const metadata = {
  title: 'Blog — Leadership, OKR & Ancient Wisdom',
  description:
    'Weekly articles by Subramaniam P G on leadership, OKR implementation, strategy, and the timeless wisdom of Indian philosophy. 180+ articles published.',
  alternates: { canonical: 'https://www.subramaniampg.guru/blog' },
  openGraph: {
    title: 'Blog — Leadership, OKR & Ancient Wisdom | Subramaniam P G',
    description: 'Weekly insights on leadership, OKR, and ancient wisdom by Subramaniam P G.',
    url: 'https://www.subramaniampg.guru/blog',
  },
}

export default async function BlogPage() {
  const [posts, categories] = await Promise.all([getPosts(), getCategories()])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#FAF8F5' }}>
      <NavBar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pt-16 pb-16 lg:pt-20 lg:pb-20 text-center">
        <p className="section-label mb-6">BLOG</p>
        <h1 className="font-lora text-4xl sm:text-5xl lg:text-[3.4rem] font-bold text-[#2C2C2A] leading-[1.12] tracking-tight mb-2">
          Insights on leadership, OKR, and ancient wisdom
        </h1>
        <p className="text-sm italic mb-6" style={{ color: '#1D9E75' }}>Perspectives on growth, leadership, and execution.</p>
        <p className="text-lg text-[#5F5E5A] leading-relaxed max-w-2xl mx-auto">
          {posts.length} articles spanning leadership, strategy, management, and the timeless wisdom of Indian philosophy.
        </p>
      </section>

      {/* Category filter + grid (client component) */}
      <BlogPostsGrid posts={posts} categories={categories} />

      <Footer />
    </div>
  )
}
