import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { isBlogAdmin } from '@/lib/blog-admin-auth'
import { BLOG_MEDIA_BUCKET } from '@/lib/constants'

export const runtime = 'nodejs'

const MAX_BYTES = 8 * 1024 * 1024 // 8 MB
const ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
])

/**
 * POST /api/admin/blogs/upload — admin-only image upload for blog
 * cover/inline images. Stores in the public `blog-media` bucket and
 * returns the public URL so the editor can inline it directly.
 */
export async function POST(request: Request) {
  if (!isBlogAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const form = await request.formData().catch(() => null)
  const file = form?.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only PNG, JPEG, WebP, and GIF are allowed.' },
      { status: 400 }
    )
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'File is too large (8 MB max).' },
      { status: 400 }
    )
  }

  const ext = (file.name.split('.').pop() || 'png').toLowerCase()
  // Single 'admin' folder — the blog admin auth is a shared credential,
  // not per-user, so per-uid foldering would be misleading.
  const path = `admin/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}.${ext}`

  const service = createServiceClient()
  const bytes = new Uint8Array(await file.arrayBuffer())

  const { error: upErr } = await service.storage
    .from(BLOG_MEDIA_BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      cacheControl: '31536000', // 1 year — images are immutable per path
      upsert: false,
    })
  if (upErr) {
    return NextResponse.json({ error: upErr.message }, { status: 500 })
  }

  const { data: pub } = service.storage.from(BLOG_MEDIA_BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: pub.publicUrl, path })
}
