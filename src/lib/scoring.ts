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

// ─── Prompt construction ──────────────────────────────────────────────────
//
// OpenAI auto-caches the longest stable byte-prefix of the assembled prompt
// (system + start of first user message) for ~5–10 minutes when the prefix
// is ≥1024 tokens. To make that fire, we structure every scoring call as:
//
//   system  = SCORING_SYSTEM_PROMPT          (constant — same every call)
//   user    = buildJobContextMessage(...)    (constant per job)
//          + '\n\n'
//          + buildApplicantMessage(...)      (volatile per applicant)
//
// The {system + jobContext} prefix is identical for every applicant on a
// given job, so the 2nd…Nth applicant for the same job hits the cache.
// Verify with `usage.prompt_tokens_details.cached_tokens > 0` on the
// second call.

export const SCORING_SYSTEM_PROMPT = `You are a senior technical recruiter with 15 years of experience. Score job applications with precision.

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

Respond with a single valid JSON object matching this schema exactly. No preamble, no markdown:
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
}` as const

// ─── Server-side trims (#6, #6a, #6b) ──────────────────────────────────────

const RESUME_MAX_CHARS = 6_000
const COVER_NOTE_MAX_CHARS = 500
const JOB_DESCRIPTION_MAX_CHARS = 2_000

function normaliseWhitespace(text: string): string {
  return text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim()
}

// Boilerplate tails commonly appended to PDF resumes — once we hit one,
// nothing useful follows. Anchored to the end so we don't accidentally
// truncate a resume that mentions "references" mid-sentence.
const RESUME_BOILERPLATE_TAIL_PATTERNS = [
  /references\s+(?:are\s+)?available\s+(?:up)?on\s+request[\s\S]*$/i,
  /\bhobbies?\s*[:\-—][\s\S]{0,500}$/i,
]

export function trimResume(text: string | null | undefined): string {
  if (!text) return ''
  let out = normaliseWhitespace(text)
  for (const re of RESUME_BOILERPLATE_TAIL_PATTERNS) out = out.replace(re, '').trim()
  return out.slice(0, RESUME_MAX_CHARS)
}

// HR boilerplate that usually appears at the END of a JD — equal-opportunity
// statements, "About us", company culture blurbs. Cheap to drop.
const JD_BOILERPLATE_TAIL_PATTERNS = [
  /\bequal\s+opportunity\b[\s\S]*$/i,
  /\babout\s+(?:us|the\s+company)\b[\s\S]*$/i,
  /\bour\s+(?:culture|values|mission)\b[\s\S]*$/i,
]

export function trimJobDescription(text: string | null | undefined): string {
  if (!text) return ''
  let out = normaliseWhitespace(text)
  for (const re of JD_BOILERPLATE_TAIL_PATTERNS) out = out.replace(re, '').trim()
  return out.slice(0, JOB_DESCRIPTION_MAX_CHARS)
}

export function trimCoverNote(text: string | null | undefined): string {
  if (!text) return ''
  return normaliseWhitespace(text).slice(0, COVER_NOTE_MAX_CHARS)
}

// ─── Cacheable per-job context ────────────────────────────────────────────
// Identical for every applicant on a given job → forms the cached prefix
// when concatenated after SCORING_SYSTEM_PROMPT.

export interface JobContext {
  jobTitle: string
  jobDepartment?: string
  jobExperienceLevel?: string
  jobSkills: string[]
  jobDescription?: string
}

export function buildJobContextMessage(job: JobContext): string {
  return `JOB DESCRIPTION:
Title: ${job.jobTitle}
Department: ${job.jobDepartment || 'Not specified'}
Experience Required: ${job.jobExperienceLevel || 'Not specified'}
Required Skills: ${job.jobSkills?.join(', ') || 'Not specified'}
Full Description: ${trimJobDescription(job.jobDescription) || 'Not provided'}`
}

// ─── Volatile per-applicant content ───────────────────────────────────────

export interface ApplicantContent {
  resumeText?: string
  coverNote?: string
}

export function buildApplicantMessage(applicant: ApplicantContent): string {
  return `APPLICANT RESUME:
${trimResume(applicant.resumeText) || 'Not provided'}

COVER NOTE:
${trimCoverNote(applicant.coverNote) || 'Not provided'}`
}

// ─── Compose the full user message in cache-friendly order ────────────────

export function buildScoringUserMessage(
  job: JobContext,
  applicant: ApplicantContent
): string {
  return `${buildJobContextMessage(job)}\n\n${buildApplicantMessage(applicant)}`
}

// ─── Response parsing ─────────────────────────────────────────────────────

export function parseScoreResponse(raw: string): ScoreResult {
  // Strip markdown fences first.
  let cleaned = raw.replace(/```json|```/g, '').trim()
  // Extract the first balanced {...} block. The scoring model occasionally
  // wraps the JSON with prose despite the "no preamble" instruction, so
  // don't insist the entire response be JSON.
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
