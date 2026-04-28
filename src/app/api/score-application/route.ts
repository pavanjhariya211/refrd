import Anthropic from '@anthropic-ai/sdk'
import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { buildScorePrompt, parseScoreResponse } from '@/lib/scoring'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const MODEL = 'claude-haiku-4-5'

export async function POST(request: Request) {
  let application_id: string
  try {
    const body = await request.json()
    application_id = body.application_id
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!application_id) return NextResponse.json({ error: 'Missing application_id' }, { status: 400 })

  // Use service client so we can read resume_text without going through RLS
  const supabase = createServiceClient()
  const auth = createClient()
  const { data: { user } } = await auth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: app, error } = await supabase
    .from('applications')
    .select(
      'id, applicant_id, resume_text, cover_note, job:job_posts!job_id(title, skills, description, experience_level, department, referrer_id)'
    )
    .eq('id', application_id)
    .single()

  if (error || !app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const job = (app.job as unknown as {
    title: string
    skills?: string[]
    description?: string
    experience_level?: string
    department?: string
    referrer_id: string
  }) ?? null
  if (!job) return NextResponse.json({ error: 'Job missing' }, { status: 404 })

  // Authorize: only the applicant or the job's referrer may trigger scoring.
  if (user.id !== app.applicant_id && user.id !== job.referrer_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const prompt = buildScorePrompt({
    jobTitle: job.title,
    jobDepartment: job.department,
    jobExperienceLevel: job.experience_level,
    jobSkills: job.skills ?? [],
    jobDescription: job.description,
    resumeText: app.resume_text ?? undefined,
    coverNote: app.cover_note ?? undefined,
  })

  let raw = ''
  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2048,
      messages: [{ role: 'user', content: prompt }],
    })
    const block = response.content[0]
    raw = block.type === 'text' ? block.text : ''
  } catch (err) {
    console.error('[score-application] Anthropic call failed:', err)
    if (err instanceof Anthropic.APIError) {
      return NextResponse.json(
        { error: `Claude API ${err.status}: ${err.message}` },
        { status: 502 }
      )
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Anthropic call failed' },
      { status: 502 }
    )
  }

  let result
  try {
    result = parseScoreResponse(raw)
  } catch (err) {
    console.error('[score-application] Could not parse Claude response:', err, '\nRaw:', raw.slice(0, 500))
    return NextResponse.json(
      { error: 'AI returned a response we could not parse' },
      { status: 502 }
    )
  }

  await supabase.from('match_scores').upsert(
    {
      application_id,
      overall_score: result.overall_score,
      grade: result.grade,
      skills_score: result.skills_score,
      experience_score: result.experience_score,
      relevance_score: result.relevance_score,
      education_score: result.education_score,
      cover_note_score: result.cover_note_score,
      keyword_score: result.keyword_score,
      matched_skills: result.matched_skills,
      missing_skills: result.missing_skills,
      ai_summary: result.ai_summary,
      improvement_tips: result.improvement_tips,
      scored_at: new Date().toISOString(),
      model_version: MODEL,
    },
    { onConflict: 'application_id' }
  )

  await supabase
    .from('applications')
    .update({ match_score: result.overall_score, match_grade: result.grade })
    .eq('id', application_id)

  return NextResponse.json({
    overall_score: result.overall_score,
    grade: result.grade,
  })
}
