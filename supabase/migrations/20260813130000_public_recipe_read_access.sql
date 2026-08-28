drop policy if exists "Users can view their own recipes" on public.recipes;
create policy "Recipes are viewable by any authenticated user"
    on public.recipes for select
    to authenticated
    using (true);

drop policy if exists "Users can view their own categories" on public.categories;
create policy "Categories are viewable by any authenticated user"
    on public.categories for select
    to authenticated
    using (true);

drop policy if exists "Users can view ingredients on their own recipes" on public.ingredients;
drop policy if exists "Users can view ingredients of their own recipes" on public.ingredients;
create policy "Ingredients are viewable by any authenticated user"
    on public.ingredients for select
    to authenticated
    using (true);

drop policy if exists "Users can view steps of their own recipes" on public.steps;
create policy "Steps are viewable by any authenticated user"
    on public.steps for select
    to authenticated
    using (true);
