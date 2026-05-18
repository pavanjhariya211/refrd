import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowLeft, Tag as TagIcon } from 'lucide-react'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { JsonLd } from '@/components/JsonLd'
import {
  articleJsonLd,
  breadcrumbJsonLd,
  SITE_URL,
  SITE_NAME,
} from '@/lib/jsonld'
import { createPublicClient } from '@/lib/supabase/server'
import { autoExcerpt, readingMinutes } from '@/lib/blog'
import type { BlogPost } from '@/types'

// ISR — post pages regenerate every 10 minutes. Edits in the admin
// appear within that window without a deploy; a 'Publish' action also
// hits revalidateTag/Path from the API route for instant refresh.
export const revalidate = 600

async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .maybeSingle()
  return (data as BlogPost | null) ?? null
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = await getPost(params.slug)
  if (!post) return { title: 'Post not found' }

  const canonical = `${SITE_URL}/blogs/${post.slug}`
  const description =
    post.meta_description?.trim() ||
    post.excerpt?.trim() ||
    autoExcerpt(post.content_html, 155)
  const image = post.og_image_url || post.cover_image_url || `${SITE_URL}/logo.png`

  return {
    title: post.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: post.title,
      description,
      url: canonical,
      type: 'article',
      siteName: SITE_NAME,
      publishedTime: post.published_at ?? post.created_at,
      modifiedTime: post.updated_at,
      images: [{ url: image }],
      tags: post.tags ?? [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description,
      images: [image],
    },
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: { slug: string }
}) {
  const post = await getPost(params.slug)
  if (!post) notFound()

  const date = post.published_at ?? post.created_at
  const minutes = readingMinutes(post.content_html)

  return (
    <div className="flex min-h-screen flex-col">
      <JsonLd
        data={[
          articleJsonLd(post),
          breadcrumbJsonLd([
            { name: 'Home', url: SITE_URL },
            { name: 'Blog', url: `${SITE_URL}/blogs` },
            { name: post.title, url: `${SITE_URL}/blogs/${post.slug}` },
          ]),
        ]}
      />
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Link
          href="/blogs"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>

        <article>
          <header className="mb-8">
            {post.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/blogs?tag=${encodeURIComponent(t)}`}
                    className="inline-flex items-center gap-1 rounded-pill bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-brand-100"
                  >
                    <TagIcon className="h-3 w-3" /> {t}
                  </Link>
                ))}
              </div>
            )}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-lg leading-relaxed text-slate-600">
                {post.excerpt}
              </p>
            )}
            <div className="mt-5 flex items-center gap-4 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="h-4 w-4" />
                {new Date(date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                {minutes} min read
              </span>
            </div>
          </header>

          {post.cover_image_url && (
            <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-card bg-slate-100">
              <Image
                src={post.cover_image_url}
                alt={post.title}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="object-cover"
                priority
              />
            </div>
          )}

          {/*
           * Content is HTML produced by the Tiptap WYSIWYG editor in
           * /admin/blogs. Only ADMIN_USER_IDS can write to this table
           * (writes go through the service role with isAdmin() gating),
           * so the source is trusted — no extra sanitization needed.
           * `prose` styles come from @tailwindcss/typography.
           */}
          <div
            className="prose prose-slate prose-lg max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-card"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
        </article>

        <div className="mt-16 border-t border-slate-200 pt-8 text-center">
          <p className="text-sm text-slate-600">
            Liked this post? Refrd helps job seekers get referred by verified
            employees.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/jobs"
              className="inline-flex items-center justify-center rounded-btn bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
            >
              Browse open roles
            </Link>
            <Link
              href="/blogs"
              className="inline-flex items-center justify-center rounded-btn border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-50"
            >
              More posts
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
