'use client'

import { useMemo, useState } from 'react'
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { toast } from 'sonner'
import { ExternalLink, MessageSquare, X, Check, FileUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CompanyAvatar } from '@/components/ui/CompanyAvatar'
import { MatchGradeBadge } from '@/components/ui/MatchGradeBadge'
import { ScorePanel } from '@/components/ui/ScorePanel'
import { Textarea } from '@/components/ui/Textarea'
import { KANBAN_COLUMNS, DECLINE_REASONS, PROOFS_BUCKET } from '@/lib/constants'
import { calculatePlatformFee, calculateReferrerPayout } from '@/lib/scoring'
import { formatINR } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { Application, ApplicationStatus } from '@/types'

type SortKey = 'bid' | 'score' | 'date'

interface Props {
  applications: Application[]
  jobTitle: string
}

export function ApplicantsKanban({ applications: initial, jobTitle }: Props) {
  const [apps, setApps] = useState<Application[]>(initial)
  const [sort, setSort] = useState<SortKey>('bid')
  const [openScoreFor, setOpenScoreFor] = useState<Application | null>(null)
  const [referFor, setReferFor] = useState<Application | null>(null)
  const [declineFor, setDeclineFor] = useState<Application | null>(null)
  const [referNotes, setReferNotes] = useState('')
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofResult, setProofResult] = useState<
    | { status: 'approved'; payout: number }
    | { status: 'needs_review'; reasoning?: string }
    | { status: 'rejected'; reasoning?: string }
    | null
  >(null)
  const [declineReason, setDeclineReason] = useState<string>(DECLINE_REASONS[0])
  const [declineNotes, setDeclineNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const grouped = useMemo(() => {
    const map: Record<string, Application[]> = { new: [], reviewing: [], referred: [], closed: [] }
    for (const app of apps) {
      const col = KANBAN_COLUMNS.find((c) => c.statuses.includes(app.status))
      const key = col?.id ?? 'closed'
      map[key].push(app)
    }
    const sorter = (a: Application, b: Application) => {
      if (sort === 'bid') return b.bid_amount - a.bid_amount
      if (sort === 'score') return (b.match_score ?? 0) - (a.match_score ?? 0)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    Object.keys(map).forEach((k) => map[k].sort(sorter))
    return map
  }, [apps, sort])

  const allBids = apps.map((a) => a.bid_amount)

  function rankFor(app: Application): number {
    const sorted = [...allBids].sort((a, b) => b - a)
    return sorted.indexOf(app.bid_amount) + 1
  }

  async function moveTo(app: Application, columnId: string) {
    if (columnId === 'referred') {
      setReferFor(app)
      return
    }
    if (columnId === 'closed') {
      setDeclineFor(app)
      return
    }
    const status: ApplicationStatus = columnId === 'reviewing' ? 'reviewing' : 'applied'
    setApps((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status } : a))
    )
  }

  function onDragEnd(result: DropResult) {
    if (!result.destination) return
    const id = result.draggableId
    const target = result.destination.droppableId
    const app = apps.find((a) => a.id === id)
    if (!app) return
    moveTo(app, target)
  }

  function closeReferModal() {
    setReferFor(null)
    setReferNotes('')
    setProofFile(null)
    setProofResult(null)
  }

  async function submitProof() {
    if (!referFor || !proofFile) return
    if (proofFile.size > 5 * 1024 * 1024) {
      toast.error('Screenshot must be under 5MB')
      return
    }
    setSubmitting(true)
    try {
      const supabase = createClient()
      // Resolve current user once (auth lives in cookies; this returns instantly)
      const { data: userData } = await supabase.auth.getUser()
      const userId = userData.user?.id
      if (!userId) {
        toast.error('Session expired — please refresh')
        return
      }

      const path = `${userId}/${referFor.id}/${Date.now()}-${proofFile.name.replace(/\s+/g, '_')}`
      const { error: upErr } = await supabase.storage
        .from(PROOFS_BUCKET)
        .upload(path, proofFile, { upsert: true })
      if (upErr) throw upErr

      const res = await fetch('/api/referrals/submit-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ application_id: referFor.id, proof_path: path }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Could not submit proof')

      if (json.status === 'approved') {
        setApps((prev) =>
          prev.map((a) => (a.id === referFor.id ? { ...a, status: 'referred' } : a))
        )
        setProofResult({ status: 'approved', payout: json.payout })
        toast.success(`Approved! ${formatINR(json.payout)} added to your wallet.`)
      } else if (json.status === 'needs_review') {
        setProofResult({ status: 'needs_review', reasoning: json.reasoning })
        toast.message('Submitted for review — payout releases on approval.')
      } else {
        setProofResult({ status: 'rejected', reasoning: json.reasoning })
        toast.error('Could not validate the proof. Try a clearer screenshot.')
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmDecline() {
    if (!declineFor) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: declineFor.id,
          reason: declineReason + (declineNotes ? `: ${declineNotes}` : ''),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Failed')
      setApps((prev) =>
        prev.map((a) =>
          a.id === declineFor.id ? { ...a, status: 'rejected', payment_status: 'refunded' } : a
        )
      )
      toast.success('Declined. Full refund sent.')
      setDeclineFor(null)
      setDeclineNotes('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sort:</span>
        {([
          { v: 'bid', label: 'Bid ↓' },
          { v: 'score', label: 'AI score ↓' },
          { v: 'date', label: 'Date' },
        ] as { v: SortKey; label: string }[]).map((opt) => (
          <button
            key={opt.v}
            onClick={() => setSort(opt.v)}
            className={
              'rounded-pill px-3 py-1 text-xs font-medium ' +
              (sort === opt.v ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')
            }
          >
            {opt.label}
          </button>
        ))}
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {KANBAN_COLUMNS.map((col) => (
            <Droppable droppableId={col.id} key={col.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={
                    'rounded-card border bg-slate-50 p-3 ' +
                    (snapshot.isDraggingOver ? 'border-primary bg-brand-50' : 'border-slate-200')
                  }
                >
                  <h3 className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-700">
                    {col.label}
                    <span className="rounded-pill bg-white px-2 py-0.5 text-xs">
                      {grouped[col.id]?.length ?? 0}
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {grouped[col.id]?.map((app, i) => (
                      <Draggable draggableId={app.id} index={i} key={app.id}>
                        {(p) => (
                          <div
                            ref={p.innerRef}
                            {...p.draggableProps}
                            {...p.dragHandleProps}
                            className="card p-3"
                          >
                            <div className="flex items-start gap-2">
                              <CompanyAvatar
                                name={app.applicant?.name}
                                src={app.applicant?.profile_photo}
                                size="sm"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-900">
                                  {app.applicant?.name ?? 'Applicant'}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {app.applicant?.headline ?? ''}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                              <div>
                                <span className="text-lg font-extrabold text-warning">
                                  {formatINR(app.bid_amount)}
                                </span>
                                <span className="ml-1 text-xs text-slate-400">
                                  #{rankFor(app)} of {apps.length}
                                </span>
                              </div>
                              {app.match_grade && app.match_score != null && (
                                <MatchGradeBadge
                                  grade={app.match_grade}
                                  score={app.match_score}
                                  size="sm"
                                />
                              )}
                            </div>
                            {app.match?.matched_skills && (
                              <p className="mt-1 text-xs text-success">
                                {app.match.matched_skills.length} skills match
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              <Button size="sm" variant="outline" onClick={() => setOpenScoreFor(app)}>
                                Score
                              </Button>
                              {app.status !== 'referred' && app.status !== 'rejected' && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="success"
                                    onClick={() => setReferFor(app)}
                                  >
                                    <Check className="h-3 w-3" /> Refer
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeclineFor(app)}
                                  >
                                    <X className="h-3 w-3" /> Decline
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                    {grouped[col.id]?.length === 0 && (
                      <p className="py-4 text-center text-xs text-slate-400">No applicants</p>
                    )}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>

      {openScoreFor && (
        <SidePanel onClose={() => setOpenScoreFor(null)} title={openScoreFor.applicant?.name ?? 'Applicant'}>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {openScoreFor.resume_url && (
                <a href={openScoreFor.resume_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3 w-3" /> View resume
                  </Button>
                </a>
              )}
              {openScoreFor.linkedin_url && (
                <a href={openScoreFor.linkedin_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">LinkedIn</Button>
                </a>
              )}
              <a href={`/messages?application_id=${openScoreFor.id}`}>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-3 w-3" /> Message
                </Button>
              </a>
            </div>
            {openScoreFor.cover_note && (
              <div>
                <h4 className="mb-1 text-sm font-semibold text-slate-900">Cover note</h4>
                <p className="rounded-card bg-slate-50 p-3 text-sm text-slate-700">
                  {openScoreFor.cover_note}
                </p>
              </div>
            )}
            {openScoreFor.match ? (
              <ScorePanel score={openScoreFor.match} />
            ) : (
              <p className="text-sm text-slate-500">AI score is still being computed…</p>
            )}
          </div>
        </SidePanel>
      )}

      {referFor && (
        <Modal onClose={closeReferModal} title="Submit referral">
          {proofResult ? (
            <ProofResultPanel result={proofResult} onClose={closeReferModal} />
          ) : (
            <>
              <p className="text-sm text-slate-700">
                Refer <strong>{referFor.applicant?.name}</strong> for{' '}
                <strong>{jobTitle}</strong>?
              </p>

              <ol className="mt-3 space-y-1 rounded-card bg-blue-50 p-3 text-sm text-primary">
                <li>1. Submit the candidate on your company&apos;s referral system.</li>
                <li>2. Wait for the confirmation email from your ATS.</li>
                <li>3. Upload a screenshot of that email below.</li>
              </ol>

              <div className="mt-4 rounded-card bg-slate-50 p-4 text-sm">
                <div className="flex justify-between">
                  <span>Bid amount</span>
                  <strong>{formatINR(referFor.bid_amount)}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Platform fee (15%, min ₹50)</span>
                  <span>− {formatINR(calculatePlatformFee(referFor.bid_amount))}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 text-base">
                  <span className="font-semibold">You earn (on approval)</span>
                  <strong className="text-success">
                    {formatINR(calculateReferrerPayout(referFor.bid_amount))}
                  </strong>
                </div>
              </div>

              <label className="mt-3 flex cursor-pointer flex-col items-center justify-center rounded-card border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center hover:border-primary">
                <FileUp className="h-6 w-6 text-slate-400" />
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {proofFile ? proofFile.name : 'Upload screenshot of the confirmation email'}
                </p>
                <p className="mt-1 text-xs text-slate-500">PNG / JPG, up to 5 MB</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
              </label>

              <Textarea
                label="Optional note for the candidate"
                value={referNotes}
                onChange={(e) => setReferNotes(e.target.value)}
                className="mt-3"
                placeholder="I'll send your resume to my hiring manager today."
              />

              <div className="mt-4 flex justify-end gap-2">
                <Button variant="ghost" onClick={closeReferModal}>
                  Cancel
                </Button>
                <Button
                  variant="success"
                  loading={submitting}
                  onClick={submitProof}
                  disabled={!proofFile || submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying…
                    </>
                  ) : (
                    'Submit proof & request payout'
                  )}
                </Button>
              </div>
            </>
          )}
        </Modal>
      )}

      {declineFor && (
        <Modal onClose={() => setDeclineFor(null)} title="Decline applicant">
          <p className="text-sm text-slate-700">
            <strong>{declineFor.applicant?.name}</strong> will receive a full refund of{' '}
            <strong>{formatINR(declineFor.bid_amount)}</strong>.
          </p>
          <div className="mt-3">
            <label className="mb-1 block text-sm font-medium text-slate-700">Reason</label>
            <select
              className="input-base"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
            >
              {DECLINE_REASONS.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </div>
          <Textarea
            label="Note (optional)"
            value={declineNotes}
            onChange={(e) => setDeclineNotes(e.target.value)}
            className="mt-3"
          />
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeclineFor(null)}>Cancel</Button>
            <Button variant="danger" loading={submitting} onClick={confirmDecline}>
              Decline &amp; refund
            </Button>
          </div>
        </Modal>
      )}
    </>
  )
}

function SidePanel({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex bg-slate-900/40">
      <button className="flex-1" aria-label="Close" onClick={onClose} />
      <div className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-white shadow-card-hover">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  )
}

function ProofResultPanel({
  result,
  onClose,
}: {
  result:
    | { status: 'approved'; payout: number }
    | { status: 'needs_review'; reasoning?: string }
    | { status: 'rejected'; reasoning?: string }
  onClose: () => void
}) {
  if (result.status === 'approved') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-success">
          <Check className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Referred!</h3>
          <p className="mt-1 text-sm text-slate-600">
            <strong className="text-success">{formatINR(result.payout)}</strong> credited to your wallet.
          </p>
        </div>
        <Button onClick={onClose} fullWidth>Done</Button>
      </div>
    )
  }
  if (result.status === 'needs_review') {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-50 text-warning">
          <Loader2 className="h-8 w-8" />
        </div>
        <div>
          <h3 className="text-xl font-extrabold text-slate-900">Submitted for review</h3>
          <p className="mt-1 text-sm text-slate-600">
            Our team will verify your screenshot within 24 hours. Payout releases on approval.
          </p>
        </div>
        {result.reasoning && (
          <p className="rounded-input bg-slate-50 p-2 text-left text-xs text-slate-600">
            <strong>Reason:</strong> {result.reasoning}
          </p>
        )}
        <Button onClick={onClose} fullWidth>Got it</Button>
      </div>
    )
  }
  return (
    <div className="space-y-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-error">
        <X className="h-8 w-8" />
      </div>
      <div>
        <h3 className="text-xl font-extrabold text-slate-900">Could not validate</h3>
        <p className="mt-1 text-sm text-slate-600">
          The screenshot doesn&apos;t look like a referral confirmation. Try a clearer image showing the candidate name and company.
        </p>
      </div>
      {result.reasoning && (
        <p className="rounded-input bg-slate-50 p-2 text-left text-xs text-slate-600">
          <strong>Reason:</strong> {result.reasoning}
        </p>
      )}
      <Button onClick={onClose} fullWidth variant="outline">Close</Button>
    </div>
  )
}

function Modal({
  children,
  onClose,
  title,
}: {
  children: React.ReactNode
  onClose: () => void
  title: string
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
      <div className="w-full max-w-md overflow-hidden rounded-card bg-white shadow-card-hover">
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-slate-100">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
