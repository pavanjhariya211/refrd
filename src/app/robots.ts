import type { MetadataRoute } from 'next'

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://refrd-ruby.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Default rule covers Googlebot, Bingbot, and AI crawlers
        // (GPTBot, ClaudeBot, PerplexityBot, Google-Extended) — all
        // allowed, since AEO depends on those bots being able to read
        // and cite the content. Auth-gated and machine-only routes are
        // disallowed: nothing useful for search there, and we don't
        // want OAuth callback URLs or API endpoints indexed.
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/dashboard/',
          '/messages',
          '/settings/',
          '/admin/',
          '/auth/callback',
          '/auth/verify-callback',
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
