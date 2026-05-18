import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/admin'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { BlogEditor } from '../BlogEditor'

export const dynamic = 'force-dynamic'

export default async function NewBlogPostPage() {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/admin/blogs/new')
  if (!isAdmin(user.id)) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">
        <BlogEditor
          postId={null}
          initial={{
            title: '',
            slug: '',
            content_html: '',
            status: 'draft',
            tags: [],
          }}
        />
      </main>
      <Footer />
    </div>
  )
}
