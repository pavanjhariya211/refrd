'use client'

import { useState } from 'react'
import Link from 'next/link'
import { toast } from 'sonner'
import { Edit, ExternalLink, Eye, Trash2, Send, FileText, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { formatRelativeTime } from '@/lib/utils'
import type { BlogPostStatus } from '@/types'

export interface AdminBlogRow {
  id: string
  slug: string
  title: string
  status: BlogPostStatus
  published_at: string | null
  tags: string[]
  updated_at: string
  created_at: string
}

export function AdminBlogList({ initialRows }: { initialRows: AdminBlogRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [busyId, setBusyId] = useState<string | null>(null)

  async function publish(row: AdminBlogRow) {
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/blogs/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'published',
          published_at: new Date().toISOString(),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Publish failed')
      toast.success('Published — live on /blogs/' + row.slug)
      setRows((prev) =>
        prev.map((r) =>
          r.id === row.id
            ? { ...r, status: 'published', published_at: new Date().toISOString() }
            : r
        )
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Publish failed')
    } finally {
      setBusyId(null)
    }
  }

  async function unpublish(row: AdminBlogRow) {
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/blogs/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'draft' }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Unpublish failed')
      toast.success('Moved to draft.')
      setRows((prev) =>
        prev.map((r) => (r.id === row.id ? { ...r, status: 'draft' } : r))
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Unpublish failed')
    } finally {
      setBusyId(null)
    }
  }

  async function remove(row: AdminBlogRow) {
    if (!confirm(`Delete "${row.title}"? This cannot be undone.`)) return
    setBusyId(row.id)
    try {
      const res = await fetch(`/api/admin/blogs/${row.id}`, { method: 'DELETE' })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error ?? 'Delete failed')
      toast.success('Post deleted.')
      setRows((prev) => prev.filter((r) => r.id !== row.id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  if (rows.length === 0) {
    return (
      <div className="card text-center text-sm text-text-soft">
        No posts yet. Click <strong>New post</strong> to write your first.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-card border border-border bg-bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-white/[0.03] text-left text-xs font-semibold uppercase tracking-wide text-text-faint">
          <tr>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Updated</th>
            <th className="px-4 py-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const scheduled =
              row.status === 'published' &&
              row.published_at &&
              new Date(row.published_at).getTime() > Date.now()
            return (
              <tr key={row.id} className="hover:bg-white/[0.04]">
                <td className="px-4 py-3">
                  <div className="font-semibold text-text">{row.title}</div>
                  <div className="text-xs text-text-faint">/blogs/{row.slug}</div>
                  {row.tags?.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.tags.slice(0, 3).map((t) => (
                        <span
                          key={t}
                          className="rounded-pill bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-soft"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  {scheduled ? (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-300">
                      <Clock className="h-3 w-3" />
                      Scheduled
                    </span>
                  ) : row.status === 'published' ? (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                      Live
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-pill bg-white/[0.06] px-2 py-0.5 text-xs font-semibold text-text-soft">
                      <FileText className="h-3 w-3" /> Draft
                    </span>
                  )}
                  {scheduled && row.published_at && (
                    <div className="mt-1 text-[11px] text-text-faint">
                      {new Date(row.published_at).toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-text-soft">
                  {formatRelativeTime(row.updated_at)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1.5">
                    {row.status === 'published' && !scheduled ? (
                      <a
                        href={`/blogs/${row.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open live post"
                        className="inline-flex items-center justify-center rounded-btn border border-border-hi bg-bg-card px-2.5 py-1.5 text-xs font-semibold text-text-soft hover:bg-white/[0.04]"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <a
                        href={`/admin/blogs/${row.id}/preview`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Preview draft"
                        className="inline-flex items-center justify-center rounded-btn border border-border-hi bg-bg-card px-2.5 py-1.5 text-xs font-semibold text-text-soft hover:bg-white/[0.04]"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </a>
                    )}
                    <Link href={`/admin/blogs/${row.id}/edit`}>
                      <Button size="sm" variant="outline">
                        <Edit className="h-3.5 w-3.5" /> Edit
                      </Button>
                    </Link>
                    {row.status === 'draft' ? (
                      <Button
                        size="sm"
                        onClick={() => publish(row)}
                        loading={busyId === row.id}
                      >
                        <Send className="h-3.5 w-3.5" /> Publish
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => unpublish(row)}
                        loading={busyId === row.id}
                      >
                        Unpublish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => remove(row)}
                      loading={busyId === row.id}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
