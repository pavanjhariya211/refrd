-- RefHire v2.1 — Full Database Schema
-- Run this in the Supabase SQL Editor.

create extension if not exists "uuid-ossp";

-- ─── PROFILES ───────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text not null,
  name text,
  profile_photo text,
  headline text,
  location text,
  bio text,
  user_type text check (user_type in ('referrer','jobseeker','both')) default 'jobseeker',
  verification_status text check (verification_status in ('unverified','pending','verified')) default 'unverified',
  company_name text,
  linkedin_url text,
  linkedin_verified_at timestamptz,   -- set when LinkedIn OAuth identity is linked
  github_url text,
  skills text[] default '{}',
  reputation_score integer default 0,
  total_referrals integer default 0,
  successful_referrals integer default 0,
  avg_response_days numeric(4,1),
  is_open_to_work boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── JOB POSTS ──────────────────────────────────────────────────────────────
create table public.job_posts (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  title text not null,
  department text,
  location text,
  location_type text check (location_type in ('remote','hybrid','onsite')) default 'remote',
  experience_level text check (experience_level in ('fresher','1-3yrs','3-7yrs','7plus')),
  skills text[] default '{}',
  description text,
  interview_process text,
  deadline date,
  referral_bonus text,
  min_bid integer default 0,
  current_highest_bid integer default 0,
  openings integer default 1,
  applications_count integer default 0,
  status text check (status in ('active','draft','closed')) default 'active',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_job_posts_status on public.job_posts(status);
create index idx_job_posts_referrer on public.job_posts(referrer_id);
create index idx_job_posts_created on public.job_posts(created_at desc);

-- ─── APPLICATIONS ────────────────────────────────────────────────────────────
create table public.applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.job_posts(id) on delete cascade not null,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  resume_url text,
  resume_text text,             -- server-side only; never returned to client
  cover_note text,
  linkedin_url text,
  portfolio_url text,
  status text check (status in (
    'applied','reviewing','accepted','referred','interview','offer','rejected'
  )) default 'applied',
  bid_amount integer not null default 0,
  payment_id text,
  payment_status text check (payment_status in ('paid','refunded','pending')) default 'pending',
  match_score integer,
  match_grade text check (match_grade in ('A','B','C','D','F')),
  referrer_notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(job_id, applicant_id)
);

create index idx_applications_job on public.applications(job_id);
create index idx_applications_applicant on public.applications(applicant_id);
create index idx_applications_bid on public.applications(job_id, bid_amount desc);

-- ─── PAYMENTS ────────────────────────────────────────────────────────────────
create table public.payments (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.applications(id) on delete cascade not null unique,
  applicant_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  razorpay_order_id text unique,
  razorpay_payment_id text unique,
  razorpay_signature text,
  status text check (status in ('created','captured','refunded','failed')) default 'created',
  refund_id text,
  refund_initiated_at timestamptz,
  platform_fee integer,
  referrer_payout integer,
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- ─── MATCH SCORES ────────────────────────────────────────────────────────────
create table public.match_scores (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.applications(id) on delete cascade not null unique,
  overall_score integer check (overall_score between 0 and 100),
  grade text check (grade in ('A','B','C','D','F')),
  skills_score integer,
  experience_score integer,
  relevance_score integer,
  education_score integer,
  cover_note_score integer,
  keyword_score integer,
  matched_skills text[] default '{}',
  missing_skills text[] default '{}',
  ai_summary text,
  improvement_tips text[],
  scored_at timestamptz default now(),
  model_version text default 'claude-sonnet-4-20250514'
);

-- ─── REFERRALS ───────────────────────────────────────────────────────────────
create table public.referrals (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.applications(id) on delete cascade not null unique,
  referrer_id uuid references public.profiles(id) on delete cascade not null,
  submitted_at timestamptz default now(),
  notes text,
  created_at timestamptz default now()
);

-- ─── REFERRER WALLETS ────────────────────────────────────────────────────────
create table public.referrer_wallets (
  id uuid default uuid_generate_v4() primary key,
  referrer_id uuid references public.profiles(id) on delete cascade not null unique,
  balance integer default 0,
  total_earned integer default 0,
  total_withdrawn integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ─── WALLET TRANSACTIONS ─────────────────────────────────────────────────────
create table public.wallet_transactions (
  id uuid default uuid_generate_v4() primary key,
  wallet_id uuid references public.referrer_wallets(id) on delete cascade not null,
  type text check (type in ('credit','withdrawal')) not null,
  amount integer not null,
  reference_id uuid,
  description text,
  created_at timestamptz default now()
);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────
create table public.messages (
  id uuid default uuid_generate_v4() primary key,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  receiver_id uuid references public.profiles(id) on delete cascade not null,
  application_id uuid references public.applications(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create index idx_messages_application on public.messages(application_id, created_at);

-- ─── SAVED JOBS ──────────────────────────────────────────────────────────────
create table public.saved_jobs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.job_posts(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(user_id, job_id)
);

-- ─── MATCH CHECK USAGE ───────────────────────────────────────────────────────
create table public.match_check_usage (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  month_key text not null,
  usage_count integer default 0,
  unique(user_id, month_key)
);

-- ─── ROW LEVEL SECURITY ──────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.job_posts enable row level security;
alter table public.applications enable row level security;
alter table public.payments enable row level security;
alter table public.match_scores enable row level security;
alter table public.referrals enable row level security;
alter table public.referrer_wallets enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.messages enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.match_check_usage enable row level security;

-- Profiles
create policy "Profiles viewable by all" on public.profiles for select using (true);
create policy "Own profile update" on public.profiles for update using (auth.uid() = id);
create policy "Own profile insert" on public.profiles for insert with check (auth.uid() = id);

-- Job posts
create policy "Active jobs public" on public.job_posts
  for select using (status = 'active' or referrer_id = auth.uid());
create policy "Referrers create jobs" on public.job_posts
  for insert with check (auth.uid() = referrer_id);
create policy "Referrers update own jobs" on public.job_posts
  for update using (auth.uid() = referrer_id);

-- Applications
create policy "Application access" on public.applications
  for select using (
    applicant_id = auth.uid() or
    job_id in (select id from public.job_posts where referrer_id = auth.uid())
  );
create policy "Applicants create" on public.applications
  for insert with check (auth.uid() = applicant_id);
create policy "Referrers update status" on public.applications
  for update using (
    job_id in (select id from public.job_posts where referrer_id = auth.uid())
  );

-- Payments
create policy "Payment access" on public.payments
  for select using (
    applicant_id = auth.uid() or
    application_id in (
      select a.id from public.applications a
      join public.job_posts j on j.id = a.job_id
      where j.referrer_id = auth.uid()
    )
  );
create policy "Applicants create payments" on public.payments
  for insert with check (auth.uid() = applicant_id);

-- Match scores: full transparency for both sides
create policy "Match score full access" on public.match_scores
  for select using (
    application_id in (
      select id from public.applications
      where applicant_id = auth.uid()
         or job_id in (select id from public.job_posts where referrer_id = auth.uid())
    )
  );

-- Wallet
create policy "Own wallet" on public.referrer_wallets for all using (referrer_id = auth.uid());
create policy "Own transactions" on public.wallet_transactions
  for select using (
    wallet_id in (select id from public.referrer_wallets where referrer_id = auth.uid())
  );

-- Messages
create policy "Message participants" on public.messages
  for select using (sender_id = auth.uid() or receiver_id = auth.uid());
create policy "Authenticated users send" on public.messages
  for insert with check (auth.uid() = sender_id);

-- Saved jobs / match usage
create policy "Own saved jobs" on public.saved_jobs for all using (auth.uid() = user_id);
create policy "Own match usage" on public.match_check_usage for all using (auth.uid() = user_id);

-- ─── DATABASE FUNCTIONS ──────────────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.ensure_referrer_wallet()
returns trigger as $$
begin
  if new.user_type in ('referrer','both') and
     (old.user_type is null or old.user_type not in ('referrer','both')) then
    insert into public.referrer_wallets (referrer_id)
    values (new.id) on conflict do nothing;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_referrer_role_set on public.profiles;
create trigger on_referrer_role_set
  after update on public.profiles
  for each row execute procedure public.ensure_referrer_wallet();

create or replace function public.increment_application_count()
returns trigger as $$
begin
  update public.job_posts
  set applications_count = applications_count + 1
  where id = new.job_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_application_created on public.applications;
create trigger on_application_created
  after insert on public.applications
  for each row execute procedure public.increment_application_count();

create or replace function public.update_highest_bid()
returns trigger as $$
begin
  if new.payment_status = 'paid' and new.bid_amount > 0 then
    update public.job_posts
    set current_highest_bid = greatest(current_highest_bid, new.bid_amount)
    where id = new.job_id;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_bid_paid on public.applications;
create trigger on_bid_paid
  after insert or update on public.applications
  for each row execute procedure public.update_highest_bid();

-- ─── REALTIME ────────────────────────────────────────────────────────────────
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.applications;
alter publication supabase_realtime add table public.job_posts;
