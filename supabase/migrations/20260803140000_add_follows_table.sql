create table if not exists public.follows (
    follower_id uuid not null references auth.users (id) on delete cascade,
    followed_id uuid not null references auth.users (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (follower_id, followed_id),
    constraint follows_no_self_follow check (follower_id <> followed_id)
);

create index if not exists follows_followed_id_idx on public.follows (followed_id);

alter table public.follows enable row level security;

drop policy if exists "Users can view follow relationships they're part of" on public.follows;
create policy "Users can view follow relationships they're part of"
    on public.follows for select
    using (follower_id = auth.uid() or followed_id = auth.uid());

drop policy if exists "Users can follow others as themselves" on public.follows;
create policy "Users can follow others as themselves"
    on public.follows for insert
    with check (follower_id = auth.uid());

drop policy if exists "Users can unfollow as themselves" on public.follows;
create policy "Users can unfollow as themselves"
    on public.follows for delete
    using (follower_id = auth.uid());
