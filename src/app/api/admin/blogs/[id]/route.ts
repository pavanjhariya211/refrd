import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import { isBlogAdmin } from '@/lib/blog-admin-auth'
import { slugify, autoExcerpt } from '@/lib/blog'

export const runtime = 'nodejs'

/** PATCH /api/admin/blogs/[id] — update fields, change status, schedule. */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!isBlogAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })

  const service = createServiceClient()

  // Build the patch defensively — only set keys the caller sent so a
  // partial update (e.g. "just flip status to published") doesn't blank
  // out cover_image_url etc.
  const patch: Record<string, unknown> = {}
  if (typeof body.title === 'string') patch.title = body.title.trim()
  if (typeof body.slug === 'string') {
    const slug = slugify(body.slug)
    if (!slug) {
      return NextResponse.json({ error: 'Invalid slug' }, { status: 400 })
    }
    patch.slug = slug
  }
  if ('excerpt' in body) patch.excerpt = body.excerpt
  if (typeof body.content_html === 'string') {
    patch.content_html = body.content_html
    // Keep excerpt auto-refreshed when the body changes and the author
    // hasn't overridden it. Only do this if they didn't also send excerpt.
    if (!('excerpt' in body)) {
      patch.excerpt = autoExcerpt(body.content_html, 200) || null
    }
  }
  if ('cover_image_url' in body) patch.cover_image_url = body.cover_image_url
  if ('og_image_url' in body) patch.og_image_url = body.og_image_url
  if ('meta_description' in body) patch.meta_description = body.meta_description
  if ('canonical_url' in body) patch.canonical_url = body.canonical_url
  if (Array.isArray(body.tags)) patch.tags = body.tags
  if (body.status === 'draft' || body.status === 'published') {
    patch.status = body.status
    if (body.status === 'published') {
      patch.published_at = body.published_at ?? new Date().toISOString()
    }
  } else if ('published_at' in body) {
    patch.published_at = body.published_at
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  // Pull the existing slug so we can revalidate both old and new paths
  // if a rename happens.
  const { data: existing } = await service
    .from('blog_posts')
    .select('slug')
    .eq('id', params.id)
    .single()

  const { data, error } = await service
    .from('blog_posts')
    .update(patch)
    .eq('id', params.id)
    .select('*')
    .single()

  if (error) {
    const message =
      error.code === '23505'
        ? `Slug "${patch.slug}" is already taken.`
        : error.message
    return NextResponse.json({ error: message }, { status: 400 })
  }

  revalidatePath('/blogs')
  revalidatePath('/sitemap.xml')
  if (existing?.slug) revalidatePath(`/blogs/${existing.slug}`)
  if (patch.slug && patch.slug !== existing?.slug) {
    revalidatePath(`/blogs/${patch.slug}`)
  }

  return NextResponse.json({ post: data })
}

/** DELETE /api/admin/blogs/[id] — hard delete. */
export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!isBlogAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createServiceClient()
  const { data: existing } = await service
    .from('blog_posts')
    .select('slug')
    .eq('id', params.id)
    .single()

  const { error } = await service.from('blog_posts').delete().eq('id', params.id)
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  revalidatePath('/blogs')
  revalidatePath('/sitemap.xml')
  if (existing?.slug) revalidatePath(`/blogs/${existing.slug}`)

  return NextResponse.json({ ok: true })
}
