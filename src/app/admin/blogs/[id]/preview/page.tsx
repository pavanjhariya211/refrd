import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Calendar, Clock, Edit, Eye, Tag as TagIcon } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/server'
import { isBlogAdmin } from '@/lib/blog-admin-auth'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { readingMinutes } from '@/lib/blog'
import type { BlogPost } from '@/types'

// Never cached — admins need to see the latest draft after every save.
export const dynamic = 'force-dynamic'

// Drafts must not be indexable even if someone shares the preview URL.
export const metadata = {
  title: 'Draft preview',
  robots: { index: false, follow: false },
}

export default async function BlogPostPreviewPage({
  params,
}: {
  params: { id: string }
}) {
  if (!isBlogAdmin()) {
    redirect(`/admin/login?next=/admin/blogs/${params.id}/preview`)
  }

  // Service role so drafts and scheduled (future-published) posts are
  // visible — public RLS would hide both.
  const service = createServiceClient()
  const { data } = await service
    .from('blog_posts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) notFound()
  const post = data as BlogPost

  const date = post.published_at ?? post.created_at
  const minutes = readingMinutes(post.content_html)
  const scheduled =
    post.status === 'published' &&
    post.published_at &&
    new Date(post.published_at).getTime() > Date.now()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Banner so the preview is never mistaken for the live post. */}
      <div className="border-b border-amber-500/20 bg-amber-500/10">
        <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm text-amber-200">
          <span className="inline-flex items-center gap-2">
            <Eye className="h-4 w-4" />
            <strong>
              {post.status === 'draft'
                ? 'Draft preview'
                : scheduled
                  ? 'Scheduled preview'
                  : 'Live post preview'}
            </strong>
            <span className="text-amber-300">
              · only visible to admins. <code className="rounded bg-amber-500/15 px-1">noindex</code> applied.
            </span>
          </span>
          <Link
            href={`/admin/blogs/${post.id}/edit`}
            className="inline-flex items-center gap-1 rounded-btn bg-amber-900 px-3 py-1 text-xs font-semibold text-white hover:bg-amber-800"
          >
            <Edit className="h-3 w-3" /> Edit
          </Link>
        </div>
      </div>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <Link
          href="/admin/blogs"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-text-faint hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" /> All posts
        </Link>

        <article>
          <header className="mb-8">
            {post.tags?.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-pill bg-brand-50 px-2.5 py-0.5 text-[11px] font-medium text-primary"
                  >
                    <TagIcon className="h-3 w-3" /> {t}
                  </span>
                ))}
              </div>
            )}
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-text sm:text-5xl">
              {post.title || <span className="text-text-faint">Untitled draft</span>}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-lg leading-relaxed text-text-soft">
                {post.excerpt}
              </p>
            )}
            <div className="mt-5 flex items-center gap-4 text-sm text-text-faint">
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
            <div className="relative mb-10 aspect-[16/9] w-full overflow-hidden rounded-card bg-white/[0.06]">
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

          <div
            className="prose prose-invert prose-lg max-w-none prose-headings:font-extrabold prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-card"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
        </article>
      </main>
      <Footer />
    </div>
  )
}
