import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { AdminSignOutButton } from './AdminSignOutButton'
import { createServiceClient } from '@/lib/supabase/server'
import { isBlogAdmin } from '@/lib/blog-admin-auth'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { Button } from '@/components/ui/Button'
import { AdminBlogList, type AdminBlogRow } from './AdminBlogList'

// Admin lists drafts too, so the page reads via service role and we
// force dynamic — no caching of unpublished content.
export const dynamic = 'force-dynamic'

export default async function AdminBlogsPage() {
  // Dedicated username/password auth (no Supabase / LinkedIn). See
  // src/lib/blog-admin-auth.ts.
  if (!isBlogAdmin()) redirect('/admin/login?next=/admin/blogs')

  const service = createServiceClient()
  const { data } = await service
    .from('blog_posts')
    .select('id, slug, title, status, published_at, tags, updated_at, created_at')
    .order('updated_at', { ascending: false })
    .limit(200)

  const rows = (data ?? []) as AdminBlogRow[]

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-text">Blog admin</h1>
            <p className="text-sm text-text-soft">
              Write, edit, schedule, and publish posts. Published posts go live
              at <code className="rounded bg-white/[0.06] px-1">/blogs/[slug]</code>.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <AdminSignOutButton />
            <Link href="/admin/blogs/new">
              <Button>
                <Plus className="h-4 w-4" /> New post
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <AdminBlogList initialRows={rows} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
