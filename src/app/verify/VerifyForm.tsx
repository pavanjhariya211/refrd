'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { ShieldCheck, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import type { VerificationStatus } from '@/types'

interface Props {
  status: VerificationStatus
  companyName?: string | null
}

export function VerifyForm({ status, companyName }: Props) {
  const [workEmail, setWorkEmail] = useState('')
  const [company, setCompany] = useState(companyName ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(status === 'pending')

  async function submit() {
    if (!workEmail.includes('@') || !company) {
      toast.error('Provide your work email and company.')
      return
    }
    setSubmitting(true)
    const supabase = createClient()
    // work_email is stored only on the server-controlled column; never selected publicly.
    const { error } = await supabase
      .from('profiles')
      .update({
        work_email: workEmail,
        company_name: company,
        verification_status: 'pending',
      })
      .eq('id', (await supabase.auth.getUser()).data.user!.id)
    setSubmitting(false)
    if (error) {
      toast.error(error.message)
      return
    }
    toast.success("Verification request sent. We'll email you within 1 business day.")
    setSubmitted(true)
  }

  return (
    <div className="card mt-6 space-y-4">
      <div className="flex items-start gap-3 rounded-card bg-blue-50 p-4 text-sm text-primary">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
        <div>
          <p className="font-semibold">Why verification matters</p>
          <p className="mt-1 text-primary/80">
            Verified employees show a blue badge on every job and rank higher in seeker search.
            Your work email is private and used only to confirm employment.
          </p>
        </div>
      </div>

      {status === 'verified' ? (
        <div className="rounded-card bg-green-50 p-4 text-sm text-success">
          You&apos;re verified. <ShieldCheck className="inline h-4 w-4" />
        </div>
      ) : submitted ? (
        <div className="rounded-card bg-amber-50 p-4 text-sm text-warning">
          <Mail className="inline h-4 w-4" /> Verification pending. We&apos;ll review within 1 business day.
        </div>
      ) : (
        <>
          <Input
            label="Company name"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
          <Input
            type="email"
            label="Work email"
            placeholder="you@company.com"
            hint="Must match a domain you own as an employee. Stored privately."
            value={workEmail}
            onChange={(e) => setWorkEmail(e.target.value)}
          />
          <div className="flex justify-end">
            <Button onClick={submit} loading={submitting}>
              Submit for verification
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
