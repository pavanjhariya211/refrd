-- ─── BLOG POSTS ──────────────────────────────────────────────────────────────
-- WordPress-style blog backing /blogs and /blogs/[slug]. Authoring happens
-- in /admin/blogs (gated by ADMIN_USER_IDS), so all writes go through the
-- service role. RLS only exposes published, non-future posts to anon.
-- Idempotent — safe to re-run.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content_html text not null default '',
  cover_image_url text,
  og_image_url text,
  meta_description text,
  -- Override the rel=canonical URL for cross-posted content (e.g. when
  -- the same article also lives on your personal site). NULL means
  -- "use the default /blogs/[slug] canonical".
  canonical_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  -- When status='published' and published_at > now(), the post is scheduled
  -- and stays hidden from anon until the timestamp passes. NULL means
  -- "publish immediately when status flips to published".
  published_at timestamptz,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists blog_posts_status_published_at_idx
  on public.blog_posts (status, published_at desc nulls last);
create index if not exists blog_posts_tags_idx
  on public.blog_posts using gin (tags);

-- Idempotent add for existing installs that ran an earlier version of
-- this file before canonical_url was introduced.
alter table public.blog_posts add column if not exists canonical_url text;

alter table public.blog_posts enable row level security;

drop policy if exists "public reads published blog posts" on public.blog_posts;
create policy "public reads published blog posts"
  on public.blog_posts for select
  using (
    status = 'published'
    and (published_at is null or published_at <= now())
  );

-- All writes (insert/update/delete) go through service role, so no
-- additional policies needed — service role bypasses RLS.

create or replace function public.touch_blog_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists blog_posts_touch on public.blog_posts;
create trigger blog_posts_touch
  before update on public.blog_posts
  for each row execute procedure public.touch_blog_updated_at();

-- ─── STORAGE BUCKET FOR BLOG MEDIA ───────────────────────────────────────────
-- Public bucket — blog images are intentionally hot-linkable so OG cards
-- and Article JSON-LD images work without signed URLs.
insert into storage.buckets (id, name, public)
values ('blog-media', 'blog-media', true)
on conflict (id) do update set public = true;

-- Anyone can read; only authenticated admin uploads go through the
-- service role, so we don't need write policies for anon/auth users.
drop policy if exists "public reads blog-media" on storage.objects;
create policy "public reads blog-media"
  on storage.objects for select
  using (bucket_id = 'blog-media');
