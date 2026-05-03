import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  SCORING_SYSTEM_PROMPT,
  buildScoringUserMessage,
  parseScoreResponse,
} from '@/lib/scoring'
import { FREE_MATCH_CHECK_LIMIT } from '@/lib/constants'
import { getMonthKey } from '@/lib/utils'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
const MODEL = 'gpt-4o-mini'

export async function POST(request: Request) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
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

  const userMessage = buildScoringUserMessage(
    {
      jobTitle: job.title,
      jobDepartment: job.department,
      jobExperienceLevel: job.experience_level,
      jobSkills: job.skills ?? [],
      jobDescription: job.description,
    },
    {
      resumeText: body.resume_text,
      coverNote: body.cover_note,
    }
  )

  let raw = ''
  try {
    const response = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: 1024,
      // JSON mode — guarantees the response parses as valid JSON.
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SCORING_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
    })
    raw = response.choices[0]?.message?.content ?? ''
  } catch (err) {
    console.error('[quick-match] scoring service call failed:', err)
    if (err instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `Scoring service error (${err.status}): ${err.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Scoring service unavailable' },
      { status: 502 }
    )
  }

  let result
  try {
    result = parseScoreResponse(raw)
  } catch (err) {
    console.error('[quick-match] Could not parse scoring response:', err, '\nRaw:', raw.slice(0, 500))
    return NextResponse.json(
      { error: 'Scoring response was malformed — please try again' },
      { status: 502 }
    )
  }

  if (usage) {
    await supabase.from('match_check_usage').update({ usage_count: used + 1 }).eq('id', usage.id)
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
}
