import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { isBlogAdmin } from '@/lib/blog-admin-auth'
import { slugify, autoExcerpt } from '@/lib/blog'

export const runtime = 'nodejs'

/**
 * POST /api/admin/blogs — create a new blog post (draft by default,
 * or published immediately if the editor sent status='published').
 * Gated by the standalone blog-admin session cookie. Writes via
 * service role so the table can keep RLS locked to public-read-only.
 */
export async function POST(request: Request) {
  if (!isBlogAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const title = String(body.title ?? '').trim()
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })

  const slugRaw = String(body.slug ?? '').trim() || title
  const slug = slugify(slugRaw)
  if (!slug) {
    return NextResponse.json(
      { error: 'Slug must contain at least one URL-safe character' },
      { status: 400 }
    )
  }

  const status = body.status === 'published' ? 'published' : 'draft'
  const content_html = String(body.content_html ?? '')
  const excerpt =
    typeof body.excerpt === 'string' && body.excerpt.trim()
      ? body.excerpt.trim()
      : autoExcerpt(content_html, 200) || null

  const service = createServiceClient()

  const { data, error } = await service
    .from('blog_posts')
    .insert({
      title,
      slug,
      excerpt,
      content_html,
      cover_image_url: body.cover_image_url ?? null,
      og_image_url: body.og_image_url ?? null,
      meta_description: body.meta_description ?? null,
      canonical_url: body.canonical_url ?? null,
      tags: Array.isArray(body.tags) ? body.tags : [],
      status,
      published_at:
        status === 'published'
          ? body.published_at ?? new Date().toISOString()
          : null,
      author_id: null,
    })
    .select('*')
    .single()

  if (error) {
    // Unique violation on slug — caller should pick a different one.
    const message =
      error.code === '23505'
        ? `Slug "${slug}" is already taken. Pick a different one.`
        : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  // Pop the ISR caches so the new post (if published) shows up immediately.
  revalidatePath('/blogs')
  revalidatePath(`/blogs/${slug}`)
  revalidatePath('/sitemap.xml')

  return NextResponse.json({ post: data })
}
