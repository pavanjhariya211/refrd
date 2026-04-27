import type { ApplicationStatus, ExperienceLevel, LocationType } from '@/types'

export const APP_NAME = 'Refrd'

// Storage bucket name for resume PDFs. Must match the bucket created in
// Supabase and the bucket_id used in the storage RLS policies.
export const RESUMES_BUCKET = 'Resume-2'

export const FREE_MATCH_CHECK_LIMIT = 5

export const APPLY_AUTO_REFUND_DAYS = 7

export const KANBAN_COLUMNS: { id: 'new' | 'reviewing' | 'referred' | 'closed'; label: string; statuses: ApplicationStatus[] }[] = [
  { id: 'new', label: 'New Applications', statuses: ['applied'] },
  { id: 'reviewing', label: 'Under Review', statuses: ['reviewing', 'accepted'] },
  { id: 'referred', label: 'Referred', statuses: ['referred', 'interview', 'offer'] },
  { id: 'closed', label: 'Closed', statuses: ['rejected'] },
]

export const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'fresher', label: 'Fresher' },
  { value: '1-3yrs', label: '1–3 years' },
  { value: '3-7yrs', label: '3–7 years' },
  { value: '7plus', label: '7+ years' },
]

export const LOCATION_TYPES: { value: LocationType; label: string }[] = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
]

export const DECLINE_REASONS = [
  'Not enough experience',
  'Skills gap',
  'Role filled',
  'Not a fit currently',
] as const

export const PUBLIC_REFERRER_FIELDS =
  'id, reputation_score, successful_referrals, company_name, verification_status, avg_response_days'

export const APPLICATION_PUBLIC_FIELDS =
  'id, job_id, applicant_id, resume_url, cover_note, linkedin_url, portfolio_url, status, bid_amount, payment_status, match_score, match_grade, referrer_notes, created_at, updated_at'
