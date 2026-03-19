-- User profiles

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  bio text,
  avatar_url text,
  favorite_1 text,
  favorite_2 text,
  favorite_3 text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_user_profiles_updated_at
before update on public.user_profiles
for each row execute function public.set_updated_at();

alter table public.user_profiles enable row level security;

create policy "user_profiles_select_own" on public.user_profiles
for select using (auth.uid() = user_id);

create policy "user_profiles_insert_own" on public.user_profiles
for insert with check (auth.uid() = user_id);

create policy "user_profiles_update_own" on public.user_profiles
for update using (auth.uid() = user_id);
