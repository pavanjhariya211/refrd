# RefHire v2.1

A competitive auction marketplace where job seekers bid for referrals from verified
employees. Highest bid is reviewed first. Full refund if not selected. AI score is
fully visible to both sides.

Built with **Next.js 14 (App Router) · Supabase · TypeScript · Tailwind CSS · Claude API · Razorpay**.

## The three rules this codebase is built around

1. **Competitive auction** — Job seekers bid freely. Highest bid = reviewed first.
2. **Upfront payment, immediate payout** — Job seeker pays on apply. Referrer is paid
   the moment they submit the referral.
3. **Full AI score transparency** — Both the referrer and the job seeker see the
   complete score, sub-scores, matched skills, missing skills, and AI summary.

## Setup

```bash
npm install

# 1. Configure Supabase + secrets
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, anon key, service role key,
# ANTHROPIC_API_KEY, Razorpay keys, CRON_SECRET.

# 2. Apply the database schema
# Open supabase/schema.sql in the Supabase SQL Editor and run it.

# 3. Create a public storage bucket called "resumes" in Supabase
#    with the policies you want (recommended: authenticated read/write,
#    only the owner can read their own files).

# 4. Run dev server
npm run dev
```

## Project layout

```
src/
  app/                       Next.js App Router routes
    api/
      score-application/     Claude scoring (server-side, uses resume_text)
      score-status/[id]/     Polled by ApplyModal after payment success
      quick-match/           Pre-apply free score check (5/month)
      extract-resume/        PDF text extraction
      payments/
        create-order/        Razorpay order creation
        verify/              HMAC signature check + application + bg scoring
        release/             Refer → credit referrer wallet (15% fee, min ₹50)
        refund/              Decline → Razorpay refund
        auto-refund/         Daily cron (vercel.json)
    auth/                    login / signup / callback
    jobs/                    listings + detail (live BidDisplay)
    post-job/                wizard with min_bid
    dashboard/
      seeker/                bid rank + AI score panel + refunds
      referrer/              jobs list, wallet, kanban
    messages/                Supabase Realtime threads
    profile/[id]/            public profile
    settings/profile/        edit profile
    verify/                  link LinkedIn to verify employment
    auth/verify-callback/    handles the LinkedIn OAuth return + flips
                             verification_status to 'verified'
  components/
    ui/                      Design system (Button, Input, MatchGradeBadge, ScorePanel, …)
    forms/                   ApplyModal (3-step), PostJobForm
    layouts/                 Navbar, Footer, FilterSidebar
  hooks/                     useUser, useJobs, useLiveBid, useMessages, useSavedJobs
  lib/
    supabase/                browser + server clients
    scoring.ts               Score weights, prompt builder, fee math
    razorpay.ts              SDK + HMAC verification
    constants.ts             Public field allow-list, kanban columns, fees
    utils.ts                 cn, formatINR, getInitials, …
  types/                     Domain types
  middleware.ts              Auth gate for /dashboard, /messages, /post-job, /settings, /verify
supabase/
  schema.sql                 Tables, RLS, triggers, realtime publications
vercel.json                  Daily auto-refund cron
```

## Privacy rules (non-negotiable)

These are enforced both in RLS and in client query shapes:

1. **`resume_text` is server-side only.** Stored on `applications` for AI scoring,
   never returned in any client `.select()`. The `Application` type does not
   include it.
2. **Referrer name/email are never exposed.** Job seekers see reputation, successful
   referrals, company name, verification status, and avg response time only. Use
   `PUBLIC_REFERRER_FIELDS` from `src/lib/constants.ts` whenever joining a referrer.
3. **Bid amounts across competing applicants are private.** Job seeker only sees:
   their own bid, current highest aggregate, their rank.
4. **`ScorePanel` shows full data to both parties** — full transparency. Pass
   `showImprovementTips` to surface job-seeker tips; this prop changes presentation
   only, never visibility of the score itself.

## Employee verification (LinkedIn OAuth)

Verification is performed by linking a LinkedIn identity via Supabase's
`linkedin_oidc` provider. There is no work-email step.

```
/verify  → user enters company name, clicks "Verify with LinkedIn"
        → supabase.auth.linkIdentity({ provider: 'linkedin_oidc' })
        → LinkedIn → /auth/verify-callback
        → server reads user.identities, pulls the LinkedIn URL + avatar,
          sets profile.linkedin_url, profile.linkedin_verified_at,
          profile.verification_status = 'verified'
```

To enable this in Supabase:

1. **Authentication → Providers → LinkedIn (OIDC)** — turn on, paste the LinkedIn
   client id and secret.
2. Add `${NEXT_PUBLIC_APP_URL}/auth/verify-callback` to the LinkedIn app's
   redirect URLs.
3. Make sure the project has the LinkedIn OIDC scopes `openid profile email`
   enabled (Supabase default).

## Money flow

```
Seeker bids ₹X via Razorpay
   ↓
/api/payments/verify (HMAC signature checked, application created, bg scoring kicked off)
   ↓
   ┌── Referrer clicks Refer  ─→ /api/payments/release
   │     fee  = max(50, round(X * 0.15))
   │     payout = X − fee → wallet credit + wallet_transactions row
   │
   └── Referrer clicks Decline ─→ /api/payments/refund
         Razorpay refund → application.payment_status = 'refunded'

Cron /api/payments/auto-refund (daily 02:00 UTC):
   refunds any 'applied' + 'paid' application older than 7 days
```

## AI scoring

One prompt, two entry points. Both call Claude with the same
`buildScorePrompt()` from `src/lib/scoring.ts`:

- `POST /api/score-application` — runs after payment verification, writes
  `match_scores` row visible to both parties via RLS.
- `POST /api/quick-match` — pre-apply preview, capped at 5/month per user via
  `match_check_usage`. Does not persist scores or applications.

Score breakdown:

| Dimension          | Weight |
|--------------------|--------|
| skills_score       | 30%    |
| experience_score   | 20%    |
| relevance_score    | 20%    |
| education_score    | 10%    |
| cover_note_score   | 10%    |
| keyword_score      | 10%    |

Grades: A ≥ 85, B ≥ 70, C ≥ 55, D ≥ 40, F < 40.

## Deploying

1. Connect the repo to Vercel.
2. Add the same env vars from `.env.example`.
3. The cron in `vercel.json` runs `/api/payments/auto-refund` daily at 02:00 UTC,
   protected by `CRON_SECRET`.
4. Razorpay webhooks are not strictly required — verification is per-payment via
   HMAC in `/api/payments/verify`.

## Final checklist

- [x] Referrer `name`/`email` never returned in any public query
- [x] Employee verification uses LinkedIn OAuth (no work-email collection)
- [x] `resume_text` never sent to client — server API routes only
- [x] `ScorePanel` renders identically for both parties (no conditional hiding)
- [x] Bid amounts across competing applicants never leaked (only aggregate)
- [x] Razorpay signature verified before any DB write
- [x] Platform fee minimum ₹50 enforced
- [x] `useLiveBid` cleans up Realtime subscription on unmount
- [x] Auto-refund cron protected with `CRON_SECRET`
- [x] RLS policies in `supabase/schema.sql`
- [x] `ScorePanel` has skeleton state while scoring runs
- [x] Match score poll after payment success
- [x] `sonner` Toaster mounted in root layout
- [x] `not-found.tsx` and `error.tsx` present
- [x] Mobile layout works at 375px (ApplyModal is full-screen on mobile)
