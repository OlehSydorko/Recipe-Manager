-- Catch-up migration: `steps` and `owns_recipe()` already exist on the live
-- database (created directly, outside any migration file, before this
-- repo's migration history started being tracked) but were never captured
-- here. This brings the migrations folder in sync with reality so a fresh
-- database ends up with the same schema production already has. Applied to
-- the live DB this is a no-op; on a fresh database it creates both for the
-- first time. Definitions below were read back from the live database
-- rather than guessed.

create or replace function public.owns_recipe(p_recipe_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from recipes
    where recipes.id = p_recipe_id
    and recipes.user_id = auth.uid()
  );
$$;

create table if not exists public.steps (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes (id) on delete cascade,
    instruction text not null,
    sort_order integer not null default 0
);

create index if not exists steps_recipe_id_idx on public.steps (recipe_id);

alter table public.steps enable row level security;

drop policy if exists "Steps are viewable by anyone" on public.steps;
create policy "Steps are viewable by anyone"
    on public.steps for select
    to anon, authenticated
    using (true);

drop policy if exists "Users can create steps on their own recipes" on public.steps;
create policy "Users can create steps on their own recipes"
    on public.steps for insert
    with check (owns_recipe(recipe_id));

drop policy if exists "Users can update steps on their own recipes" on public.steps;
create policy "Users can update steps on their own recipes"
    on public.steps for update
    using (owns_recipe(recipe_id))
    with check (owns_recipe(recipe_id));

drop policy if exists "Users can delete steps on their own recipes" on public.steps;
create policy "Users can delete steps on their own recipes"
    on public.steps for delete
    using (owns_recipe(recipe_id));
