-- Collections: user-curated groupings of their own recipes, distinct from
-- `categories`. Categories are single-assignment/organizational (every
-- recipe has exactly one); collections are many-to-many curated lists
-- ("weeknight dinners", "meal prep"), matching the mockup's Collections tab.

create table if not exists public.collections (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users (id) on delete cascade,
    name text not null,
    description text,
    created_at timestamptz not null default now()
);

create index if not exists collections_user_id_idx on public.collections (user_id);

alter table public.collections enable row level security;

drop policy if exists "Users can view their own collections" on public.collections;
create policy "Users can view their own collections"
    on public.collections for select
    using (user_id = auth.uid());

drop policy if exists "Users can create their own collections" on public.collections;
create policy "Users can create their own collections"
    on public.collections for insert
    with check (user_id = auth.uid());

drop policy if exists "Users can update their own collections" on public.collections;
create policy "Users can update their own collections"
    on public.collections for update
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

drop policy if exists "Users can delete their own collections" on public.collections;
create policy "Users can delete their own collections"
    on public.collections for delete
    using (user_id = auth.uid());

-- Join table: which recipes belong to which collection, with manual ordering.
create table if not exists public.collection_recipes (
    collection_id uuid not null references public.collections (id) on delete cascade,
    recipe_id uuid not null references public.recipes (id) on delete cascade,
    sort_order integer not null default 0,
    primary key (collection_id, recipe_id)
);

create index if not exists collection_recipes_recipe_id_idx on public.collection_recipes (recipe_id);

alter table public.collection_recipes enable row level security;

-- Ownership is derived from the parent collection (mirrors the `ingredients`
-- table's pattern of deriving ownership from its parent recipe).
drop policy if exists "Users can view recipes in their own collections" on public.collection_recipes;
create policy "Users can view recipes in their own collections"
    on public.collection_recipes for select
    using (
        collection_id in (select id from public.collections where user_id = auth.uid())
    );

drop policy if exists "Users can add recipes to their own collections" on public.collection_recipes;
create policy "Users can add recipes to their own collections"
    on public.collection_recipes for insert
    with check (
        collection_id in (select id from public.collections where user_id = auth.uid())
        and recipe_id in (select id from public.recipes where user_id = auth.uid())
    );

drop policy if exists "Users can reorder recipes in their own collections" on public.collection_recipes;
create policy "Users can reorder recipes in their own collections"
    on public.collection_recipes for update
    using (
        collection_id in (select id from public.collections where user_id = auth.uid())
    )
    with check (
        collection_id in (select id from public.collections where user_id = auth.uid())
    );

drop policy if exists "Users can remove recipes from their own collections" on public.collection_recipes;
create policy "Users can remove recipes from their own collections"
    on public.collection_recipes for delete
    using (
        collection_id in (select id from public.collections where user_id = auth.uid())
    );
