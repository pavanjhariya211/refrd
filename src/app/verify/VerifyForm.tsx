'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { VerificationStatus } from '@/types'

interface Props {
  status: VerificationStatus
  companyName?: string | null
  linkedinVerifiedAt?: string | null
}

export function VerifyForm({ status, companyName, linkedinVerifiedAt }: Props) {
  const [company, setCompany] = useState(companyName ?? '')
  const [submitting, setSubmitting] = useState(false)

  async function saveCompany() {
    if (!company.trim()) {
      toast.error('Enter the company you can refer to.')
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      toast.error('Please sign in again.')
      setSubmitting(false)
      return
    }
    const { error } = await supabase
      .from('profiles')
      .update({ company_name: company.trim() })
      .eq('id', userData.user.id)
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success('Saved.')
  }

  const isVerified = status === 'verified' && !!linkedinVerifiedAt

  return (
    <div className="card mt-6 space-y-4">
      <div
        className={
          'flex items-start gap-3 rounded-card p-4 text-sm ' +
          (isVerified ? 'bg-green-500/10 text-success' : 'bg-amber-500/10 text-warning')
        }
      >
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">
            {isVerified ? 'LinkedIn linked & verified' : 'LinkedIn link missing'}
          </p>
          <p className="mt-1 text-xs opacity-90">
            {isVerified
              ? linkedinVerifiedAt
                ? `Linked on ${new Date(linkedinVerifiedAt).toLocaleDateString()}.`
                : 'Linked.'
              : 'You signed in without a LinkedIn identity. Sign out and sign back in with LinkedIn.'}
          </p>
        </div>
      </div>

      <Input
        label="Company you can refer to"
        hint="Used to show a Verified Employee badge on your job posts when this matches the company on your LinkedIn profile."
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />

      <div className="flex justify-end">
        <Button onClick={saveCompany} loading={submitting} disabled={!isVerified}>
          Save company
        </Button>
      </div>
    </div>
  )
}
