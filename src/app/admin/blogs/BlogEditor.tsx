'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TiptapImage from '@tiptap/extension-image'
import LinkExt from '@tiptap/extension-link'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Undo,
  Redo,
  Link2,
  Image as ImageIcon,
  Upload,
  X,
  Save,
  Send,
  ExternalLink,
  Eye,
  Clock,
} from 'lucide-react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Button } from '@/components/ui/Button'
import { slugify } from '@/lib/blog'
import type { BlogPost, BlogPostStatus } from '@/types'

type DraftPost = Partial<BlogPost> & {
  title: string
  slug: string
  content_html: string
  status: BlogPostStatus
  tags: string[]
}

interface Props {
  /** Existing post id; null for /new */
  postId: string | null
  initial: DraftPost
}

export function BlogEditor({ postId, initial }: Props) {
  const router = useRouter()
  const [title, setTitle] = useState(initial.title)
  const [slug, setSlug] = useState(initial.slug)
  const [slugTouched, setSlugTouched] = useState(Boolean(initial.slug))
  const [excerpt, setExcerpt] = useState(initial.excerpt ?? '')
  const [metaDescription, setMetaDescription] = useState(
    initial.meta_description ?? ''
  )
  const [coverImageUrl, setCoverImageUrl] = useState(initial.cover_image_url ?? '')
  const [ogImageUrl, setOgImageUrl] = useState(initial.og_image_url ?? '')
  const [canonicalUrl, setCanonicalUrl] = useState(initial.canonical_url ?? '')
  const [tagsInput, setTagsInput] = useState((initial.tags ?? []).join(', '))
  const [scheduleAt, setScheduleAt] = useState(
    initial.published_at && new Date(initial.published_at).getTime() > Date.now()
      ? toLocalDatetime(initial.published_at)
      : ''
  )
  const [saving, setSaving] = useState<'draft' | 'publish' | 'schedule' | null>(
    null
  )
  const [uploadingCover, setUploadingCover] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start writing your post… use the toolbar above for formatting.',
      }),
      TiptapImage.configure({ inline: false, allowBase64: false }),
      LinkExt.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { rel: 'noopener noreferrer', target: '_blank' },
      }),
    ],
    content: initial.content_html || '<p></p>',
    editorProps: {
      attributes: {
        class:
          'prose prose-invert prose-lg max-w-none min-h-[420px] focus:outline-none px-5 py-5',
      },
    },
    immediatelyRender: false,
  })

  // Auto-derive slug from title until the user types into the slug field.
  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title))
  }, [title, slugTouched])

  function tagList(): string[] {
    return tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
  }

  function buildPayload(overrides: Partial<DraftPost> = {}) {
    const html = editor?.getHTML() ?? ''
    return {
      title: title.trim(),
      slug: slug.trim(),
      excerpt: excerpt.trim() || null,
      content_html: html,
      cover_image_url: coverImageUrl.trim() || null,
      og_image_url: ogImageUrl.trim() || null,
      meta_description: metaDescription.trim() || null,
      canonical_url: canonicalUrl.trim() || null,
      tags: tagList(),
      ...overrides,
    }
  }

  async function save(target: 'draft' | 'publish' | 'schedule') {
    if (!title.trim()) {
      toast.error('Title is required.')
      return
    }
    if (!slug.trim()) {
      toast.error('Slug is required.')
      return
    }
    if (target === 'schedule' && !scheduleAt) {
      toast.error('Pick a future date/time to schedule.')
      return
    }

    setSaving(target)

    const overrides: Partial<DraftPost> = (() => {
      if (target === 'draft') return { status: 'draft' }
      if (target === 'publish') {
        return {
          status: 'published',
          published_at: new Date().toISOString(),
        }
      }
      return {
        status: 'published',
        published_at: new Date(scheduleAt).toISOString(),
      }
    })()

    const payload = buildPayload(overrides)

    try {
      const res = await fetch(
        postId ? `/api/admin/blogs/${postId}` : '/api/admin/blogs',
        {
          method: postId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Save failed')

      toast.success(
        target === 'draft'
          ? 'Draft saved.'
          : target === 'publish'
            ? 'Published — live on /blogs/' + payload.slug
            : 'Scheduled — will go live ' + new Date(scheduleAt).toLocaleString()
      )

      if (!postId) {
        // Move to the edit URL so further saves PATCH instead of POSTing dupes.
        router.replace(`/admin/blogs/${json.post.id}/edit`)
      } else {
        router.refresh()
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  async function uploadFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/admin/blogs/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? 'Upload failed')
    return json.url as string
  }

  async function handleCoverUpload(file: File) {
    setUploadingCover(true)
    try {
      const url = await uploadFile(file)
      setCoverImageUrl(url)
      toast.success('Cover image uploaded.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      {/* ─── Left column: editor ─────────────────────────────────────────── */}
      <div className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Post title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border-none bg-transparent text-4xl font-extrabold tracking-tight text-text focus:outline-none focus:ring-0"
          />
        </div>

        <div className="overflow-hidden rounded-card border border-border bg-bg-card">
          <EditorToolbar editor={editor} uploadFile={uploadFile} />
          <EditorContent editor={editor} />
        </div>

        <div>
          <Textarea
            label="Excerpt (optional)"
            placeholder="Short summary shown on the blog index and used as a fallback for meta description."
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            maxLength={300}
            showCount
            hint="If left blank, we'll auto-generate from the post body."
          />
        </div>
      </div>

      {/* ─── Right column: meta + actions ────────────────────────────────── */}
      <aside className="space-y-4">
        <div className="rounded-card border border-border bg-bg-card p-4">
          <h3 className="text-sm font-bold text-text">Publish</h3>
          <p className="mt-1 text-xs text-text-faint">
            {initial.status === 'published'
              ? 'Currently live.'
              : 'Currently a draft.'}
          </p>

          <div className="mt-4 space-y-2">
            <Button
              fullWidth
              onClick={() => save('publish')}
              loading={saving === 'publish'}
              disabled={saving !== null}
            >
              <Send className="h-4 w-4" />
              {initial.status === 'published' ? 'Update & republish' : 'Publish now'}
            </Button>
            <Button
              fullWidth
              variant="outline"
              onClick={() => save('draft')}
              loading={saving === 'draft'}
              disabled={saving !== null}
            >
              <Save className="h-4 w-4" /> Save as draft
            </Button>
          </div>

          <div className="mt-4 border-t border-border pt-4">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-text-faint">
              <Clock className="mr-1 inline h-3 w-3" /> Schedule
            </label>
            <input
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className="input-base"
            />
            <Button
              fullWidth
              size="sm"
              variant="secondary"
              className="mt-2"
              onClick={() => save('schedule')}
              loading={saving === 'schedule'}
              disabled={saving !== null || !scheduleAt}
            >
              Schedule
            </Button>
          </div>

          {postId && (
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
              <a
                href={`/admin/blogs/${postId}/preview`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-text-soft hover:text-primary"
              >
                <Eye className="h-3 w-3" /> Preview draft
              </a>
              {initial.status === 'published' && (
                <a
                  href={`/blogs/${slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <ExternalLink className="h-3 w-3" /> View live post
                </a>
              )}
            </div>
          )}
        </div>

        <div className="rounded-card border border-border bg-bg-card p-4">
          <h3 className="text-sm font-bold text-text">Cover image</h3>
          <p className="mt-1 text-xs text-text-faint">
            Shown on the blog index card and the post header.
          </p>
          <CoverImageField
            url={coverImageUrl}
            onChange={setCoverImageUrl}
            onUpload={handleCoverUpload}
            uploading={uploadingCover}
          />
        </div>

        <div className="rounded-card border border-border bg-bg-card p-4">
          <h3 className="text-sm font-bold text-text">SEO</h3>
          <div className="mt-3 space-y-3">
            <Input
              label="URL slug"
              value={slug}
              onChange={(e) => {
                setSlug(slugify(e.target.value))
                setSlugTouched(true)
              }}
              hint={`/blogs/${slug || 'your-post-slug'}`}
            />
            <Textarea
              label="Meta description"
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={2}
              maxLength={170}
              showCount
              hint="Shown in Google snippets. ~155 chars recommended."
            />
            <Input
              label="OG image URL (optional)"
              placeholder="Override cover image for social shares"
              value={ogImageUrl}
              onChange={(e) => setOgImageUrl(e.target.value)}
            />
            <Input
              label="Canonical URL (optional)"
              placeholder="https://example.com/original-post"
              value={canonicalUrl}
              onChange={(e) => setCanonicalUrl(e.target.value)}
              hint="Set this if the post was first published elsewhere."
            />
          </div>
        </div>

        <div className="rounded-card border border-border bg-bg-card p-4">
          <h3 className="text-sm font-bold text-text">Tags</h3>
          <Input
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            placeholder="Hiring, Referrals, Product"
            hint="Comma-separated. Tags become filter links on /blogs."
          />
          {tagList().length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {tagList().map((t) => (
                <span
                  key={t}
                  className="rounded-pill bg-brand-50 px-2 py-0.5 text-[11px] font-medium text-primary"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <Link
          href="/admin/blogs"
          className="block text-center text-xs text-text-faint hover:text-primary"
        >
          ← Back to all posts
        </Link>
      </aside>
    </div>
  )
}

// ─── Toolbar ────────────────────────────────────────────────────────────────
function EditorToolbar({
  editor,
  uploadFile,
}: {
  editor: Editor | null
  uploadFile: (f: File) => Promise<string>
}) {
  const inlineImageInput = useRef<HTMLInputElement | null>(null)
  if (!editor) return null

  const btn = (active: boolean) =>
    'inline-flex h-8 w-8 items-center justify-center rounded-btn transition-colors ' +
    (active
      ? 'bg-primary text-white'
      : 'text-text-soft hover:bg-white/[0.06] hover:text-text')

  function addLink() {
    const prev = editor!.getAttributes('link').href
    const url = window.prompt('URL', prev ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor!.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor!.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  async function handleInlineImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const url = await uploadFile(file)
      editor!.chain().focus().setImage({ src: url, alt: file.name }).run()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      e.target.value = ''
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-white/[0.03] px-3 py-2">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btn(editor.isActive('bold'))}
        title="Bold (⌘B)"
      >
        <Bold className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btn(editor.isActive('italic'))}
        title="Italic (⌘I)"
      >
        <Italic className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={btn(editor.isActive('strike'))}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-white/[0.08]" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={btn(editor.isActive('heading', { level: 2 }))}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={btn(editor.isActive('heading', { level: 3 }))}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-white/[0.08]" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btn(editor.isActive('bulletList'))}
        title="Bulleted list"
      >
        <List className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btn(editor.isActive('orderedList'))}
        title="Numbered list"
      >
        <ListOrdered className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btn(editor.isActive('blockquote'))}
        title="Quote"
      >
        <Quote className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btn(editor.isActive('codeBlock'))}
        title="Code block"
      >
        <Code className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        className={btn(false)}
        title="Divider"
      >
        <Minus className="h-4 w-4" />
      </button>
      <div className="mx-1 h-5 w-px bg-white/[0.08]" />
      <button
        type="button"
        onClick={addLink}
        className={btn(editor.isActive('link'))}
        title="Add/edit link"
      >
        <Link2 className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => inlineImageInput.current?.click()}
        className={btn(false)}
        title="Insert image"
      >
        <ImageIcon className="h-4 w-4" />
      </button>
      <input
        ref={inlineImageInput}
        type="file"
        accept="image/*"
        hidden
        onChange={handleInlineImage}
      />
      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className={btn(false)}
          title="Undo (⌘Z)"
        >
          <Undo className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className={btn(false)}
          title="Redo (⌘⇧Z)"
        >
          <Redo className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// ─── Cover image field ─────────────────────────────────────────────────────
function CoverImageField({
  url,
  onChange,
  onUpload,
  uploading,
}: {
  url: string
  onChange: (v: string) => void
  onUpload: (file: File) => void
  uploading: boolean
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  return (
    <div className="mt-3">
      {url ? (
        <div className="group relative overflow-hidden rounded-card border border-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt="Cover" className="h-32 w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-pill bg-bg-card/90 text-text-soft shadow hover:bg-bg-card"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-card border-2 border-dashed border-border-hi text-sm text-text-faint hover:border-primary hover:text-primary disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Upload className="h-5 w-5 animate-pulse" /> Uploading…
            </>
          ) : (
            <>
              <Upload className="h-5 w-5" /> Click to upload
            </>
          )}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onUpload(file)
          e.target.value = ''
        }}
      />
      <Input
        className="mt-2"
        placeholder="…or paste an image URL"
        value={url}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

function toLocalDatetime(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return (
    d.getFullYear() +
    '-' +
    pad(d.getMonth() + 1) +
    '-' +
    pad(d.getDate()) +
    'T' +
    pad(d.getHours()) +
    ':' +
    pad(d.getMinutes())
  )
}
