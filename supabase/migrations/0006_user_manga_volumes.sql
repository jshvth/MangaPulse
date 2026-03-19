-- Track owned volumes per manga

create table if not exists public.user_manga_volumes (
  id uuid primary key default gen_random_uuid(),
  user_manga_id uuid not null references public.user_mangas(id) on delete cascade,
  volume integer not null check (volume > 0),
  created_at timestamptz not null default now(),
  unique (user_manga_id, volume)
);

create index if not exists user_manga_volumes_user_manga_id_idx
  on public.user_manga_volumes (user_manga_id);

alter table public.user_manga_volumes enable row level security;

create policy "user_manga_volumes_select_own" on public.user_manga_volumes
for select using (
  exists (
    select 1 from public.user_mangas um
    where um.id = user_manga_volumes.user_manga_id
      and um.user_id = auth.uid()
  )
);

create policy "user_manga_volumes_insert_own" on public.user_manga_volumes
for insert with check (
  exists (
    select 1 from public.user_mangas um
    where um.id = user_manga_volumes.user_manga_id
      and um.user_id = auth.uid()
  )
);

create policy "user_manga_volumes_delete_own" on public.user_manga_volumes
for delete using (
  exists (
    select 1 from public.user_mangas um
    where um.id = user_manga_volumes.user_manga_id
      and um.user_id = auth.uid()
  )
);
