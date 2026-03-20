create extension if not exists unaccent;

alter table public.user_profiles
  add column if not exists display_name_search text,
  add column if not exists location_city_search text;

update public.user_profiles
set
  display_name_search = lower(unaccent(display_name)),
  location_city_search = lower(unaccent(location_city));

create or replace function public.user_profiles_search_sync()
returns trigger as $$
begin
  new.display_name_search := lower(unaccent(new.display_name));
  new.location_city_search := lower(unaccent(new.location_city));
  return new;
end;
$$ language plpgsql;

drop trigger if exists user_profiles_search_sync on public.user_profiles;

create trigger user_profiles_search_sync
before insert or update on public.user_profiles
for each row execute procedure public.user_profiles_search_sync();

drop policy if exists "profiles_public_select" on public.user_profiles;

create policy "profiles_public_select"
on public.user_profiles
for select
using (true);
