-- Opens read access to recipes and everything needed to render one
-- (categories, ingredients, steps) to any authenticated user, matching the
-- pattern already used by profiles/avatars: SELECT is open, writes stay
-- scoped to the owner via auth.uid() / owns_recipe(). This is the DB half of
-- making recipes public; the app layer still needs to split "my recipes"
-- from "everyone's recipes" so existing screens don't start showing every
-- user's data (tracked separately).

-- recipes
drop policy if exists "Users can view their own recipes" on public.recipes;
create policy "Recipes are viewable by any authenticated user"
    on public.recipes for select
    to authenticated
    using (true);

-- categories (needed so another user's recipe card/detail page can resolve
-- the category name; creating/editing a category, or assigning one to a
-- recipe, stays owner-only)
drop policy if exists "Users can view their own categories" on public.categories;
create policy "Categories are viewable by any authenticated user"
    on public.categories for select
    to authenticated
    using (true);

-- ingredients: replace both the legacy owns_recipe()-based policy and the
-- inline-subquery policy (both present on the live DB, only one of which
-- was ever captured in a migration file) with a single open-read policy.
drop policy if exists "Users can view ingredients on their own recipes" on public.ingredients;
drop policy if exists "Users can view ingredients of their own recipes" on public.ingredients;
create policy "Ingredients are viewable by any authenticated user"
    on public.ingredients for select
    to authenticated
    using (true);

-- steps (mirrors ingredients; table exists in the DB though the app doesn't
-- use it yet)
drop policy if exists "Users can view steps of their own recipes" on public.steps;
create policy "Steps are viewable by any authenticated user"
    on public.steps for select
    to authenticated
    using (true);
