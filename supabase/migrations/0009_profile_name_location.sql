-- Add name and location fields to user profiles

alter table public.user_profiles
  add column if not exists display_name text,
  add column if not exists location_city text,
  add column if not exists location_country text;
