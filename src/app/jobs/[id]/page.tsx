import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Briefcase, Clock, MapPin, Trophy, Users, Star, BadgeCheck, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { PUBLIC_REFERRER_FIELDS } from '@/lib/constants'
import { formatINR, formatRelativeTime } from '@/lib/utils'
import { Navbar } from '@/components/layouts/Navbar'
import { Footer } from '@/components/layouts/Footer'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'
import { SkillPill } from '@/components/ui/SkillPill'
import { VerifiedBadge } from '@/components/ui/VerifiedBadge'
import { JobApplyPanel } from './JobApplyPanel'
import type { JobPost } from '@/types'

export const dynamic = 'force-dynamic'

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: jobData } = await supabase
    .from('job_posts')
    .select(`*, referrer:profiles!referrer_id(${PUBLIC_REFERRER_FIELDS})`)
    .eq('id', params.id)
    .single()
  const job = jobData as unknown as JobPost | null
  if (!job) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <div className="card">
              <div className="flex items-start gap-4">
                <CompanyAvatar name={job.company_name} size="lg" />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-extrabold text-slate-900">{job.title}</h1>
                    <VerifiedBadge status={job.referrer?.verification_status ?? 'unverified'} showLabel />
                  </div>
                  <p className="text-slate-700">{job.company_name}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-600">
                    {job.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {job.location} · {job.location_type}
                      </span>
                    )}
                    {job.experience_level && (
                      <span className="inline-flex items-center gap-1">
                        <Briefcase className="h-4 w-4" />
                        {job.experience_level}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Posted {formatRelativeTime(job.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {job.skills?.length > 0 && (
                <div className="mt-5">
                  <h2 className="mb-2 text-sm font-semibold text-slate-900">Skills required</h2>
                  <div className="flex flex-wrap gap-1.5">
                    {job.skills.map((s) => (
                      <SkillPill key={s} skill={s} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {job.description && (
              <div className="card">
                <h2 className="text-lg font-bold text-slate-900">About this role</h2>
                <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-slate-700">
                  {job.description}
                </div>
              </div>
            )}

            {job.interview_process && (
              <div className="card">
                <h2 className="text-lg font-bold text-slate-900">Interview process</h2>
                <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-slate-700">
                  {job.interview_process}
                </div>
              </div>
            )}

            <div className="card">
              <h2 className="text-lg font-bold text-slate-900">Your referrer</h2>
              <p className="text-sm text-slate-600">
                Identity is protected until you&apos;re referred. Here&apos;s their public reputation.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-card bg-slate-50 p-3">
                  <Star className="h-4 w-4 text-warning" />
                  <p className="mt-1 text-lg font-bold">{job.referrer?.reputation_score ?? 0}</p>
                  <p className="text-xs text-slate-500">Reputation</p>
                </div>
                <div className="rounded-card bg-slate-50 p-3">
                  <ShieldCheck className="h-4 w-4 text-success" />
                  <p className="mt-1 text-lg font-bold">{job.referrer?.successful_referrals ?? 0}</p>
                  <p className="text-xs text-slate-500">Successful referrals</p>
                </div>
                <div className="rounded-card bg-slate-50 p-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <p className="mt-1 text-lg font-bold">
                    {job.referrer?.avg_response_days ?? '—'}d
                  </p>
                  <p className="text-xs text-slate-500">Avg response</p>
                </div>
                <div className="rounded-card bg-slate-50 p-3">
                  <BadgeCheck className="h-4 w-4 text-primary" />
                  <p className="mt-1 text-lg font-bold capitalize">
                    {job.referrer?.verification_status ?? 'unverified'}
                  </p>
                  <p className="text-xs text-slate-500">Status</p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <JobApplyPanel job={job} />
            <div className="rounded-card border border-slate-200 bg-white p-4 text-xs text-slate-600">
              <p className="font-semibold text-slate-900">Buyer protection</p>
              <ul className="mt-2 space-y-1.5">
                <li>• Full refund if the referrer declines</li>
                <li>• Auto-refund after 7 days of inactivity</li>
                <li>• Razorpay-secured checkout</li>
                <li>• Bids are reviewed highest to lowest</li>
              </ul>
            </div>
            <Link
              href="/jobs"
              className="block text-center text-sm text-slate-500 hover:text-primary"
            >
              ← Back to all jobs
            </Link>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  )
}
