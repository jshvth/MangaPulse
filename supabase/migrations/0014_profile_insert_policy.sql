create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
  perform set_config('search_path', 'public', true);
  perform set_config('row_security', 'off', true);

  insert into public.user_profiles (user_id, display_name)
  values (
    new.id,
    coalesce(
      nullif(trim(coalesce(new.raw_user_meta_data->>'display_name', '')), ''),
      nullif(
        trim(
          coalesce(new.raw_user_meta_data->>'first_name', '') || ' ' ||
          coalesce(new.raw_user_meta_data->>'last_name', '')
        ),
        ''
      )
    )
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$ language plpgsql security definer;

drop policy if exists "user_profiles_insert_own" on public.user_profiles;

create policy "user_profiles_insert_own" on public.user_profiles
for insert with check (auth.uid() = user_id or current_user = 'postgres');
