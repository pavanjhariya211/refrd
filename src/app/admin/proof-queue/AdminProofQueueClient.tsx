'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, X, ExternalLink, Linkedin } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Textarea'
import { formatINR, formatRelativeTime } from '@/lib/utils'

export interface AdminProofRow {
  id: string
  application_id: string
  referrer_id: string
  proof_path: string
  proof_url: string
  status: 'needs_review' | 'rejected'
  ocr_extracted_company: string | null
  ocr_extracted_candidate: string | null
  ocr_sender: string | null
  ocr_reasoning: string | null
  ocr_model: string | null
  created_at: string
  application: {
    bid_amount: number
    cover_note: string | null
    applicant: { name?: string; email?: string; linkedin_url?: string }
    job: { title: string; company_name: string }
  }
  referrer: { name?: string; email?: string; company_name?: string }
}

export function AdminProofQueueClient({ initialRows }: { initialRows: AdminProofRow[] }) {
  const [rows, setRows] = useState<AdminProofRow[]>(initialRows)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteByRow, setNoteByRow] = useState<Record<string, string>>({})

  async function approve(row: AdminProofRow) {
    setBusyId(row.id)
    try {
      const res = await fetch('/api/admin/approve-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof_id: row.id, note: noteByRow[row.id] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Approval failed')
      toast.success(`Approved — ${formatINR(json.payout ?? 0)} sent to referrer wallet.`)
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Approval failed')
    } finally {
      setBusyId(null)
    }
  }

  async function reject(row: AdminProofRow) {
    if (!noteByRow[row.id]?.trim()) {
      toast.error('Add a rejection reason before rejecting.')
      return
    }
    setBusyId(row.id)
    try {
      const res = await fetch('/api/admin/reject-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proof_id: row.id, reason: noteByRow[row.id] }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Rejection failed')
      toast.success('Rejected and refunded the seeker.')
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Rejection failed')
    } finally {
      setBusyId(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="card mt-6 text-center text-sm text-text-soft">
        Queue is empty. Auto-refunds run nightly for proofs older than 7 days.
      </div>
    )
  }

  return (
    <div className="mt-6 grid gap-4">
      {rows.map((row) => {
        const busy = busyId === row.id
        return (
          <div key={row.id} className="card p-0 overflow-hidden">
            <div className="grid gap-0 md:grid-cols-[280px_1fr]">
              <a
                href={row.proof_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-white/[0.06]"
                title="Open full size in new tab"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.proof_url}
                  alt="Referral proof screenshot"
                  className="h-64 w-full object-cover md:h-full"
                />
              </a>

              <div className="p-5 space-y-4">
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-text">
                        {row.application.job.title}
                      </h3>
                      <p className="text-xs text-text-faint">
                        {row.application.job.company_name} ·{' '}
                        {formatRelativeTime(row.created_at)}
                      </p>
                    </div>
                    <span
                      className={
                        'pill ' +
                        (row.status === 'rejected'
                          ? 'bg-red-500/10 text-error'
                          : 'bg-amber-500/10 text-warning')
                      }
                    >
                      {row.status === 'rejected' ? 'rejected (re-review)' : 'needs review'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-card bg-white/[0.03] p-3 text-xs">
                  <div>
                    <p className="font-semibold text-text-faint">Candidate</p>
                    <p>{row.application.applicant.name ?? '—'}</p>
                    <p className="text-text-faint">{row.application.applicant.email ?? ''}</p>
                    {row.application.applicant.linkedin_url && (
                      <a
                        href={row.application.applicant.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-primary"
                      >
                        <Linkedin className="h-3 w-3" /> LinkedIn
                      </a>
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-text-faint">Referrer</p>
                    <p>{row.referrer.name ?? '—'}</p>
                    <p className="text-text-faint">{row.referrer.email ?? ''}</p>
                    <p className="text-text-faint">
                      Profile company:{' '}
                      <strong>{row.referrer.company_name ?? '—'}</strong>
                    </p>
                  </div>
                  <div>
                    <p className="font-semibold text-text-faint">OCR — extracted company</p>
                    <p>{row.ocr_extracted_company ?? <em className="text-text-faint">none</em>}</p>
                  </div>
                  <div>
                    <p className="font-semibold text-text-faint">OCR — extracted candidate</p>
                    <p>{row.ocr_extracted_candidate ?? <em className="text-text-faint">none</em>}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-text-faint">OCR — sender</p>
                    <p>{row.ocr_sender ?? <em className="text-text-faint">none</em>}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="font-semibold text-text-faint">OCR reasoning</p>
                    <p className="text-text-soft">{row.ocr_reasoning ?? '—'}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-card bg-amber-500/10 px-3 py-2 text-sm">
                  <span className="text-text-soft">
                    Bid: <strong>{formatINR(row.application.bid_amount)}</strong>
                  </span>
                  <a
                    href={row.proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary"
                  >
                    <ExternalLink className="h-3 w-3" /> Open full screenshot
                  </a>
                </div>

                <Textarea
                  label="Note (required for reject)"
                  placeholder="e.g. screenshot doesn't show the candidate name; please request a clearer one"
                  value={noteByRow[row.id] ?? ''}
                  onChange={(e) =>
                    setNoteByRow((prev) => ({ ...prev, [row.id]: e.target.value }))
                  }
                />

                <div className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    loading={busy}
                    onClick={() => reject(row)}
                  >
                    <X className="h-3 w-3" /> Reject &amp; refund
                  </Button>
                  <Button
                    size="sm"
                    variant="success"
                    loading={busy}
                    onClick={() => approve(row)}
                  >
                    <Check className="h-3 w-3" /> Approve &amp; release payout
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
