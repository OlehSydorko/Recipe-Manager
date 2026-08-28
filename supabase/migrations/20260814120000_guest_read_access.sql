drop policy if exists "Recipes are viewable by any authenticated user" on public.recipes;
create policy "Recipes are viewable by anyone"
    on public.recipes for select
    to anon, authenticated
    using (true);

drop policy if exists "Categories are viewable by any authenticated user" on public.categories;
create policy "Categories are viewable by anyone"
    on public.categories for select
    to anon, authenticated
    using (true);

drop policy if exists "Ingredients are viewable by any authenticated user" on public.ingredients;
create policy "Ingredients are viewable by anyone"
    on public.ingredients for select
    to anon, authenticated
    using (true);

drop policy if exists "Steps are viewable by any authenticated user" on public.steps;
create policy "Steps are viewable by anyone"
    on public.steps for select
    to anon, authenticated
    using (true);

drop policy if exists "Profiles are viewable by any authenticated user" on public.profiles;
create policy "Profiles are viewable by anyone"
    on public.profiles for select
    to anon, authenticated
    using (true);

drop policy if exists "Any authenticated user can view recipe images" on storage.objects;
create policy "Anyone can view recipe images"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'recipe-images');

drop policy if exists "Any authenticated user can view avatars" on storage.objects;
create policy "Anyone can view avatars"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'avatars');
