-- Add source metadata for manga entries
alter table public.user_mangas
  add column if not exists source text default 'jikan',
  add column if not exists source_id text;

update public.user_mangas
  set source = 'jikan'
  where source is null;

update public.user_mangas
  set source_id = mal_id::text
  where source_id is null and mal_id is not null;

create index if not exists user_mangas_source_idx
  on public.user_mangas (user_id, source, source_id);
