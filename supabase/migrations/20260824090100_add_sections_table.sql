-- Sections table: a small, ordered, renameable label a recipe's owner can
-- group ingredients and steps under (e.g. "Egg Wash", "Lemon Filling"). Its
-- own table rather than a free-text column repeated on each row so renaming
-- a section is one update, and so the same section reliably groups both its
-- ingredients and its steps under one name instead of two independently
-- typed strings that can drift out of sync. See docs/plans/recipe-sections-plan.md.

create table if not exists public.sections (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes (id) on delete cascade,
    name text not null,
    sort_order integer not null default 0
);

create index if not exists sections_recipe_id_idx on public.sections (recipe_id);

alter table public.sections enable row level security;

drop policy if exists "Sections are viewable by anyone" on public.sections;
create policy "Sections are viewable by anyone"
    on public.sections for select
    to anon, authenticated
    using (true);

drop policy if exists "Users can create sections on their own recipes" on public.sections;
create policy "Users can create sections on their own recipes"
    on public.sections for insert
    with check (owns_recipe(recipe_id));

drop policy if exists "Users can update sections on their own recipes" on public.sections;
create policy "Users can update sections on their own recipes"
    on public.sections for update
    using (owns_recipe(recipe_id))
    with check (owns_recipe(recipe_id));

drop policy if exists "Users can delete sections on their own recipes" on public.sections;
create policy "Users can delete sections on their own recipes"
    on public.sections for delete
    using (owns_recipe(recipe_id));
