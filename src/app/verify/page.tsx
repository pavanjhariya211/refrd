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
    .select('id, verification_status, company_name, linkedin_url, linkedin_verified_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">Verification</h1>
        <p className="text-sm text-slate-600">
          Refrd verifies referrers via LinkedIn at signup. The badge on your job posts
          turns on automatically when the company you set below matches the employer on
          your LinkedIn profile.
        </p>
        <VerifyForm
          status={profile?.verification_status ?? 'unverified'}
          companyName={profile?.company_name}
          linkedinVerifiedAt={profile?.linkedin_verified_at ?? null}
        />
      </main>
      <Footer />
    </div>
  )
}
