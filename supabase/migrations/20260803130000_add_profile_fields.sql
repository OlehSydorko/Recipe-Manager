-- Profile page fields. CLAUDE.md states a `profiles` table already exists
-- (id, display_name, avatar_url), seeded by a signup trigger. That trigger
-- isn't captured in this migrations folder (it predates it), so this file is
-- written to be safe either way: CREATE TABLE IF NOT EXISTS is a no-op if the
-- table is already there, and the new columns are added with IF NOT EXISTS.
--
-- IMPORTANT: if the table did NOT already exist, the signup trigger that's
-- supposed to create/seed it is still missing and needs to be located and
-- ported into a migration separately — this file only adds the shape needed
-- for the profile page, it does not recreate that trigger.

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    avatar_url text,
    created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists tagline text;
alter table public.profiles add column if not exists location text;
alter table public.profiles add column if not exists bio text;

alter table public.profiles enable row level security;

-- A user can view any profile (needed for follower/following lists to render
-- names + avatars of other users) but only edit their own.
drop policy if exists "Profiles are viewable by any authenticated user" on public.profiles;
create policy "Profiles are viewable by any authenticated user"
    on public.profiles for select
    to authenticated
    using (true);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update
    using (id = auth.uid())
    with check (id = auth.uid());
