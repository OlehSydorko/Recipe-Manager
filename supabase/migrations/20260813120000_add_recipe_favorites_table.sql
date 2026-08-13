-- Per-user favorites, replacing the recipes.is_favorite column. That column
-- only worked while a recipe could only ever be seen by its owner; once
-- recipes are readable by any user (see public_recipe_read_access
-- migration), "favorite" has to be per-viewer, not a single flag on the row.

create table if not exists public.recipe_favorites (
    user_id uuid not null references auth.users (id) on delete cascade,
    recipe_id uuid not null references public.recipes (id) on delete cascade,
    created_at timestamptz not null default now(),
    primary key (user_id, recipe_id)
);

create index if not exists recipe_favorites_recipe_id_idx on public.recipe_favorites (recipe_id);

alter table public.recipe_favorites enable row level security;

drop policy if exists "Users can view their own favorites" on public.recipe_favorites;
create policy "Users can view their own favorites"
    on public.recipe_favorites for select
    using (user_id = auth.uid());

drop policy if exists "Users can favorite recipes as themselves" on public.recipe_favorites;
create policy "Users can favorite recipes as themselves"
    on public.recipe_favorites for insert
    with check (user_id = auth.uid());

drop policy if exists "Users can unfavorite as themselves" on public.recipe_favorites;
create policy "Users can unfavorite as themselves"
    on public.recipe_favorites for delete
    using (user_id = auth.uid());

-- Backfill existing favorites before the source column goes away.
insert into public.recipe_favorites (user_id, recipe_id)
select user_id, id from public.recipes where is_favorite = true
on conflict (user_id, recipe_id) do nothing;

-- The old trigger logged favoriting against the recipe's owner (new.user_id),
-- which only happened to be correct because owner and favoriter were always
-- the same person under the old model. Replace it with a trigger on the new
-- table, keyed to whoever actually favorited it.
drop trigger if exists trg_log_recipe_favorited on public.recipes;
drop function if exists public.log_recipe_favorited();

create or replace function public.log_recipe_favorited()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.activity_log (user_id, type, recipe_id)
    values (new.user_id, 'recipe_favorited', new.recipe_id);

    return new;
end;
$$;

drop trigger if exists trg_log_recipe_favorited on public.recipe_favorites;
create trigger trg_log_recipe_favorited
    after insert on public.recipe_favorites
    for each row
    execute function public.log_recipe_favorited();

alter table public.recipes drop column if exists is_favorite;
