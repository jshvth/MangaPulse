-- Add metadata fields for manga cards
alter table public.user_mangas
  add column if not exists image_url text,
  add column if not exists source_url text,
  add column if not exists total_volumes integer;
