-- Fix handle_new_user() so Google (and other OAuth) sign-ups get a real
-- display name and avatar instead of a null display_name.
--
-- Previously this only read raw_user_meta_data->>'display_name', which is
-- only populated on email/password sign-up. Google sign-in populates
-- full_name/name/avatar_url/picture instead.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'
    )
  );

  insert into public.categories (user_id, name)
  values
    (new.id, 'Breakfast'),
    (new.id, 'Lunch'),
    (new.id, 'Dinner'),
    (new.id, 'Dessert'),
    (new.id, 'Snacks'),
    (new.id, 'Drinks');

  return new;
end;
$$;
