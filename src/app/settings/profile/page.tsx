import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { ProfileForm } from './ProfileForm'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function ProfileSettingsPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login?next=/settings/profile')

  const { data } = await supabase
    .from('profiles')
    .select(
      'id, email, name, profile_photo, headline, location, bio, user_type, verification_status, company_name, linkedin_url, linkedin_verified_at, github_url, skills, reputation_score, total_referrals, successful_referrals, avg_response_days, is_open_to_work, created_at, updated_at'
    )
    .eq('id', user.id)
    .single()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Profile settings</h1>
        <p className="text-sm text-slate-600">
          Your profile is what referrers and applicants see. Keep it sharp.
        </p>
        <div className="mt-6">
          <ProfileForm profile={data as Profile} />
        </div>
      </main>
      <Footer />
    </div>
  )
}
