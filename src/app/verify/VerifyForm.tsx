'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, Linkedin } from 'lucide-react'
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

  async function verifyWithLinkedIn() {
    if (!company.trim()) {
      toast.error('Enter the company you can refer to.')
      return
    }
    setSubmitting(true)
    const supabase = createClient()

    // Persist the company before redirecting so it's there when the user returns.
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      toast.error('Please sign in again.')
      setSubmitting(false)
      return
    }
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ company_name: company.trim() })
      .eq('id', userData.user.id)
    if (profileErr) {
      toast.error(profileErr.message)
      setSubmitting(false)
      return
    }

    const redirectTo = `${window.location.origin}/auth/verify-callback`
    const { data, error } = await supabase.auth.linkIdentity({
      provider: 'linkedin_oidc',
      options: { redirectTo },
    })
    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }
    if (data?.url) window.location.href = data.url
  }

  const isVerified = status === 'verified' && !!linkedinVerifiedAt

  return (
    <div className="card mt-6 space-y-4">
      <div className="flex items-start gap-3 rounded-card bg-blue-50 p-4 text-sm text-primary">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Why verification matters</p>
          <p className="mt-1 text-primary/80">
            Verified employees show a blue badge on every job and rank higher in seeker search. We
            verify by linking your LinkedIn account via OAuth — your LinkedIn URL is already public,
            and the link confirms you control the account.
          </p>
        </div>
      </div>

      {isVerified ? (
        <div className="rounded-card bg-green-50 p-4 text-sm text-success">
          <ShieldCheck className="mr-1 inline h-4 w-4" /> LinkedIn linked &amp; verified.
          {linkedinVerifiedAt && (
            <span className="ml-1 text-xs text-success/80">
              ({new Date(linkedinVerifiedAt).toLocaleDateString()})
            </span>
          )}
        </div>
      ) : status === 'pending' ? (
        <div className="rounded-card bg-amber-50 p-4 text-sm text-warning">
          Verification pending. Finish the LinkedIn flow if you closed the popup, or try again below.
        </div>
      ) : null}

      <Input
        label="Company name"
        hint="The company you can refer candidates to."
        value={company}
        onChange={(e) => setCompany(e.target.value)}
      />

      <Button onClick={verifyWithLinkedIn} loading={submitting} fullWidth>
        <Linkedin className="h-4 w-4" />
        {isVerified ? 'Re-link LinkedIn' : 'Verify with LinkedIn'}
      </Button>

      <p className="text-xs text-slate-500">
        We use Supabase&apos;s LinkedIn OIDC provider. We only read your name, profile URL, and
        avatar — never your password or your network.
      </p>
    </div>
  )
}
