-- Recipe photos: mirror the existing avatars-bucket pattern (open read,
-- writes stay scoped to the uploader's own folder).
drop policy if exists "Users can view their own recipe images" on storage.objects;
create policy "Any authenticated user can view recipe images"
    on storage.objects for select
    to authenticated
    using (bucket_id = 'recipe-images');

-- Saving: let a user add any existing recipe (not just their own) to one of
-- their own collections. Collection ownership check is unchanged.
drop policy if exists "Users can add recipes to their own collections" on public.collection_recipes;
create policy "Users can save any recipe to their own collections"
    on public.collection_recipes for insert
    with check (
        collection_id in (select id from public.collections where user_id = auth.uid())
        and recipe_id in (select id from public.recipes)
    );
