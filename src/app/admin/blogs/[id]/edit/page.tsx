import { redirect, notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { BlogEditor } from '../../BlogEditor'
import type { BlogPost } from '@/types'

export const dynamic = 'force-dynamic'

export default async function EditBlogPostPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect(`/auth/login?next=/admin/blogs/${params.id}/edit`)
  if (!isAdmin(user.id)) notFound()

  const service = createServiceClient()
  const { data } = await service
    .from('blog_posts')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!data) notFound()
  const post = data as BlogPost

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <BlogEditor
          postId={post.id}
          initial={{
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            content_html: post.content_html,
            cover_image_url: post.cover_image_url,
            og_image_url: post.og_image_url,
            meta_description: post.meta_description,
            tags: post.tags ?? [],
            status: post.status,
            published_at: post.published_at,
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
