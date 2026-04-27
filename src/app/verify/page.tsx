import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { VerifyForm } from './VerifyForm'

export const dynamic = 'force-dynamic'

export default async function VerifyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/verify')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, verification_status, company_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Verify employee status</h1>
        <p className="text-sm text-slate-600">
          Verified referrers earn higher reputation and rank higher in search. Your work email is
          stored securely and never shown publicly.
        </p>
        <VerifyForm
          status={profile?.verification_status ?? 'unverified'}
          companyName={profile?.company_name}
        />
      </main>
      <Footer />
    </div>
  )
}
