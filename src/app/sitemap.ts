import type { MetadataRoute } from 'next'
import { createPublicClient } from '@/lib/supabase/server'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://refrd-ruby.vercel.app'

// Revalidate the sitemap hourly so newly-posted jobs get discovered
// without rebuilding the whole app.
export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  const staticEntries: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/jobs`, lastModified: now, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/for-job-seekers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/for-referrers`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/post-job`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE_URL}/auth/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/auth/login`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ]

  // Every active job post is its own indexable page. Cookie-free client
  // so this route stays statically revalidated rather than dynamic.
  let jobEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createPublicClient()
    const { data: jobs } = await supabase
      .from('job_posts')
      .select('id, updated_at, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(5000)

    jobEntries = (jobs ?? []).map((j) => ({
      url: `${SITE_URL}/jobs/${j.id}`,
      lastModified: new Date(j.updated_at ?? j.created_at ?? now),
      changeFrequency: 'daily',
      priority: 0.8,
    }))
  } catch (err) {
    // A sitemap that's missing job URLs is better than a 500 — static
    // entries always go out even if the DB read hiccups.
    console.error('[sitemap] failed to load job posts:', err)
  }

  // Published, non-future blog posts. Same cookie-free client so the
  // sitemap stays static-revalidated.
  let blogEntries: MetadataRoute.Sitemap = []
  try {
    const supabase = createPublicClient()
    const { data: posts } = await supabase
      .from('blog_posts')
      .select('slug, updated_at, published_at')
      .eq('status', 'published')
      .lte('published_at', new Date().toISOString())
      .order('published_at', { ascending: false })
      .limit(5000)

    blogEntries = (posts ?? []).map((p) => ({
      url: `${SITE_URL}/blogs/${p.slug}`,
      lastModified: new Date(p.updated_at ?? p.published_at ?? now),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))

    if (blogEntries.length > 0) {
      staticEntries.push({
        url: `${SITE_URL}/blogs`,
        lastModified: now,
        changeFrequency: 'daily',
        priority: 0.8,
      })
    }
  } catch (err) {
    console.error('[sitemap] failed to load blog posts:', err)
  }

  return [...staticEntries, ...jobEntries, ...blogEntries]
}
