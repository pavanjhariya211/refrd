'use client'

import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import confetti from 'canvas-confetti'
import { CheckCircle2, FileUp, Sparkles, X, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatINR } from '@/lib/utils'
import { useUser } from '@/hooks/useUser'
import { useLiveBid } from '@/hooks/useLiveBid'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { BidDisplay } from '@/components/ui/BidDisplay'
import { BidRankIndicator } from '@/components/ui/BidRankIndicator'
import { ScorePanel, ScorePanelSkeleton } from '@/components/ui/ScorePanel'
import { FREE_MATCH_CHECK_LIMIT } from '@/lib/constants'
import type { JobPost, MatchScore } from '@/types'

interface Props {
  job: JobPost
  onClose: () => void
}

declare global {
  interface Window {
    Razorpay: any
  }
}

type Step = 'resume' | 'bid' | 'pay' | 'success'

export function ApplyModal({ job, onClose }: Props) {
  const { user } = useUser()
  const supabase = createClient()
  const live = useLiveBid(job.id, {
    minBid: job.min_bid,
    currentHighestBid: job.current_highest_bid,
    applicantCount: job.applications_count,
  })

  const [step, setStep] = useState<Step>('resume')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [resumeUrl, setResumeUrl] = useState<string | null>(null)
  const [resumeText, setResumeText] = useState<string>('')
  const [coverNote, setCoverNote] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')

  // Quick match state
  const [quickScore, setQuickScore] = useState<MatchScore | null>(null)
  const [quickLoading, setQuickLoading] = useState(false)
  const [quickUsed, setQuickUsed] = useState<number | null>(null)
  const [quickError, setQuickError] = useState<string | null>(null)

  // Bid state
  const [bid, setBid] = useState<number>(Math.max(live.minBid, 500))
  const [allBids, setAllBids] = useState<number[]>([])
  const [paying, setPaying] = useState(false)

  // Success state
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [bidRank, setBidRank] = useState<number | null>(null)
  const [bidTotal, setBidTotal] = useState<number | null>(null)
  const [score, setScore] = useState<MatchScore | null>(null)
  const [scoreLoading, setScoreLoading] = useState(false)

  const dropRef = useRef<HTMLLabelElement | null>(null)

  useEffect(() => {
    // Pull the current bid distribution so the rank indicator is accurate.
    supabase
      .from('applications')
      .select('bid_amount')
      .eq('job_id', job.id)
      .eq('payment_status', 'paid')
      .then(({ data }) => setAllBids((data ?? []).map((a) => a.bid_amount)))
  }, [job.id, supabase])

  useEffect(() => {
    // Load Razorpay checkout script once the user reaches the pay step.
    if (step !== 'pay') return
    if (typeof window === 'undefined') return
    if (window.Razorpay) return
    const s = document.createElement('script')
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    s.async = true
    document.body.appendChild(s)
  }, [step])

  async function handleResumeUpload(f: File) {
    if (!user) {
      toast.error('Please sign in')
      return
    }
    if (f.size > 5 * 1024 * 1024) {
      toast.error('Resume must be under 5MB')
      return
    }
    setUploading(true)
    try {
      const path = `${user.id}/${job.id}/${Date.now()}-${f.name.replace(/\s+/g, '_')}`
      const { error: upErr } = await supabase.storage
        .from('resumes')
        .upload(path, f, { upsert: true })
      if (upErr) throw upErr
      const { data: signed } = await supabase.storage
        .from('resumes')
        .createSignedUrl(path, 60 * 60 * 24 * 30)
      setResumeUrl(signed?.signedUrl ?? path)

      // Extract text via server route — text never persists on client.
      const formData = new FormData()
      formData.append('file', f)
      const res = await fetch('/api/extract-resume', { method: 'POST', body: formData })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Extract failed')
      setResumeText(json.text ?? '')
      toast.success('Resume uploaded')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      toast.error(msg)
    } finally {
      setUploading(false)
    }
  }

  async function runQuickMatch() {
    if (!resumeText) {
      toast.error('Upload your resume first')
      return
    }
    setQuickError(null)
    setQuickLoading(true)
    try {
      const res = await fetch('/api/quick-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resume_text: resumeText, job_id: job.id, cover_note: coverNote }),
      })
      const json = await res.json()
      if (res.status === 402) {
        setQuickError(`Free limit reached (${json.used}/${json.limit}). Apply directly to see your full score.`)
        setQuickUsed(json.used)
        return
      }
      if (!res.ok) throw new Error(json.error ?? 'Match check failed')
      setQuickScore({
        id: 'quick',
        application_id: 'quick',
        overall_score: json.overall_score,
        grade: json.grade,
        skills_score: json.skills_score,
        experience_score: json.experience_score,
        relevance_score: json.relevance_score,
        education_score: json.education_score,
        cover_note_score: json.cover_note_score,
        keyword_score: json.keyword_score,
        matched_skills: json.matched_skills,
        missing_skills: json.missing_skills,
        ai_summary: json.ai_summary,
        improvement_tips: json.improvement_tips,
        scored_at: new Date().toISOString(),
      })
      setQuickUsed(json.used)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Match check failed'
      setQuickError(msg)
    } finally {
      setQuickLoading(false)
    }
  }

  async function startPayment() {
    if (bid < live.minBid) {
      toast.error(`Bid must be at least ${formatINR(live.minBid)}`)
      return
    }
    setPaying(true)
    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: job.id, bid_amount: bid }),
      })
      const order = await res.json()
      if (!res.ok) throw new Error(order.error ?? 'Order creation failed')

      await new Promise<void>((resolve) => {
        const interval = setInterval(() => {
          if (typeof window !== 'undefined' && window.Razorpay) {
            clearInterval(interval)
            resolve()
          }
        }, 80)
      })

      const rzp = new window.Razorpay({
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.order_id,
        name: 'Refrd',
        description: job.title,
        handler: async (response: any) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...response,
                job_id: job.id,
                bid_amount: bid,
                resume_url: resumeUrl,
                resume_text: resumeText,
                cover_note: coverNote,
                linkedin_url: linkedinUrl,
                portfolio_url: portfolioUrl,
              }),
            })
            const verifyJson = await verifyRes.json()
            if (!verifyRes.ok) throw new Error(verifyJson.error ?? 'Verification failed')
            setApplicationId(verifyJson.application_id)
            setBidRank(verifyJson.bid_rank)
            setBidTotal(verifyJson.total ?? null)
            setStep('success')
            confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
            pollScore(verifyJson.application_id)
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Payment verification failed'
            toast.error(msg)
            setPaying(false)
          }
        },
        modal: {
          ondismiss: () => setPaying(false),
        },
        prefill: { email: user?.email ?? '' },
        theme: { color: '#1A56DB' },
      })
      rzp.open()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment failed'
      toast.error(msg)
      setPaying(false)
    }
  }

  async function pollScore(appId: string) {
    setScoreLoading(true)
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`/api/score-status/${appId}`)
      const json = await res.json()
      if (json.score) {
        setScore(json.score)
        setScoreLoading(false)
        return
      }
      await new Promise((r) => setTimeout(r, 2000))
    }
    setScoreLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-center bg-slate-900/50 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex h-full w-full flex-col overflow-hidden bg-white shadow-card-hover sm:h-auto sm:max-h-[92vh] sm:max-w-2xl sm:rounded-card">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Step {step === 'resume' ? '1' : step === 'bid' ? '2' : step === 'pay' ? '3' : '✓'} of 3
            </p>
            <h2 className="text-base font-bold text-slate-900">
              Apply to {job.title} at {job.company_name}
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-5">
          {step === 'resume' && (
            <div className="space-y-5">
              <label
                ref={dropRef}
                className="flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center hover:border-primary"
                onDragOver={(e) => {
                  e.preventDefault()
                }}
                onDrop={(e) => {
                  e.preventDefault()
                  const f = e.dataTransfer.files?.[0]
                  if (f) {
                    setFile(f)
                    handleResumeUpload(f)
                  }
                }}
              >
                <FileUp className="h-8 w-8 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Drag &amp; drop your resume, or click to browse
                </p>
                <p className="mt-1 text-xs text-slate-500">PDF or DOC, up to 5 MB</p>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) {
                      setFile(f)
                      handleResumeUpload(f)
                    }
                  }}
                />
                {uploading && (
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Uploading…
                  </p>
                )}
                {file && !uploading && (
                  <p className="mt-3 inline-flex items-center gap-1 text-xs text-success">
                    <CheckCircle2 className="h-3.5 w-3.5" /> {file.name}
                  </p>
                )}
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="LinkedIn URL"
                  placeholder="https://linkedin.com/in/…"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                />
                <Input
                  label="Portfolio URL"
                  placeholder="https://…"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                />
              </div>

              <Textarea
                label="Cover note"
                placeholder="Why are you a great fit for this role?"
                hint="50–500 characters"
                showCount
                maxLength={500}
                value={coverNote}
                onChange={(e) => setCoverNote(e.target.value)}
              />

              <div className="rounded-card border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
                      <Sparkles className="h-4 w-4 text-primary" /> Check your match before bidding
                    </h4>
                    <p className="mt-1 text-xs text-slate-600">
                      See your AI score privately. {quickUsed != null
                        ? `${quickUsed} of ${FREE_MATCH_CHECK_LIMIT} free checks used this month.`
                        : `Free for ${FREE_MATCH_CHECK_LIMIT} checks per month.`}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    loading={quickLoading}
                    onClick={runQuickMatch}
                    disabled={!resumeText || quickLoading}
                  >
                    Check match
                  </Button>
                </div>
                {quickError && (
                  <p className="mt-3 rounded-input bg-amber-50 p-2 text-xs text-warning">
                    {quickError}
                  </p>
                )}
                {quickScore && (
                  <div className="mt-4">
                    <ScorePanel score={quickScore} showImprovementTips />
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  onClick={() => setStep('bid')}
                  disabled={!resumeUrl || coverNote.length < 50}
                >
                  Next: place your bid →
                </Button>
              </div>
            </div>
          )}

          {step === 'bid' && (
            <div className="space-y-5">
              <BidDisplay
                minBid={live.minBid}
                currentHighest={live.currentHighestBid}
                applicantCount={live.applicantCount}
              />
              <Input
                type="number"
                label="Your bid"
                prefix="₹"
                min={live.minBid}
                value={bid || ''}
                onChange={(e) => setBid(Number(e.target.value))}
                error={bid > 0 && bid < live.minBid ? `Minimum bid is ${formatINR(live.minBid)}` : undefined}
                hint="Higher bids are reviewed first."
              />
              <BidRankIndicator bidAmount={bid} allBids={allBids} />

              <div className="rounded-card border border-amber-200 bg-amber-50 p-4 text-sm text-warning">
                <strong className="block">A bid does not guarantee a referral.</strong>
                The referrer selects based on fit. If they decline, you receive a full refund within 24 hours.
              </div>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep('resume')}>← Back</Button>
                <Button onClick={() => setStep('pay')} disabled={bid < live.minBid || bid <= 0}>
                  Continue to payment →
                </Button>
              </div>
            </div>
          )}

          {step === 'pay' && (
            <div className="space-y-5">
              <div className="card border-slate-200 bg-slate-50">
                <h3 className="text-sm font-semibold text-slate-900">Order summary</h3>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Role</dt>
                    <dd className="font-medium text-slate-900">{job.title}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Your bid</dt>
                    <dd className="font-bold text-warning">{formatINR(bid)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Refund policy</dt>
                    <dd className="text-success">Full refund if not selected</dd>
                  </div>
                </dl>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600">
                <li>• Razorpay-secured checkout</li>
                <li>• AI score visible to both you and the referrer once paid</li>
                <li>• Auto-refund after 7 days if no response</li>
              </ul>

              <div className="flex items-center justify-between pt-2">
                <Button variant="ghost" onClick={() => setStep('bid')}>← Back</Button>
                <Button loading={paying} onClick={startPayment} size="lg">
                  Pay {formatINR(bid)} &amp; apply →
                </Button>
              </div>
            </div>
          )}

          {step === 'success' && applicationId && (
            <div className="space-y-5 text-center">
              <div className="flex justify-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-slate-900">Application submitted!</h3>
                <p className="mt-1 text-sm text-slate-600">
                  You&apos;re ranked <strong>#{bidRank}</strong> of {bidTotal ?? live.applicantCount} applicants.
                </p>
              </div>

              <div className="text-left">
                {scoreLoading && !score && (
                  <>
                    <p className="mb-3 text-center text-xs text-slate-500">
                      AI is scoring your application…
                    </p>
                    <ScorePanelSkeleton />
                  </>
                )}
                {score && <ScorePanel score={score} showImprovementTips />}
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                <a href="/dashboard/seeker" className="inline-block">
                  <Button>View my applications →</Button>
                </a>
                <Button variant="ghost" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
