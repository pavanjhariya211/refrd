import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Tag as TagIcon } from 'lucide-react'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { JsonLd } from '@/components/JsonLd'
import { blogJsonLd, breadcrumbJsonLd, SITE_URL } from '@/lib/jsonld'
import { createPublicClient } from '@/lib/supabase/server'
import { autoExcerpt } from '@/lib/blog'
import type { BlogPost } from '@/types'

// Lightweight ISR — public blog index regenerates every 10 min. New
// posts show up within that window without a deploy. Tag filtering is
// query-string driven so each tag URL gets its own cached HTML.
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Blog — Insights on hiring, referrals, and the job marketplace',
  description:
    'The Refrd blog: how employee referrals work, hiring trends, and product updates from the team building the referral marketplace.',
  alternates: { canonical: '/blogs' },
  openGraph: {
    title: 'Refrd Blog',
    description:
      'Insights on hiring, employee referrals, and the job marketplace.',
    url: '/blogs',
    type: 'website',
  },
}

type SearchParams = { tag?: string }

export default async function BlogsIndexPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const supabase = createPublicClient()
  let query = supabase
    .from('blog_posts')
    .select(
      'id, slug, title, excerpt, content_html, cover_image_url, tags, published_at, created_at, updated_at'
    )
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .limit(50)

  if (searchParams.tag) {
    query = query.contains('tags', [searchParams.tag])
  }

  const { data } = await query
  const posts = (data ?? []) as BlogPost[]

  // Collect every tag in the result set to render a filter strip. Cheap
  // for <=50 posts; if the blog grows huge we'd surface a dedicated
  // tag table instead.
  const allTags = Array.from(
    new Set(posts.flatMap((p) => p.tags ?? []))
  ).sort()

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={[
          blogJsonLd(),
          breadcrumbJsonLd([
            { name: 'Home', url: SITE_URL },
            { name: 'Blog', url: `${SITE_URL}/blogs` },
          ]),
        ]}
      />
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
            The Refrd Blog
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-text-soft">
            Hiring playbooks, referral mechanics, and product notes from the
            team building the referral marketplace.
          </p>
        </header>

        {allTags.length > 0 && (
          <div className="mb-8 flex flex-wrap items-center justify-center gap-2">
            <Link
              href="/blogs"
              className={
                'inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-medium transition-colors ' +
                (!searchParams.tag
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-bg-card text-text-soft hover:border-primary hover:text-primary')
              }
            >
              All
            </Link>
            {allTags.map((t) => {
              const active = searchParams.tag === t
              return (
                <Link
                  key={t}
                  href={`/blogs?tag=${encodeURIComponent(t)}`}
                  className={
                    'inline-flex items-center gap-1 rounded-pill border px-3 py-1 text-xs font-medium transition-colors ' +
                    (active
                      ? 'border-primary bg-primary text-white'
                      : 'border-border bg-bg-card text-text-soft hover:border-primary hover:text-primary')
                  }
                >
                  <TagIcon className="h-3 w-3" /> {t}
                </Link>
              )
            })}
          </div>
        )}

        {posts.length === 0 ? (
          <div className="card mx-auto max-w-xl text-center text-sm text-text-soft">
            {searchParams.tag
              ? `No posts tagged "${searchParams.tag}" yet.`
              : 'No posts yet — check back soon.'}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  )
}

function PostCard({ post }: { post: BlogPost }) {
  const date = post.published_at ?? post.created_at
  return (
    <Link
      href={`/blogs/${post.slug}`}
      className="group flex flex-col overflow-hidden rounded-card border border-border bg-bg-card shadow-card transition-shadow hover:shadow-card-hover"
    >
      {post.cover_image_url ? (
        <div className="relative h-44 w-full overflow-hidden bg-white/[0.06]">
          <Image
            src={post.cover_image_url}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="h-44 w-full bg-gradient-to-br from-violet-deep via-violet to-pink" />
      )}
      <div className="flex flex-1 flex-col p-5">
        {post.tags?.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-1">
            {post.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="rounded-pill bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-primary"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <h2 className="text-lg font-bold leading-snug text-text group-hover:text-primary">
          {post.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm text-text-soft">
          {post.excerpt?.trim() || autoExcerpt(post.content_html, 160)}
        </p>
        <div className="mt-4 flex items-center gap-1.5 text-xs text-text-faint">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>
    </Link>
  )
}
