import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { buildScorePrompt, parseScoreResponse } from '@/lib/scoring'
import { FREE_MATCH_CHECK_LIMIT } from '@/lib/constants'
import { getMonthKey } from '@/lib/utils'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.resume_text || !body?.job_id) {
    return NextResponse.json({ error: 'Missing resume_text or job_id' }, { status: 400 })
  }

  const monthKey = getMonthKey()
  const { data: usage } = await supabase
    .from('match_check_usage')
    .select('id, usage_count')
    .eq('user_id', user.id)
    .eq('month_key', monthKey)
    .maybeSingle()

  const used = usage?.usage_count ?? 0
  if (used >= FREE_MATCH_CHECK_LIMIT) {
    return NextResponse.json(
      { error: 'limit_reached', used, limit: FREE_MATCH_CHECK_LIMIT },
      { status: 402 }
    )
  }

  const { data: job } = await supabase
    .from('job_posts')
    .select('title, skills, description, experience_level, department')
    .eq('id', body.job_id)
    .single()
  if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 })

  const prompt = buildScorePrompt({
    jobTitle: job.title,
    jobDepartment: job.department,
    jobExperienceLevel: job.experience_level,
    jobSkills: job.skills ?? [],
    jobDescription: job.description,
    resumeText: body.resume_text,
    coverNote: body.cover_note,
  })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-opus-4-7',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    const raw = block.type === 'text' ? block.text : ''
    const result = parseScoreResponse(raw)

    if (usage) {
      await supabase
        .from('match_check_usage')
        .update({ usage_count: used + 1 })
        .eq('id', usage.id)
    } else {
      await supabase
        .from('match_check_usage')
        .insert({ user_id: user.id, month_key: monthKey, usage_count: 1 })
    }

    return NextResponse.json({
      ...result,
      used: used + 1,
      limit: FREE_MATCH_CHECK_LIMIT,
    })
  } catch (err) {
    console.error('Quick match failed:', err)
    return NextResponse.json({ error: 'Quick match failed' }, { status: 500 })
  }
}
