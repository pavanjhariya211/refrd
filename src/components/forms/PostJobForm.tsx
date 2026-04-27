'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { SkillPill } from '@/components/ui/SkillPill'
import { EXPERIENCE_LEVELS, LOCATION_TYPES } from '@/lib/constants'
import type { ExperienceLevel, JobStatus, LocationType } from '@/types'

export function PostJobForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [title, setTitle] = useState('')
  const [department, setDepartment] = useState('')
  const [location, setLocation] = useState('')
  const [locationType, setLocationType] = useState<LocationType>('remote')
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('1-3yrs')
  const [description, setDescription] = useState('')
  const [interview, setInterview] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [skills, setSkills] = useState<string[]>([])
  const [openings, setOpenings] = useState(1)
  const [minBid, setMinBid] = useState(0)
  const [referralBonus, setReferralBonus] = useState('')
  const [deadline, setDeadline] = useState('')

  function addSkill() {
    const next = skillInput.trim()
    if (!next) return
    if (!skills.includes(next)) setSkills([...skills, next])
    setSkillInput('')
  }

  async function submit(status: JobStatus) {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('job_posts')
      .insert({
        referrer_id: userId,
        company_name: companyName,
        title,
        department: department || null,
        location: location || null,
        location_type: locationType,
        experience_level: experienceLevel,
        skills,
        description,
        interview_process: interview || null,
        deadline: deadline || null,
        referral_bonus: referralBonus || null,
        min_bid: minBid,
        openings,
        status,
      })
      .select('id')
      .single()
    setLoading(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success(status === 'active' ? 'Job posted!' : 'Saved as draft')
    router.push(`/jobs/${data!.id}`)
  }

  const canProceed1 = companyName && title && experienceLevel
  const canProceed2 = description.length > 50

  return (
    <div className="card space-y-6">
      <div className="flex items-center gap-2 text-xs text-slate-500">
        {[1, 2, 3].map((n) => (
          <div key={n} className="flex flex-1 items-center gap-2">
            <div
              className={
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ' +
                (step >= n ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400')
              }
            >
              {n}
            </div>
            <span className={step === n ? 'font-semibold text-slate-900' : ''}>
              {n === 1 ? 'Basics' : n === 2 ? 'Role detail' : 'Bid & publish'}
            </span>
            {n < 3 && <div className="h-px flex-1 bg-slate-200" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <Input
            label="Company name"
            required
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
          <Input
            label="Role title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
            <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Location type</label>
            <div className="flex flex-wrap gap-2">
              {LOCATION_TYPES.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLocationType(opt.value)}
                  className={
                    'rounded-btn border px-3 py-1.5 text-sm font-medium ' +
                    (locationType === opt.value
                      ? 'border-primary bg-brand-50 text-primary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Experience level</label>
            <div className="flex flex-wrap gap-2">
              {EXPERIENCE_LEVELS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExperienceLevel(opt.value)}
                  className={
                    'rounded-btn border px-3 py-1.5 text-sm font-medium ' +
                    (experienceLevel === opt.value
                      ? 'border-primary bg-brand-50 text-primary'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50')
                  }
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setStep(2)} disabled={!canProceed1}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <Textarea
            label="Role description"
            placeholder="What will the candidate be doing? What do they need to succeed?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            hint="Min 50 characters"
            className="min-h-[180px]"
          />
          <Textarea
            label="Interview process (optional)"
            value={interview}
            onChange={(e) => setInterview(e.target.value)}
            placeholder="2 rounds: technical + system design"
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Skills required</label>
            <div className="flex gap-2">
              <Input
                placeholder="Add a skill and press Enter"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    addSkill()
                  }
                }}
              />
              <Button variant="outline" type="button" onClick={addSkill}>
                Add
              </Button>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {skills.map((s) => (
                <SkillPill
                  key={s}
                  skill={s}
                  onRemove={() => setSkills(skills.filter((x) => x !== s))}
                />
              ))}
            </div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button onClick={() => setStep(3)} disabled={!canProceed2}>
              Next →
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              type="number"
              label="Minimum bid (₹)"
              value={minBid || ''}
              onChange={(e) => setMinBid(Number(e.target.value))}
              hint="Set 0 to allow any bid"
              prefix="₹"
              min={0}
            />
            <Input
              type="number"
              label="Openings"
              value={openings}
              onChange={(e) => setOpenings(Number(e.target.value))}
              min={1}
            />
          </div>
          <Input
            label="Referral bonus (optional)"
            placeholder="e.g. ₹50,000 for successful hire"
            value={referralBonus}
            onChange={(e) => setReferralBonus(e.target.value)}
          />
          <Input
            type="date"
            label="Deadline (optional)"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <div className="rounded-card bg-slate-50 p-4 text-xs text-slate-600">
            <strong>Reminder:</strong> Refrd takes a 15% platform fee (min ₹50). The remainder
            credits to your wallet the moment you submit a referral.
          </div>
          <div className="flex flex-wrap justify-between gap-2">
            <Button variant="ghost" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" loading={loading} onClick={() => submit('draft')}>
                Save draft
              </Button>
              <Button loading={loading} onClick={() => submit('active')}>
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
