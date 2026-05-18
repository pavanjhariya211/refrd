import { redirect } from 'next/navigation'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { isBlogAdmin } from '@/lib/blog-admin-auth'
import { AdminLoginForm } from './AdminLoginForm'

// Always re-evaluate the cookie — never serve a cached version of this page.
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin sign in',
  robots: { index: false, follow: false },
}

export default function AdminLoginPage({
  searchParams,
}: {
  searchParams: { next?: string }
}) {
  // Already signed in? Bounce straight to the destination.
  if (isBlogAdmin()) {
    redirect(safeNext(searchParams.next))
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12">
        <div className="rounded-card border border-slate-200 bg-white p-6 shadow-card">
          <h1 className="text-2xl font-extrabold text-slate-900">Admin sign in</h1>
          <p className="mt-1 text-sm text-slate-600">
            Restricted access for blog publishing.
          </p>
          <div className="mt-6">
            <AdminLoginForm next={safeNext(searchParams.next)} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

/** Only allow same-origin relative paths as the post-login redirect. */
function safeNext(next: string | undefined): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return '/admin/blogs'
  }
  return next
}
