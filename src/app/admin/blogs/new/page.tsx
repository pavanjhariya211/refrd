import { redirect } from 'next/navigation'
import { isBlogAdmin } from '@/lib/blog-admin-auth'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { BlogEditor } from '../BlogEditor'

export const dynamic = 'force-dynamic'

export default async function NewBlogPostPage() {
  if (!isBlogAdmin()) redirect('/admin/login?next=/admin/blogs/new')

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
