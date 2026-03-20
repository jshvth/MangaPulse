create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
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

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user_profile();
