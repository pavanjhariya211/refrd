import { NextResponse } from 'next/server'
import pdf from 'pdf-parse'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const maxDuration = 30

const MAX_BYTES = 5 * 1024 * 1024 // 5 MB

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const form = await request.formData()
  const file = form.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 })
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (5MB max)' }, { status: 400 })
  }
  const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
  if (!allowed.includes(file.type)) {
    return NextResponse.json({ error: 'Only PDF or DOC/DOCX accepted' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  try {
    if (file.type === 'application/pdf') {
      const result = await pdf(buffer)
      const text = result.text.replace(/\s+/g, ' ').trim()
      return NextResponse.json({ text })
    }
    // For DOC/DOCX we don't have a parser configured; return the raw text best-effort.
    return NextResponse.json({
      text: buffer.toString('utf8').replace(/[^\x20-\x7E\n]/g, ' ').slice(0, 50_000),
    })
  } catch (err) {
    console.error('Resume extract failed:', err)
    return NextResponse.json({ error: 'Could not parse resume' }, { status: 500 })
  }
}
