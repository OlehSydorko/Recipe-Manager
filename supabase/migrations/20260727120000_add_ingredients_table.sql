-- Ingredients table: one row per ingredient line on a recipe.
-- Checklist "checked" state is intentionally NOT stored here — it's client-only
-- (React state), resets on reload. See CLAUDE.md data model notes.

create table if not exists public.ingredients (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes (id) on delete cascade,
    name text not null,
    quantity text,
    sort_order integer not null default 0
);

create index if not exists ingredients_recipe_id_idx on public.ingredients (recipe_id);

alter table public.ingredients enable row level security;

-- Ownership is derived from the parent recipe (ingredients has no user_id of its own).
-- drop-then-create makes this safe to re-run if the policies already exist.
drop policy if exists "Users can view ingredients on their own recipes" on public.ingredients;
create policy "Users can view ingredients on their own recipes"
    on public.ingredients for select
    using (
        recipe_id in (select id from public.recipes where user_id = auth.uid())
    );

drop policy if exists "Users can insert ingredients on their own recipes" on public.ingredients;
create policy "Users can insert ingredients on their own recipes"
    on public.ingredients for insert
    with check (
        recipe_id in (select id from public.recipes where user_id = auth.uid())
    );

drop policy if exists "Users can update ingredients on their own recipes" on public.ingredients;
create policy "Users can update ingredients on their own recipes"
    on public.ingredients for update
    using (
        recipe_id in (select id from public.recipes where user_id = auth.uid())
    )
    with check (
        recipe_id in (select id from public.recipes where user_id = auth.uid())
    );

drop policy if exists "Users can delete ingredients on their own recipes" on public.ingredients;
create policy "Users can delete ingredients on their own recipes"
    on public.ingredients for delete
    using (
        recipe_id in (select id from public.recipes where user_id = auth.uid())
    );
