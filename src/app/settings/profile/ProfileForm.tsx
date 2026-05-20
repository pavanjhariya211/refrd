'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { SkillPill } from '@/components/ui/SkillPill'
import type { Profile, UserType } from '@/types'

export function ProfileForm({ profile }: { profile: Profile }) {
  const [name, setName] = useState(profile.name ?? '')
  const [headline, setHeadline] = useState(profile.headline ?? '')
  const [location, setLocation] = useState(profile.location ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [linkedinUrl, setLinkedinUrl] = useState(profile.linkedin_url ?? '')
  const [githubUrl, setGithubUrl] = useState(profile.github_url ?? '')
  const [companyName, setCompanyName] = useState(profile.company_name ?? '')
  const [userType, setUserType] = useState<UserType>(profile.user_type)
  const [openToWork, setOpenToWork] = useState(profile.is_open_to_work)
  const [skills, setSkills] = useState<string[]>(profile.skills ?? [])
  const [skillInput, setSkillInput] = useState('')
  const [saving, setSaving] = useState(false)

  function addSkill() {
    const next = skillInput.trim()
    if (!next) return
    if (!skills.includes(next)) setSkills([...skills, next])
    setSkillInput('')
  }

  async function save() {
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('profiles')
      .update({
        name,
        headline,
        location,
        bio,
        linkedin_url: linkedinUrl || null,
        github_url: githubUrl || null,
        company_name: companyName || null,
        user_type: userType,
        is_open_to_work: openToWork,
        skills,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id)
    setSaving(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Profile saved')
  }

  return (
    <div className="card space-y-4">
      <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} />
      <Input label="Headline" placeholder="Senior backend engineer at …" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
      <Textarea label="Bio" value={bio} onChange={(e) => setBio(e.target.value)} maxLength={1000} showCount />
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="LinkedIn URL" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)} />
        <Input label="GitHub URL" value={githubUrl} onChange={(e) => setGithubUrl(e.target.value)} />
      </div>
      <Input label="Company name" hint="If you're a referrer, the company you can refer to." value={companyName} onChange={(e) => setCompanyName(e.target.value)} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-soft">Account type</label>
        <div className="grid grid-cols-3 gap-2">
          {(['jobseeker', 'referrer', 'both'] as UserType[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setUserType(t)}
              className={
                'rounded-btn border px-3 py-2 text-sm font-medium capitalize ' +
                (userType === t
                  ? 'border-primary bg-brand-50 text-primary'
                  : 'border-border text-text-soft hover:bg-white/[0.04]')
              }
            >
              {t === 'jobseeker' ? 'Job seeker' : t}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={openToWork}
          onChange={(e) => setOpenToWork(e.target.checked)}
        />
        I&apos;m open to work
      </label>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-text-soft">Skills</label>
        <div className="flex gap-2">
          <Input
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            placeholder="React, TypeScript, …"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addSkill()
              }
            }}
          />
          <Button variant="outline" type="button" onClick={addSkill}>Add</Button>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <SkillPill key={s} skill={s} onRemove={() => setSkills(skills.filter((x) => x !== s))} />
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button loading={saving} onClick={save}>Save profile</Button>
      </div>
    </div>
  )
}
