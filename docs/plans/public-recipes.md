# Plan: Public Recipes (any user can view any recipe)

Scope, confirmed with Dmytro: fully public (any authenticated user, not just followers), applied retroactively to all existing recipes, with view + favorite/save on other users' recipes. Editing/deleting stays owner-only.

This is a bigger step than the "family sharing" feature CLAUDE.md currently describes as planned. The `follows` migration explicitly says following "grants no visibility into their recipes" and that recipe RLS is untouched by design — this plan reverses that decision, so CLAUDE.md needs updating as part of the work, not just the code.

## Grounding (checked against the live Supabase project, not just the migrations folder)

- Live RLS on `recipes`, `categories`: all four operations gated by `auth.uid() = user_id`. No public-read anywhere yet.
- `ingredients` and `steps` derive access via an `owns_recipe(recipe_id)` SQL function (`recipe.user_id = auth.uid()`). Note: the live DB has drift from the migrations folder — there are duplicate SELECT/INSERT policies on `ingredients` (one set from the original hand-set-up schema using `owns_recipe()`, one set added later via migration using an inline subquery) and a `steps` table that exists in the DB but has no migration file and no app code using it (no `src/API/steps.ts`). Worth cleaning up while touching this area, but not blocking.
- `profiles` and the `avatars` storage bucket already use the pattern we need: SELECT open to any authenticated user, INSERT/UPDATE/DELETE scoped to the owner. That's the template for `recipes`, `categories`, `ingredients`, `steps`, and the `recipe-images` bucket.
- `is_favorite` is a boolean **column on `recipes`**, not a per-user table. That only worked because only the owner could ever see (or favorite) a recipe. Once recipes are public, "favorite" must become per-viewer, or User B favoriting a recipe would flip it as favorited for User A too. This needs a new join table, not just an RLS change.
- `activity_log` has a trigger `log_recipe_favorited` on `recipes` UPDATE that logs the event against `new.user_id` — i.e. it logs favoriting against the recipe's **owner**, which only happened to be correct because owner and favoriter were always the same person. This trigger breaks (semantically and literally, once `is_favorite` is removed) and needs to move to the new favorites table, keyed to the person who favorited.
- `collection_recipes` INSERT policy requires `recipe_id in (select id from recipes where user_id = auth.uid())` — i.e. you can only add your *own* recipes to your own collections today. "Save" (add someone else's recipe to your collection) needs this loosened.
- Current data: 8 recipes, 2 distinct authors, 1 favorited. Small enough that backfill/migration risk is low.
- `getCategories()` and `useRecipes()`/`getRecipes()` currently return "everything visible," which today equals "everything mine" only because RLS filters it. Once RLS opens up, these same calls silently start returning *everyone's* rows to *every* screen that uses them (My Recipes page, the category dropdown on the recipe form, home stats) unless the app layer adds its own filtering. This is the main non-DB risk in this change.

## Phase 1 — Data model change: per-user favorites

1. New migration: `recipe_favorites` table — `user_id uuid references auth.users`, `recipe_id uuid references recipes on delete cascade`, `created_at`, primary key `(user_id, recipe_id)`. RLS: select/insert/delete where `user_id = auth.uid()`.
2. Backfill: `insert into recipe_favorites (user_id, recipe_id) select user_id, id from recipes where is_favorite = true;` (1 row today).
3. Drop `trg_log_recipe_favorited` / `log_recipe_favorited()` on `recipes`; add an equivalent trigger on `recipe_favorites` INSERT that logs `activity_log(user_id = new.user_id, type = 'recipe_favorited', recipe_id = new.recipe_id)` — now correctly keyed to the favoriter, not the owner.
4. Drop the `is_favorite` column from `recipes`.
5. App-side: replace `setRecipeFavorite` in `src/API/recipes.ts` with a `src/API/favorites.ts` (add/remove/list favorite recipe ids for the current user). Update `useSetRecipeFavorite` (in `useRecipes.ts`) into a favorites-backed hook — keep the existing optimistic-update pattern, just against the new table. `FavoriteStar` and `RecipeCard` need `isFavorite` sourced from this new hook instead of `recipe.is_favorite`.

## Phase 2 — RLS: open up read access

One migration, following the `profiles`/`avatars` pattern exactly (SELECT open, writes stay owner-scoped):

- `recipes`: replace `"Users can view their own recipes"` with a policy using `true` for SELECT. Leave INSERT/UPDATE/DELETE as `auth.uid() = user_id`.
- `categories`: same — SELECT open, writes stay owner-scoped. (Needed so a recipe card can resolve another user's category name.)
- `ingredients`, `steps`: SELECT open (drop the duplicate legacy policies on `ingredients` while here); INSERT/UPDATE/DELETE keep using `owns_recipe()`.
- `storage.objects` for the `recipe-images` bucket: add `"Any authenticated user can view recipe images"` (SELECT, `bucket_id = 'recipe-images'`), same as the existing avatars policy. Leave INSERT/UPDATE/DELETE scoped to the uploader's folder.
- `collection_recipes`: loosen the INSERT check from "recipe owned by you" to "recipe exists" (`recipe_id in (select id from recipes)`) so a recipe from any author can be saved into your own collection. Collection ownership check (`collection_id in your collections`) is unchanged.
- Run `get_advisors` (security lints) after applying, to catch anything unintended opened up alongside this.

## Phase 3 — API layer

- `src/API/recipes.ts`: `getRecipes()` currently relies on RLS to mean "mine." Split into `getMyRecipes()` (explicit `.eq('user_id', user.id)`) and keep `getRecipes()` as the unfiltered "everyone's recipes" call for the new browse surface. Attach author info: either a join (`select *, profiles(display_name, avatar_url)`) or a follow-up profiles fetch, so cards/detail pages can show who wrote it.
- `src/API/categories.ts`: `getCategories()` must become explicitly owner-filtered (`getMyCategories()`), since it feeds the create/edit recipe category dropdown and `CategoryFilter` on the My Recipes view — those must not show or allow assigning another user's category. If a "browse by category" view on Discover is wanted later, that's a separate, explicitly-unfiltered call.
- `src/API/collections.ts`: verify "add recipe to collection" doesn't assume ownership client-side (RLS now allows any existing recipe; no client change expected beyond removing any stale assumption).

## Phase 4 — Hooks (`src/hooks`)

- `useRecipes.ts`: split `useRecipes()` into `useMyRecipes()` and `useCommunityRecipes()` (or similar), with distinct query keys so invalidations don't cross-contaminate (e.g. deleting your own recipe shouldn't need to refetch the whole community feed, and vice versa).
- `useCategories.ts`: mirror the same split (`useMyCategories()` for forms/filters).
- New `useFavorites.ts` (or extend `useRecipes.ts`) replacing `useSetRecipeFavorite`.

## Phase 5 — UI

- `/recipes` page: keep default behavior as "My Recipes" (uses `useMyRecipes()` + `useMyCategories()` — unchanged UX for the common case). Add a second tab/segment, "Discover," backed by `useCommunityRecipes()`.
- `RecipeCard`: accept optional author name/avatar props; render a small byline when the card is shown outside "My Recipes" context.
- Recipe detail page (`recipes/[id]/page.tsx`): fetch the author profile; only render the Edit/Delete/upload-image affordances (`ActionMenu`, delete `Modal`, image picker) when `recipe.user_id === session user id`. Currently these render unconditionally because only the owner could ever load this page — that assumption breaks the moment recipes are public. Show a "by {name}" byline linking to `/profile/[id]` otherwise.
- `FavoriteStar`: wire to the new favorites hook; works the same regardless of who owns the recipe.
- Add a "Save to collection" action on recipes you don't own, reusing the existing `CollectionModal` flow (now unblocked by the Phase 2 RLS change).
- `HomeStats` / home page: confirm it uses `useMyRecipes()`, not the new unfiltered query, so "your recipe count" doesn't silently become "everyone's recipe count."

## Phase 6 — Docs

Update `CLAUDE.md`:
- Security model section: recipes/categories/ingredients/steps are now readable by any authenticated user; writes remain owner-scoped (`auth.uid() = user_id`).
- Data model table: note `is_favorite` is gone, replaced by `recipe_favorites`.
- Remove/replace the framing that recipes are "private to its owner by default" — they're now public-by-default, with per-recipe privacy explicitly out of scope for this pass (can be a documented future option, same way family sharing was).
- Project Status: log this as a completed sprint.

## Phase 7 — Verification

- `npm run lint`.
- Two-account manual test: User B can view User A's recipe (detail page, ingredients, image) and favorite/save it; User B cannot edit or delete it (confirm the API call is rejected by RLS, not just hidden by the UI).
- `get_advisors` after migrations for security/lint issues.
- Confirm the recipe create/edit category dropdown only ever shows the current user's own categories.
- Confirm deleting your own recipe doesn't affect other users' `recipe_favorites` or `collection_recipes` rows pointing at it in a broken way (cascade behavior — `recipe_favorites.recipe_id` and `collection_recipes.recipe_id` should both be `on delete cascade`, so a favorite/save just quietly disappears if the original is deleted, which is the right behavior).

## Suggested sprint breakdown

Given the "one sprint at a time" pattern in CLAUDE.md: Phase 1+2 (DB) as one sprint, Phase 3+4 (API/hooks) as the next, Phase 5 (UI) as the largest sprint, Phase 6+7 (docs + verification) closing it out.
