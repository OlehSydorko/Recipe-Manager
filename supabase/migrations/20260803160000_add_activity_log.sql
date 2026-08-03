-- Activity feed backing the profile page's Activity tab. Rows are written by
-- triggers (not app code) so the log can't drift from what actually
-- happened, mirroring how the signup trigger seeds categories rather than
-- relying on frontend code to do it.
--
-- No insert/update/delete RLS policy is defined for regular users — the only
-- way rows get in is via the SECURITY DEFINER trigger functions below, which
-- bypass RLS by design. Users can only ever read their own activity.

create table if not exists public.activity_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    type text not null check (
        type in ('recipe_created', 'recipe_favorited', 'followed_user', 'collection_created')
    ),
    recipe_id uuid references public.recipes (id) on delete set null,
    target_user_id uuid references auth.users (id) on delete set null,
    created_at timestamptz not null default now()
);

create index if not exists activity_log_user_id_created_at_idx
    on public.activity_log (user_id, created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists "Users can view their own activity" on public.activity_log;
create policy "Users can view their own activity"
    on public.activity_log for select
    using (user_id = auth.uid());

-- recipe_created
create or replace function public.log_recipe_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.activity_log (user_id, type, recipe_id)
    values (new.user_id, 'recipe_created', new.id);

    return new;
end;
$$;

drop trigger if exists trg_log_recipe_created on public.recipes;
create trigger trg_log_recipe_created
    after insert on public.recipes
    for each row
    execute function public.log_recipe_created();

-- recipe_favorited (only log the false -> true transition, not every save)
create or replace function public.log_recipe_favorited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    if new.is_favorite = true and old.is_favorite = false then
        insert into public.activity_log (user_id, type, recipe_id)
        values (new.user_id, 'recipe_favorited', new.id);
    end if;

    return new;
end;
$$;

drop trigger if exists trg_log_recipe_favorited on public.recipes;
create trigger trg_log_recipe_favorited
    after update on public.recipes
    for each row
    execute function public.log_recipe_favorited();

-- followed_user
create or replace function public.log_followed_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.activity_log (user_id, type, target_user_id)
    values (new.follower_id, 'followed_user', new.followed_id);

    return new;
end;
$$;

drop trigger if exists trg_log_followed_user on public.follows;
create trigger trg_log_followed_user
    after insert on public.follows
    for each row
    execute function public.log_followed_user();

-- collection_created
create or replace function public.log_collection_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.activity_log (user_id, type)
    values (new.user_id, 'collection_created');

    return new;
end;
$$;

drop trigger if exists trg_log_collection_created on public.collections;
create trigger trg_log_collection_created
    after insert on public.collections
    for each row
    execute function public.log_collection_created();
