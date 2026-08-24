# Recipe Sections — Implementation Plan

**Goal:** let a recipe owner divide their ingredient list *and* their instructions into named sections (e.g. "All-Butter Pie Dough", "Egg Wash", "Lemon Filling" — per the reference screenshot), the way NYT Cooking / Bon Appétit recipes do for multi-component dishes. Each section groups a subset of ingredients and a subset of steps under one heading; the checklist behavior (tap to check off) and portion scaling stay exactly as they are today, just applied within each section instead of one flat list.

This covers both ingredients and instructions, per your answer to the scoping question. That's a materially bigger change than the screenshot alone implies (instructions currently isn't its own table at all — see below), so the assumption is flagged up front here in case you want to scale it back to ingredients-only after reading this.

---

## 1. What's actually in the codebase right now (investigated, not assumed)

CLAUDE.md's data-model table already lists a `steps` table, and project memory flagged that CLAUDE.md's "Project Status" section is stale — so this plan verified the *live* Supabase schema directly (`bkpnrqtqmewcqyktyzlh`) rather than trusting migration files:

- **Ingredients are already structured**: `ingredients` (id, recipe_id, name, quantity, unit, sort_order), edited as a flat list of rows, saved via wholesale delete-and-reinsert (`replaceIngredients`) on every form save — not diffed.
- **Instructions are NOT structured today**, despite CLAUDE.md's table implying a `steps` table backs them. In the app, "Instructions" is just `recipes.instructions`, a single free-text column edited in one `<Textarea>` and rendered as one `whitespace-pre-line` block on the detail page (`RecipeDetailClient.tsx`).
- **A `steps` table already exists live** (`id, recipe_id, instruction, sort_order`) — **and it already has full RLS**: SELECT for anyone, INSERT/UPDATE/DELETE scoped to the owner via `owns_recipe(recipe_id)` (same helper function `ingredients` could be using but partially isn't — see gotcha below). It has 0 rows. It was clearly created and fully wired for RLS directly against the database, outside of any file in `supabase/migrations/` — the migration files only ever *reference* it in comments ("table exists in the DB though the app doesn't use it yet"), never create it. This is exactly the kind of drift the earlier guest-access work already flagged for `recipes.instructions` vs the roadmap doc, just one layer deeper (schema vs. migration history, not schema vs. docs).
- **Local migration files and live migration history have already diverged**: `supabase/migrations/` has 17 files going back to July 27, but Supabase's own `list_migrations` only recognizes 6, all from Aug 13 onward. Everything before that (the `ingredients` table itself, `unit`, `instructions`, `portions`, `is_favorite`, `follows`, `collections`, `activity_log`, `avatars`, and whatever created `steps` + `owns_recipe()`) was applied by hand and was never recorded in Supabase's migration history table, even though the tables exist. **A fresh `supabase db push` against a new/empty database would not reproduce the current live schema.**

Neither of these is something this feature needs to fix, but both matter for how the migration in this plan should be written and tested — see §3 and §9.

**Small unrelated thing noticed, not touched:** `ingredients` currently has two INSERT policies doing the same job — one via `owns_recipe()`, one via an inline subquery (`"Users can create ingredients..."` and `"Users can insert ingredients..."`). Harmless (permissive policies OR together) but redundant; flagging per "flag it instead of fixing it inline" rather than cleaning it up as a drive-by.

---

## 2. Data model

### New table: `sections`

A section is a small, ordered, renameable label that both an ingredient row and a step row can belong to. Modeled as its own table (not a free-text column repeated on each row) so renaming "Dough" to "Pie Dough" is one update, not a find-and-replace across every ingredient/step row, and so the same section reliably groups both its ingredients and its steps under one name instead of two independently-typed strings that can drift out of sync (typo one and it silently becomes a different group).

```sql
create table if not exists public.sections (
    id uuid primary key default gen_random_uuid(),
    recipe_id uuid not null references public.recipes (id) on delete cascade,
    name text not null,
    sort_order integer not null default 0
);

create index if not exists sections_recipe_id_idx on public.sections (recipe_id);

alter table public.sections enable row level security;

create policy "Sections are viewable by anyone"
    on public.sections for select
    to anon, authenticated
    using (true);

create policy "Users can create sections on their own recipes"
    on public.sections for insert
    with check (owns_recipe(recipe_id));

create policy "Users can update sections on their own recipes"
    on public.sections for update
    using (owns_recipe(recipe_id))
    with check (owns_recipe(recipe_id));

create policy "Users can delete sections on their own recipes"
    on public.sections for delete
    using (owns_recipe(recipe_id));
```

### `ingredients` and `steps` both get a nullable `section_id`

```sql
alter table public.ingredients
    add column if not exists section_id uuid references public.sections (id) on delete set null;

alter table public.steps
    add column if not exists section_id uuid references public.sections (id) on delete set null;
```

`on delete set null` (not cascade): if a section row is ever removed outside the normal wholesale-replace flow, its ingredients/steps become unsectioned rather than disappearing. `null` = "no section" throughout — this is what makes the feature backward-compatible: every existing ingredient row is `section_id = null` after this migration, so every existing recipe renders exactly as it does today (one flat list, no headings) until the owner explicitly adds a section.

### Catch-up migration for the undocumented `steps` table

Since `steps` and `owns_recipe()` exist live but were never captured in a migration file, this plan should include a migration that recreates them with `create table if not exists` / `create or replace function` / `drop policy if exists then create` — the same idempotent style already used elsewhere in this repo (see `20260727120000_add_ingredients_table.sql`). Applied to the live DB it's a no-op; applied to a fresh database it brings `steps` and `owns_recipe()` into existence for the first time. This closes the drift gap rather than building the sections feature on top of it.

### Backfill: turn existing `recipes.instructions` text into `steps` rows

One-time data migration, run once as part of this feature's rollout, not on every deploy:

```sql
do $$
declare
    r record;
    line text;
    idx integer;
begin
    for r in select id, instructions from public.recipes
             where instructions is not null and trim(instructions) <> ''
    loop
        idx := 0;
        foreach line in array regexp_split_to_array(r.instructions, E'\n') loop
            if trim(line) <> '' then
                insert into public.steps (recipe_id, instruction, sort_order)
                values (r.id, trim(line), idx);
                idx := idx + 1;
            end if;
        end loop;
    end loop;
end $$;
```

This splits each recipe's instructions on line breaks and treats each non-blank line as one step, `section_id = null`. It's a heuristic, not a guarantee — a recipe whose instructions were written as one long paragraph will become one long "step". Given there are only 8 recipes live right now, the pragmatic move is: run this on a Supabase branch first (the `Supabase` MCP tools support `create_branch`), spot-check the resulting `steps` rows against the original `instructions` text for all 8, then apply to production — cheaper and safer than writing a smarter splitter for a one-time job at this scale.

**`recipes.instructions` is not dropped by this migration.** It stays as-is, just unused by the app going forward (see §4). Dropping it is a separate, later cleanup migration once the team has confirmed the `steps` data looks right — consistent with the incremental, one-thing-at-a-time sprint style this project already follows.

---

## 3. Types

```ts
// src/types/section.ts
export type Section = {
    id: string;
    recipe_id: string;
    name: string;
    sort_order: number;
};
```

`src/types/ingredient.ts` — `Ingredient` gains `section_id: string | null`.

```ts
// src/types/step.ts
export type Step = {
    id: string;
    recipe_id: string;
    instruction: string;
    sort_order: number;
    section_id: string | null;
};
```

---

## 4. API + hooks layer (one file per entity, matching the existing pattern)

- **`src/api/sections.ts`** (new) — `getSections(recipeId)`, `replaceSections(recipeId, names: string[])`. Mirrors `replaceIngredients`: delete all existing sections for the recipe, insert the new ordered list, return the inserted rows (with their fresh ids) in the same order they were sent — the client needs that ordering to map local draft section keys to real ids (see §5).
- **`src/api/ingredients.ts`** — `getIngredients` unchanged (already `select('*')`, picks up `section_id` automatically). `replaceIngredients` / `IngredientInput` gain `sectionId: string | null`.
- **`src/api/steps.ts`** (new) — `getSteps(recipeId)`, `replaceSteps(recipeId, steps)`, following `replaceIngredients`'s shape exactly (filter blank instructions, stamp `sort_order` by array index, `sectionId` per row).
- **`src/api/recipes.ts`** — `CreateRecipeInput`/`UpdateRecipeInput` drop `instructions`; `createRecipe`/`updateRecipe` stop writing to `recipes.instructions`. `Recipe`/`RecipeRow` keep the `instructions` field in the type for now (reading old data is harmless) but nothing writes to it anymore.
- **`src/hooks/useSections.ts`** (new), **`src/hooks/useSteps.ts`** (new) — mirror `useIngredients.ts` (`useSections`/`useReplaceSections`, `useSteps`/`useReplaceSteps`), same query-key/invalidation conventions as the rest of `hooks/`.

---

## 5. Editing UX

### Draft model

Sections need a stable *local* identity while being edited, independent of their eventual database id (a brand-new section has no id yet). Ingredient and step drafts reference a section by that local key:

```ts
type SectionDraft = { key: string; name: string };
type IngredientDraft = { key: string; name: string; quantity: string; unit: string; sectionKey: string | null };
type StepDraft = { key: string; instruction: string; sectionKey: string | null };
```

`sectionKey: null` = "no section" (renders with no heading, exactly like today).

### Save sequence

Extends the existing pattern (`createRecipe` → `replaceIngredients`, already two sequential client-side calls, not one DB transaction) by one step at the front:

1. `createRecipe`/`updateRecipe` (unchanged, minus `instructions`)
2. `replaceSections(recipeId, sectionDrafts.map(s => s.name))` → returns real rows in the same order → zip with `sectionDrafts` to build `Map<localKey, realId>`
3. `replaceIngredients` / `replaceSteps`, each draft's `sectionKey` resolved through that map (or `null`)
4. image upload, as today

### Shared editing chrome, two thin components

`IngredientRows.tsx` and the new `StepRows.tsx` need near-identical section-management behavior (add a section, rename it, remove it, add a row to a section, move a row between sections, reorder). Rather than duplicating that in both files, pull the shared, non-visual bits into one place — e.g. `src/features/recipes/sectionedDrafts.ts`: `createEmptySection()`, `addItemToSection()`, `removeSection()` (see open decision below), `moveSectionUp/Down()`. `IngredientRows` and `StepRows` then only differ in the fields they render per row (name/qty/unit vs. a single instruction textarea) and both consume the same helpers. This avoids ~100+ lines of duplicated grouping/reorder logic between two components that must stay behaviorally identical.

Reordering (v1 recommendation): manual "move section up/down" and "move row up/down" buttons, matching the plain, no-new-dependency style already in this codebase (`IngredientRows.tsx` has no drag library today, and `package.json` has none installed). Drag-and-drop (`@dnd-kit`, no relation to any existing dependency) is a nicer UX but is a new dependency and a bigger UI build — worth calling out as a deliberate follow-up if manual reordering feels clunky in practice, not something to default into for v1.

---

## 6. Display UX (`RecipeDetailClient.tsx`)

A pure, testable grouping helper does the work for both the Ingredients block and the new sectioned Instructions block:

```ts
// src/lib/sections.ts
function groupBySection<T extends { section_id: string | null }>(
    sections: Section[], // already sorted by sort_order
    items: T[]           // already sorted by sort_order
): { sectionId: string | null; name: string | null; items: T[] }[]
```

Ungrouped items (`section_id === null`) form their own heading-less group; v1 default is to render that group **first**, before any named section (simple to flip later if you'd rather it render last). Named sections with zero items are dropped from the *display* grouping (nothing to show) but must still appear in the *editing* form so an owner can add ingredients/steps to a section they just created before it has any rows.

- **Ingredients block**: same checklist UI as today, just wrapped once per group under an `<h3>` (or no heading for the ungrouped group), reusing the existing `checkedIds` Set keyed by ingredient id — no change needed there since ids stay globally unique across sections.
- **Instructions block**: replaces the current single `<p className="whitespace-pre-line">{recipe.instructions}</p>` with the same per-section grouping, each step rendered as a numbered list restarting per section (matches how recipe sites typically number steps within a component rather than continuing a single count across unrelated sections — flagging this as a default, easy to change to one continuous count if you'd rather).

---

## 7. Files touched

| File | Change |
|---|---|
| `supabase/migrations/<ts>_catch_up_steps_table.sql` | new — idempotently captures the undocumented live `steps` table + `owns_recipe()` |
| `supabase/migrations/<ts>_add_sections_table.sql` | new — `sections` table + RLS |
| `supabase/migrations/<ts>_add_section_id_to_ingredients_and_steps.sql` | new |
| `supabase/migrations/<ts>_backfill_instructions_to_steps.sql` | new — one-time data migration |
| `src/types/section.ts` | new |
| `src/types/step.ts` | new |
| `src/types/ingredient.ts` | add `section_id` |
| `src/types/recipe.ts` | no change (keep `instructions` field for now) |
| `src/api/sections.ts` | new |
| `src/api/steps.ts` | new |
| `src/api/ingredients.ts` | `section_id` in select/insert |
| `src/api/recipes.ts` | drop `instructions` from create/update inputs |
| `src/hooks/useSections.ts` | new |
| `src/hooks/useSteps.ts` | new |
| `src/hooks/useIngredients.ts` | thread `sectionId` through |
| `src/features/recipes/sectionedDrafts.ts` | new — shared section-editing helpers |
| `src/features/recipes/components/IngredientRows.tsx` | rework for grouped rendering |
| `src/features/recipes/components/StepRows.tsx` | new, mirrors `IngredientRows.tsx` |
| `src/lib/sections.ts` (+ `sections.test.ts`) | new — display-side grouping helper |
| `src/app/(authenticated)/recipes/[id]/RecipeDetailClient.tsx` | sectioned Ingredients + Instructions rendering |
| `src/app/(authenticated)/recipes/new/page.tsx` | wire sections/steps into form state + save sequence |
| `src/app/(authenticated)/recipes/[id]/edit/page.tsx` | same, plus loading existing sections/steps |

---

## 8. Suggested phasing (mentor-style, one sprint at a time — matching how this project has been built so far)

1. **Database foundation** — the four migrations above, tested on a Supabase branch first, especially the backfill.
2. **Data layer** — types, `api/sections.ts`, `api/steps.ts`, `api/ingredients.ts` changes, hooks, `lib/sections.ts` + tests. No UI changes yet; app still behaves exactly as today (nothing calls the new code).
3. **Display** — `RecipeDetailClient.tsx` renders sectioned ingredients/instructions using the new data. Still no editing UI, so sections can only be inspected via seed data at this point — fine for a checkpoint.
4. **Editing** — `sectionedDrafts.ts`, reworked `IngredientRows.tsx`, new `StepRows.tsx`, both recipe form pages.
5. **Follow-ups (deliberately deferred, not part of v1)** — drag-and-drop reordering; dropping `recipes.instructions` once the backfill is verified in practice; cleaning up the duplicate `ingredients` INSERT policy noticed in §1.

---

## 9. Open decisions / defaults this plan assumed

Flagging these explicitly rather than silently picking one, since they're judgment calls:

- **Scope**: instructions move from one free-text block to structured, line-by-line steps for *every* recipe, not just ones that use sections — bigger UX change than sections alone. If you'd rather keep the free-text Instructions field for recipes that don't need sections and only add structure when sections are used, that's a meaningfully different (and messier — two instruction code paths) design; say so and this plan can be revised before Phase 1 starts.
- **Removing a section that still has ingredients/steps in it**: not specified above — recommend prompting the owner to choose "move its items to Ungrouped" vs "delete them with the section," defaulting the modal's primary button to the non-destructive move.
- **Ungrouped items render before named sections**, and **step numbering restarts per section** — both easy one-line changes if you'd rather they behave differently.
- **Backfill heuristic** (one line = one step) needs a manual spot-check against the 8 live recipes before running on production, given it's not a lossless conversion.

---

## 10. Testing

- Unit tests (`vitest`, colocated `.test.ts`, matching `lib/quantity.test.ts` / `lib/formDirty.test.ts`): `lib/sections.ts`'s `groupBySection` — empty sections, ungrouped-only, mixed, out-of-order input.
- `npm run lint` clean on every touched file (per CLAUDE.md).
- Manual QA: portion scaling still applies correctly within a section; favoriting/guest browsing (recipes are public-read) still render sectioned recipes correctly for a non-owner and for a signed-out guest; deleting a recipe still cascades sections/steps (`on delete cascade` from `recipes`); editing an existing pre-backfill recipe shows its migrated steps correctly.
