-- Notifications support

alter table public.user_mangas
  add column if not exists last_notified_at timestamptz;

create table if not exists public.notification_queue (
  id uuid primary key default gen_random_uuid(),
  user_manga_id uuid not null references public.user_mangas(id) on delete cascade,
  release_id uuid not null references public.manga_releases(id) on delete cascade,
  channel text not null default 'email' check (channel in ('email')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (user_manga_id, release_id, channel)
);

create index if not exists notification_queue_user_manga_id_idx
  on public.notification_queue (user_manga_id);

create index if not exists notification_queue_status_idx
  on public.notification_queue (status);

alter table public.notification_queue enable row level security;

create policy "notification_queue_select_own" on public.notification_queue
for select using (
  exists (
    select 1 from public.user_mangas um
    where um.id = notification_queue.user_manga_id
      and um.user_id = auth.uid()
  )
);
