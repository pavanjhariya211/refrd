import { MatchGrade, getMatchGrade } from '@/types'

export interface ScoreResult {
  overall_score: number
  grade: MatchGrade
  skills_score: number
  experience_score: number
  relevance_score: number
  education_score: number
  cover_note_score: number
  keyword_score: number
  matched_skills: string[]
  missing_skills: string[]
  ai_summary: string
  improvement_tips: string[]
}

export type ScoreDimensions = Pick<
  ScoreResult,
  | 'skills_score'
  | 'experience_score'
  | 'relevance_score'
  | 'education_score'
  | 'cover_note_score'
  | 'keyword_score'
>

export const SCORE_WEIGHTS = {
  skills_score: 0.3,
  experience_score: 0.2,
  relevance_score: 0.2,
  education_score: 0.1,
  cover_note_score: 0.1,
  keyword_score: 0.1,
} as const

export function calculateOverallScore(scores: ScoreDimensions): number {
  return Math.round(
    scores.skills_score * SCORE_WEIGHTS.skills_score +
      scores.experience_score * SCORE_WEIGHTS.experience_score +
      scores.relevance_score * SCORE_WEIGHTS.relevance_score +
      scores.education_score * SCORE_WEIGHTS.education_score +
      scores.cover_note_score * SCORE_WEIGHTS.cover_note_score +
      scores.keyword_score * SCORE_WEIGHTS.keyword_score
  )
}

export const PLATFORM_FEE_RATE = 0.15
export const PLATFORM_FEE_MIN = 50

export function calculatePlatformFee(bidAmount: number): number {
  return Math.max(PLATFORM_FEE_MIN, Math.round(bidAmount * PLATFORM_FEE_RATE))
}

export function calculateReferrerPayout(bidAmount: number): number {
  return bidAmount - calculatePlatformFee(bidAmount)
}

export function buildScorePrompt(args: {
  jobTitle: string
  jobDepartment?: string
  jobExperienceLevel?: string
  jobSkills: string[]
  jobDescription?: string
  resumeText?: string
  coverNote?: string
}): string {
  return `You are a senior technical recruiter with 15 years of experience. Score this job application with precision.

JOB DESCRIPTION:
Title: ${args.jobTitle}
Department: ${args.jobDepartment || 'Not specified'}
Experience Required: ${args.jobExperienceLevel || 'Not specified'}
Required Skills: ${args.jobSkills?.join(', ') || 'Not specified'}
Full Description: ${args.jobDescription || 'Not provided'}

APPLICANT RESUME:
${args.resumeText || 'Not provided'}

COVER NOTE:
${args.coverNote || 'Not provided'}

Score on 6 dimensions (0-100 each):
1. skills_score (weight 30%): Exact + semantic match of required skills vs resume. React ≈ React.js, Postgres ≈ PostgreSQL.
2. experience_score (weight 20%): Years/level in resume vs required level.
3. relevance_score (weight 20%): Past job titles and industries vs this role.
4. education_score (weight 10%): Degree and field vs JD requirements.
5. cover_note_score (weight 10%): Relevance and specificity of the cover note.
6. keyword_score (weight 10%): JD-specific terminology and tools found in resume.

Also provide:
- matched_skills: array of required skills the applicant clearly has
- missing_skills: array of required skills the applicant is missing
- ai_summary: 2-3 sentence plain English explanation of the overall score
- improvement_tips: 2-4 specific actionable suggestions to improve the score

Respond ONLY with valid JSON. No markdown, no preamble:
{
  "skills_score": 0-100,
  "experience_score": 0-100,
  "relevance_score": 0-100,
  "education_score": 0-100,
  "cover_note_score": 0-100,
  "keyword_score": 0-100,
  "matched_skills": [],
  "missing_skills": [],
  "ai_summary": "",
  "improvement_tips": []
}`
}

export function parseScoreResponse(raw: string): ScoreResult {
  // Strip markdown fences first.
  let cleaned = raw.replace(/```json|```/g, '').trim()
  // Extract the first balanced {...} block. Claude sometimes adds a
  // sentence of preamble or a trailing note despite "no preamble" in
  // the prompt, so don't insist the entire response be JSON.
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.slice(firstBrace, lastBrace + 1)
  }
  const parsed = JSON.parse(cleaned)
  const overall = calculateOverallScore(parsed)
  return {
    ...parsed,
    overall_score: overall,
    grade: getMatchGrade(overall),
  }
}

export { getMatchGrade }
