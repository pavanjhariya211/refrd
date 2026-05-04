# Refrd v2.1

A competitive auction marketplace where job seekers bid for referrals from verified
employees. Highest bid is reviewed first. Full refund if not selected. AI score is
fully visible to both sides.

Built with **Next.js 14 (App Router) · Supabase · TypeScript · Tailwind CSS · OpenAI · Razorpay**.

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
# OPENAI_API_KEY, Razorpay keys, CRON_SECRET.

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
      score-application/     OpenAI scoring (server-side, uses resume_text)
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
2. **Authentication → URL Configuration → Redirect URLs** — add **both**:
   - `${NEXT_PUBLIC_APP_URL}/auth/callback` (used after email confirmation and
     Google OAuth login)
   - `${NEXT_PUBLIC_APP_URL}/auth/verify-callback` (used after LinkedIn link)
3. **In your LinkedIn developer app** (linkedin.com/developers/apps), add
   Supabase's callback (`https://<project>.supabase.co/auth/v1/callback`) as an
   authorised redirect URL.
4. Make sure the LinkedIn app has **Sign In with LinkedIn using OpenID Connect**
   product approved.

## Storage bucket (resumes)

Create a private bucket named `resumes` (Storage → New bucket → public OFF).
Then run these in the SQL editor so seekers can upload to their own folder
and the referrer-side server uses signed URLs:

```sql
create policy "Users can upload own resumes" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own resumes" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'resumes'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

The upload path is `${userId}/${jobId}/${filename}` so the first folder
matches `auth.uid()`.

## Storage bucket (proofs)

Used for the referrer-uploaded screenshots of referral confirmation emails.
Same RLS pattern as `resumes`. Create a private bucket named `proofs`
(Storage → New bucket → public OFF), then:

```sql
create policy "Users can upload own proofs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can read own proofs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'proofs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
```

If you want a different bucket name, edit `PROOFS_BUCKET` in
`src/lib/constants.ts` and keep the SQL `bucket_id` in sync.

## Admin access (proof review queue)

The `/admin/proof-queue` page and the `/api/admin/*` routes are gated
on the `ADMIN_USER_IDS` env var — a comma-separated list of Supabase
user UUIDs.

To make yourself an admin:

1. Sign in to Refrd at least once via LinkedIn (this provisions your
   profile row).
2. Find your UUID in Supabase SQL editor:
   ```sql
   select id, email from auth.users where email = 'you@example.com';
   ```
3. Vercel → Settings → Environment Variables → add
   `ADMIN_USER_IDS=<your-uuid>` (comma-separated for multiple).
4. Redeploy.
5. Visit `/admin/proof-queue` — non-admins get a 404, admins see the queue.

## Email notifications (optional, via Resend)

If `RESEND_API_KEY` and `EMAIL_FROM` are set in env vars, transactional
emails fire automatically:

- **Admin alert** when a proof lands in `needs_review` (so you don't
  have to babysit the queue)
- **Referrer email** on approve — "your payout was credited"
- **Seeker email** on reject — "your bid was refunded"

If either env var is missing the email step logs to the Vercel function
console and continues — nothing breaks. Get a key at
[resend.com](https://resend.com); the free tier covers 3K emails/month.

`EMAIL_FROM` must use a domain you've verified in Resend
(`Refrd <noreply@yourdomain.com>`). For testing without verification,
use `onboarding@resend.dev` and pass any to-address you control.

## Referral proof verification flow

After a referrer clicks "Refer" on an applicant:

1. The Refer modal asks for a screenshot of the referral confirmation email
   from the company's ATS (Greenhouse, Lever, Workday, etc.) or directly
   from the company.
2. The screenshot uploads to the `proofs` bucket and `POST /api/referrals/submit-proof`
   runs gpt-4o-mini Vision against it.
3. The model decides `approved` / `needs_review` / `rejected` based on whether
   the candidate name and company match the application.
4. **Approved** → wallet credit happens immediately (15% platform fee);
   referrer + seeker get an email if Resend is configured.
5. **Needs review** → row lands in `referral_proofs` with
   `status='needs_review'`; admins are emailed and clear the queue at
   `/admin/proof-queue` (one-click Approve releases the payout, Reject
   refunds the seeker via Razorpay).
6. **Rejected** → referrer sees a clear error and can retry with a
   clearer screenshot. If they don't retry within 3 days the seeker is
   auto-refunded by the daily cron.

If a `needs_review` row sits in the queue for more than 7 days without
an admin decision, the daily auto-refund cron refunds the seeker on
its own — no payout is ever stuck indefinitely.

This gates payouts on actual proof of referral, which means a spammer
can't collect bid money for fake job posts.

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

One prompt, two entry points. Both call OpenAI (gpt-4o-mini, JSON mode)
with the same `buildScorePrompt()` from `src/lib/scoring.ts`:

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
