-- Adds a public/private flag to collections so a user can choose to make a
-- collection viewable by anyone (guests included), matching the same
-- visibility model recipes already have. Defaults to false so every existing
-- collection stays private until its owner opts in.

alter table public.collections add column if not exists is_public boolean not null default false;

drop policy if exists "Users can view their own collections" on public.collections;
create policy "Users can view their own or public collections"
    on public.collections for select
    to anon, authenticated
    using (is_public = true or user_id = auth.uid());

-- collection_recipes visibility mirrors the parent collection: a row is
-- readable if its collection is public, or if the viewer owns it. Replaces
-- the previous owner-only subquery policy.
drop policy if exists "Users can view recipes in their own collections" on public.collection_recipes;
create policy "Users can view recipes in public or their own collections"
    on public.collection_recipes for select
    to anon, authenticated
    using (
        collection_id in (
            select id from public.collections where is_public = true or user_id = auth.uid()
        )
    );
