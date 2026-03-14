-- Core schema for MangaPulse

create extension if not exists "pgcrypto";

create table if not exists public.user_mangas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  mal_id integer,
  isbn text,
  current_volume integer not null default 0,
  latest_volume integer,
  status text not null default 'reading' check (status in ('reading', 'completed', 'paused', 'dropped', 'planned')),
  needs_notification boolean not null default false,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_mangas_user_id_idx on public.user_mangas (user_id);
create index if not exists user_mangas_mal_id_idx on public.user_mangas (mal_id);

create table if not exists public.manga_releases (
  id uuid primary key default gen_random_uuid(),
  user_manga_id uuid not null references public.user_mangas(id) on delete cascade,
  volume integer not null,
  release_date date,
  source text,
  source_url text,
  created_at timestamptz not null default now(),
  unique (user_manga_id, volume)
);

create index if not exists manga_releases_user_manga_id_idx on public.manga_releases (user_manga_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_user_mangas_updated_at
before update on public.user_mangas
for each row execute function public.set_updated_at();

-- RLS
alter table public.user_mangas enable row level security;
alter table public.manga_releases enable row level security;

-- Policies for user_mangas
create policy "user_mangas_select_own" on public.user_mangas
for select using (auth.uid() = user_id);

create policy "user_mangas_insert_own" on public.user_mangas
for insert with check (auth.uid() = user_id);

create policy "user_mangas_update_own" on public.user_mangas
for update using (auth.uid() = user_id);

create policy "user_mangas_delete_own" on public.user_mangas
for delete using (auth.uid() = user_id);

-- Policies for manga_releases (via ownership of user_mangas)
create policy "manga_releases_select_own" on public.manga_releases
for select using (
  exists (
    select 1 from public.user_mangas um
    where um.id = manga_releases.user_manga_id
      and um.user_id = auth.uid()
  )
);

create policy "manga_releases_insert_own" on public.manga_releases
for insert with check (
  exists (
    select 1 from public.user_mangas um
    where um.id = manga_releases.user_manga_id
      and um.user_id = auth.uid()
  )
);

create policy "manga_releases_update_own" on public.manga_releases
for update using (
  exists (
    select 1 from public.user_mangas um
    where um.id = manga_releases.user_manga_id
      and um.user_id = auth.uid()
  )
);

create policy "manga_releases_delete_own" on public.manga_releases
for delete using (
  exists (
    select 1 from public.user_mangas um
    where um.id = manga_releases.user_manga_id
      and um.user_id = auth.uid()
  )
);
