import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'
import { SkillPill } from '@/components/ui/SkillPill'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { Linkedin, Github } from 'lucide-react'
import type { Profile } from '@/types'

export const dynamic = 'force-dynamic'

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('profiles')
    .select(
      'id, name, profile_photo, headline, location, bio, user_type, verification_status, company_name, linkedin_url, linkedin_verified_at, github_url, skills, reputation_score, total_referrals, successful_referrals, avg_response_days, is_open_to_work, created_at, updated_at'
    )
    .eq('id', params.id)
    .maybeSingle()
  const profile = data as Profile | null
  if (!profile) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
        <div className="card">
          <div className="flex items-start gap-4">
            <CompanyAvatar name={profile.name} src={profile.profile_photo} size="xl" />
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{profile.name ?? 'Anonymous'}</h1>
                <VerifiedBadge status={profile.verification_status} showLabel />
                {profile.is_open_to_work && (
                  <span className="pill bg-green-50 text-success">Open to work</span>
                )}
              </div>
              <p className="text-slate-700">{profile.headline}</p>
              <p className="text-sm text-slate-500">{profile.location}</p>
              <div className="mt-2 flex gap-3">
                {profile.linkedin_url && (
                  <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-primary">
                    <Linkedin className="h-4 w-4" />
                  </a>
                )}
                {profile.github_url && (
                  <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-primary">
                    <Github className="h-4 w-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {profile.bio && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-slate-900">About</h2>
              <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{profile.bio}</p>
            </div>
          )}

          {profile.skills?.length > 0 && (
            <div className="mt-5">
              <h2 className="text-sm font-semibold text-slate-900">Skills</h2>
              <div className="mt-1 flex flex-wrap gap-1.5">
                {profile.skills.map((s) => <SkillPill key={s} skill={s} />)}
              </div>
            </div>
          )}

          {(profile.user_type === 'referrer' || profile.user_type === 'both') && (
            <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-5 text-center">
              <div>
                <p className="text-xs uppercase text-slate-500">Reputation</p>
                <p className="text-2xl font-extrabold">{profile.reputation_score}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Referrals</p>
                <p className="text-2xl font-extrabold">{profile.total_referrals}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-slate-500">Successful</p>
                <p className="text-2xl font-extrabold text-success">{profile.successful_referrals}</p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
