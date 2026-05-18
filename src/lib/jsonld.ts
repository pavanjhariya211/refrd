import type { JobPost, ExperienceLevel, LocationType } from '@/types'

export const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? 'https://refrd-ruby.vercel.app'
export const SITE_NAME = 'Refrd'
export const LINKEDIN_URL = 'https://www.linkedin.com/company/refrd-ai/'
const SITE_DESCRIPTION =
  'Refrd is a competitive auction marketplace where job seekers bid for referrals from verified employees. Highest bids are reviewed first. Full refund if not selected.'

// schema.org maps. JobPosting expects a fixed enum for employmentType
// and a structured experience requirement.
const EXPERIENCE_MONTHS: Record<ExperienceLevel, number> = {
  fresher: 0,
  '1-3yrs': 12,
  '3-7yrs': 36,
  '7plus': 84,
}

const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  remote: 'Remote',
  hybrid: 'Hybrid',
  onsite: 'On-site',
}

// ─── Organization (homepage) ──────────────────────────────────────────────
export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    alternateName: 'Refrd.ai',
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    description: SITE_DESCRIPTION,
    sameAs: [LINKEDIN_URL],
  }
}

// ─── WebSite + SearchAction (homepage) ────────────────────────────────────
export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/jobs?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

// ─── JobPosting (job detail page) ─────────────────────────────────────────
// Drives Google for Jobs eligibility. We surface the posted company as
// the hiringOrganization; the referral mechanics happen on Refrd but the
// role itself is at the company.
export function jobPostingJsonLd(job: JobPost) {
  const isRemote = job.location_type === 'remote'

  const base: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description:
      job.description?.trim() ||
      `${job.title} at ${job.company_name}. Get referred by a verified employee on Refrd.`,
    datePosted: job.created_at,
    employmentType: 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company_name,
    },
    identifier: {
      '@type': 'PropertyValue',
      name: job.company_name,
      value: job.id,
    },
    directApply: false,
    url: `${SITE_URL}/jobs/${job.id}`,
  }

  if (job.deadline) base.validThrough = job.deadline
  if (job.department) base.industry = job.department

  if (isRemote) {
    base.jobLocationType = 'TELECOMMUTE'
    base.applicantLocationRequirements = {
      '@type': 'Country',
      name: 'India',
    }
  } else {
    base.jobLocation = {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location || undefined,
        addressCountry: 'IN',
      },
    }
  }

  if (job.experience_level) {
    base.experienceRequirements = {
      '@type': 'OccupationalExperienceRequirements',
      monthsOfExperience: EXPERIENCE_MONTHS[job.experience_level],
    }
  }

  if (job.skills?.length) {
    base.skills = job.skills.join(', ')
  }

  // Human-readable working-mode hint inside description context.
  base.workHours = LOCATION_TYPE_LABEL[job.location_type]

  return base
}

// ─── BreadcrumbList ───────────────────────────────────────────────────────
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// ─── Article (blog post) ──────────────────────────────────────────────────
// Drives Google's Article rich result + AI-answer attribution. Headline
// is required and capped at 110 chars by Google. We use the post's
// cover image (or OG override) so the rich result shows a thumbnail.
export function articleJsonLd(post: {
  title: string
  slug: string
  excerpt?: string | null
  meta_description?: string | null
  cover_image_url?: string | null
  og_image_url?: string | null
  published_at?: string | null
  updated_at: string
  created_at: string
}) {
  const url = `${SITE_URL}/blogs/${post.slug}`
  const image = post.og_image_url || post.cover_image_url || `${SITE_URL}/logo.png`
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title.slice(0, 110),
    description:
      post.meta_description?.trim() ||
      post.excerpt?.trim() ||
      `${post.title} — read on the Refrd blog.`,
    image: [image],
    datePublished: post.published_at ?? post.created_at,
    dateModified: post.updated_at,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    url,
    author: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
  }
}

// ─── Blog (index page) ────────────────────────────────────────────────────
export function blogJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: `${SITE_NAME} Blog`,
    url: `${SITE_URL}/blogs`,
    description:
      'Insights on hiring, employee referrals, and the job-search marketplace from the Refrd team.',
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
    },
  }
}

// ─── FAQPage ──────────────────────────────────────────────────────────────
export function faqPageJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.answer,
      },
    })),
  }
}
