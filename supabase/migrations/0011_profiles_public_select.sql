-- Allow authenticated users to search profiles

create index if not exists user_profiles_display_name_idx
  on public.user_profiles (lower(display_name));

create index if not exists user_profiles_location_city_idx
  on public.user_profiles (lower(location_city));

create policy "user_profiles_select_authenticated" on public.user_profiles
for select using (auth.role() = 'authenticated');
