export type UserType = 'referrer' | 'jobseeker' | 'both'
export type VerificationStatus = 'unverified' | 'pending' | 'verified'
export type LocationType = 'remote' | 'hybrid' | 'onsite'
export type ExperienceLevel = 'fresher' | '1-3yrs' | '3-7yrs' | '7plus'
export type JobStatus = 'active' | 'draft' | 'closed'
export type ApplicationStatus =
  | 'applied'
  | 'reviewing'
  | 'accepted'
  | 'referred'
  | 'interview'
  | 'offer'
  | 'rejected'
export type MatchGrade = 'A' | 'B' | 'C' | 'D' | 'F'
export type PaymentStatus = 'paid' | 'refunded' | 'pending'
export type PaymentRecordStatus = 'created' | 'captured' | 'refunded' | 'failed'

export function getBidRank(bidAmount: number, allBids: number[]): number {
  const sorted = [...allBids].sort((a, b) => b - a)
  return sorted.indexOf(bidAmount) + 1
}

export function getMatchGrade(score: number): MatchGrade {
  if (score >= 85) return 'A'
  if (score >= 70) return 'B'
  if (score >= 55) return 'C'
  if (score >= 40) return 'D'
  return 'F'
}

export const MATCH_GRADE_META: Record<
  MatchGrade,
  { label: string; color: string; bg: string }
> = {
  A: { label: 'Excellent Match', color: '#E8FF47', bg: '#111111' },
  B: { label: 'Good Match', color: '#E8FF47', bg: '#111111' },
  C: { label: 'Partial Match', color: '#FAFAFA', bg: '#111111' },
  D: { label: 'Weak Match', color: '#888888', bg: '#111111' },
  F: { label: 'Poor Match', color: '#555555', bg: '#111111' },
}

export const APPLICATION_STATUS_META: Record<
  ApplicationStatus,
  { label: string; color: string; bg: string }
> = {
  applied: { label: 'Applied', color: '#FAFAFA', bg: '#161616' },
  reviewing: { label: 'Under Review', color: '#E8FF47', bg: '#161616' },
  accepted: { label: 'Accepted', color: '#E8FF47', bg: '#161616' },
  referred: { label: 'Referred', color: '#E8FF47', bg: '#161616' },
  interview: { label: 'Interview', color: '#E8FF47', bg: '#161616' },
  offer: { label: 'Offer', color: '#E8FF47', bg: '#161616' },
  rejected: { label: 'Closed', color: '#FF5C5C', bg: '#161616' },
}

export interface Profile {
  id: string
  email: string
  name?: string
  profile_photo?: string
  headline?: string
  location?: string
  bio?: string
  user_type: UserType
  verification_status: VerificationStatus
  company_name?: string
  linkedin_url?: string
  linkedin_verified_at?: string
  github_url?: string
  skills: string[]
  reputation_score: number
  total_referrals: number
  successful_referrals: number
  avg_response_days?: number
  is_open_to_work: boolean
  created_at: string
  updated_at: string
}

// Public-safe referrer summary — what we expose to job seekers.
export type PublicReferrer = Pick<
  Profile,
  | 'id'
  | 'reputation_score'
  | 'successful_referrals'
  | 'company_name'
  | 'verification_status'
  | 'avg_response_days'
>

export interface JobPost {
  id: string
  referrer_id: string
  company_name: string
  title: string
  department?: string
  location?: string
  location_type: LocationType
  experience_level?: ExperienceLevel
  skills: string[]
  description?: string
  interview_process?: string
  deadline?: string
  referral_bonus?: string
  min_bid: number
  current_highest_bid: number
  openings: number
  applications_count: number
  status: JobStatus
  created_at: string
  updated_at: string
  referrer?: PublicReferrer
}

export interface Application {
  id: string
  job_id: string
  applicant_id: string
  resume_url?: string
  // resume_text is server-side only — never present on the client.
  cover_note?: string
  linkedin_url?: string
  portfolio_url?: string
  status: ApplicationStatus
  bid_amount: number
  payment_status: PaymentStatus
  match_score?: number
  match_grade?: MatchGrade
  referrer_notes?: string
  created_at: string
  updated_at: string
  job?: JobPost
  applicant?: Pick<
    Profile,
    'id' | 'name' | 'headline' | 'profile_photo' | 'linkedin_url' | 'skills'
  >
  match?: MatchScore
  proof?: ReferralProof | null
}

export interface MatchScore {
  id: string
  application_id: string
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
  scored_at: string
}

export interface Payment {
  id: string
  application_id: string
  applicant_id: string
  amount: number
  razorpay_order_id?: string
  razorpay_payment_id?: string
  status: PaymentRecordStatus
  platform_fee?: number
  referrer_payout?: number
  paid_at?: string
  created_at: string
}

export interface ReferrerWallet {
  id: string
  referrer_id: string
  balance: number
  total_earned: number
  total_withdrawn: number
}

export interface WalletTransaction {
  id: string
  wallet_id: string
  type: 'credit' | 'withdrawal'
  amount: number
  description?: string
  created_at: string
}

export type ReferralProofStatus = 'approved' | 'needs_review' | 'rejected'

export interface ReferralProof {
  id: string
  application_id: string
  referrer_id: string
  proof_url: string
  // proof_path is server-side only — never read on the client
  status: ReferralProofStatus
  ocr_extracted_company?: string
  ocr_extracted_candidate?: string
  ocr_sender?: string
  ocr_reasoning?: string
  ocr_model?: string
  reviewed_by?: string
  reviewed_at?: string
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  application_id: string
  content: string
  is_read: boolean
  created_at: string
  sender?: Pick<Profile, 'id' | 'name' | 'profile_photo'>
}
