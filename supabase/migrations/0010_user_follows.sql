-- User follows

create table if not exists public.user_follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id)
);

create index if not exists user_follows_follower_id_idx on public.user_follows (follower_id);
create index if not exists user_follows_following_id_idx on public.user_follows (following_id);

alter table public.user_follows enable row level security;

create policy "user_follows_select_own" on public.user_follows
for select using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "user_follows_insert_own" on public.user_follows
for insert with check (auth.uid() = follower_id);

create policy "user_follows_delete_own" on public.user_follows
for delete using (auth.uid() = follower_id);
