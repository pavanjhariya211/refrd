/**
 * Helpers shared by the blog admin (slug generation, excerpt fallback,
 * publish-status interpretation) and the public /blogs routes.
 */
import type { BlogPost } from '@/types'

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip diacritics
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

/**
 * Strip HTML tags and collapse whitespace. Used for auto-generating an
 * excerpt and meta_description when the author leaves them blank.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function autoExcerpt(html: string, max = 200): string {
  const text = stripHtml(html)
  if (text.length <= max) return text
  return text.slice(0, max).replace(/\s+\S*$/, '') + '…'
}

/**
 * Public-visible if status is 'published' AND published_at is in the past
 * (or null, meaning "publish now"). Mirrors the RLS policy.
 */
export function isLive(post: Pick<BlogPost, 'status' | 'published_at'>): boolean {
  if (post.status !== 'published') return false
  if (!post.published_at) return true
  return new Date(post.published_at).getTime() <= Date.now()
}

/**
 * Rough reading-time estimate at 220 wpm. Shown on the post header and
 * useful for the listing card.
 */
export function readingMinutes(html: string): number {
  const words = stripHtml(html).split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 220))
}
