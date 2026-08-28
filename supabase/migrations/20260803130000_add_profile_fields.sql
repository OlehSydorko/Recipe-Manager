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
