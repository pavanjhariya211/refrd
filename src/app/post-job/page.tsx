import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { PostJobForm } from '@/components/forms/PostJobForm'

export default async function PostJobPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/post-job')

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Post a job</h1>
        <p className="mt-1 text-sm text-slate-600">
          Job seekers will bid to apply. Highest bid is reviewed first. You earn 85% of each
          confirmed referral.
        </p>
        <div className="mt-6">
          <PostJobForm userId={user.id} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
