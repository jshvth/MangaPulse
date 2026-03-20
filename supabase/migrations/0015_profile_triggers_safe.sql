create extension if not exists unaccent;

create or replace function public.user_profiles_search_sync()
returns trigger as $$
begin
  begin
    new.display_name_search := lower(unaccent(new.display_name));
    new.location_city_search := lower(unaccent(new.location_city));
  exception when others then
    new.display_name_search := lower(new.display_name);
    new.location_city_search := lower(new.location_city);
  end;
  return new;
end;
$$ language plpgsql;

update public.user_profiles
set
  display_name_search = lower(unaccent(display_name)),
  location_city_search = lower(unaccent(location_city));

create or replace function public.handle_new_user_profile()
returns trigger as $$
begin
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
  exception when others then
    -- Never block auth creation if profile sync fails
    null;
  end;

  return new;
end;
$$ language plpgsql security definer;
