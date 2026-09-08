# Ratings & Comments — Implementation Plan

Status: **planning only, nothing implemented yet**. Written 2026-09-07 after investigating the live codebase and Supabase schema (project `bkpnrqtqmewcqyktyzlh`) directly, not just the migrations folder — see [[project_recipe_manager_status.md]] for why that distinction matters here.

## 1. What we're building

- 5-star rating on every recipe. 5 = "best restaurant's quality", 1 = "garbage" — this is just copy on the rating UI, no schema impact.
- Writing a comment always requires a star rating first (Play Store pattern): you set your stars, then an optional text box opens up. A rating with no text is a valid, complete review.
- One rating+review per user per recipe. Posting again edits your existing one (Play Store also works this way — you don't get two reviews on the same app).
- Comments support: likes, replies (unlimited nesting, per your answer), timestamp, username, avatar.
- Guests (not signed in) can read all ratings/comments/replies, but every write action (rate, comment, reply, like, edit, delete) is blocked and prompts sign-in — this reuses the exact `useRequireAuth` + `AuthGateModal` gate already used for favoriting.
- Decisions you already made: recipe owners **cannot** rate/review their own recipe; recipe owners **can** delete any comment/reply on their own recipe (moderation) in addition to authors deleting their own; reply threads can nest arbitrarily deep.

## 2. Relevant existing state (from investigation)

- **Auth/guest model already fits this feature perfectly.** Recipes, ingredients, steps, and profiles are already public-read (`to anon, authenticated using (true)` RLS, added in `20260813130000_public_recipe_read_access.sql` / `20260814120000_guest_read_access.sql`). The recipe detail page (`/recipes/[id]`) is not in `middleware.ts`'s protected paths, so guests already land on it. We don't need any middleware changes — just RLS + the same client-side gating pattern.
- **The gating pattern to copy exactly**: `useRequireAuth()` (`src/hooks/useRequireAuth.ts`) returns `{ isGuest, requireAuth, authGate }`. A component wraps its write action in `requireAuth(() => doTheThing())`; if the user is a guest it pops `AuthGateModal` instead. `FavoriteStar.tsx` is the cleanest reference implementation of this — rating stars, like buttons, and the comment composer should all follow it.
- **Ownership-scoped RLS already has a reusable helper**: `owns_recipe(p_recipe_id uuid)` (a `STABLE SQL` function checking `recipes.user_id = auth.uid()`) is already used by `ingredients`/`steps` RLS. Comment moderation-by-owner RLS should reuse this function rather than re-deriving ownership.
- **Data-fetching/mutation conventions** (from `api/recipes.ts`, `api/favorites.ts`, `api/profiles.ts`, `hooks/useRecipes.ts`, `hooks/useProfile.ts`):
  - One file per entity in `src/api/`, components never call `supabase.from()` directly.
  - Every mutating function grabs `supabase.auth.getSession()` itself and throws `'Not authenticated'` if there's no user — belt-and-braces alongside RLS.
  - TanStack Query hooks in `src/hooks/`, optimistic updates for toggle-style actions (see `useSetRecipeFavorite`'s `onMutate`/`onError`/`onSettled` — the like button should follow this shape).
  - Batch lookups instead of N+1: `getProfilesByIds`, `getFavoriteRecipeIds` fetch once and get joined client-side. Comments need the same treatment for author profiles and per-user "did I like this" state.
  - Signed URLs for avatars: `avatar_url` on `profiles` is a **storage path**, not a public URL — `getAvatarSignedUrl(path)` / `useAvatarUrl(path)` turn it into a 1-hour signed URL. Comment cards need this per unique author, but TanStack Query dedupes identical `['avatar-url', path]` keys across cards for free.
  - "Flat rows → grouped tree" is an established pattern: `src/lib/sections.ts`'s `groupBySection` takes flat `ingredients`/`steps` + `sections` and groups them for rendering. Comments need the same idea (flat rows → nested reply tree), so a sibling pure-function module + test is the right shape, not a new pattern.
  - Mutations that touch `updated_at` set it explicitly (`updated_at: new Date().toISOString()`) rather than a DB trigger — follow that for edited comments.
- **No generic `Avatar` component exists yet** — profile pictures are rendered ad hoc per screen. Comments will render many avatars at once (author + every reply author), so this is a good moment to add one small reusable `components/ui/Avatar.tsx` (image + initials fallback while loading/missing) rather than duplicating the `<img>` + fallback logic in every comment row.
- **`relativeTime.ts` only has day-level granularity** ("Today" / "Yesterday" / "N days ago" / absolute date after a week). Fine for recipe cards, too coarse for a comment thread where "3 minutes ago" matters. This needs extending (see §6).
- **CLAUDE.md's data-model table is already known to be incomplete/stale** (it doesn't list `collections`, `follows`, `sections`, `shopping_list_items`, etc. even though they exist) — worth updating once this ships, but not a blocker, and not a source of truth to design against.

## 3. Data model

One self-referencing table covers reviews *and* replies — a "review" is just a comment with `parent_id is null` and a mandatory `rating`; a reply is a comment with `parent_id` set and no rating. This keeps likes, editing, deleting, and moderation as *one* set of rules instead of two parallel systems.

### `recipe_comments`

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `recipe_id` | `uuid not null references recipes(id) on delete cascade` | |
| `user_id` | `uuid not null references auth.users(id) on delete cascade` | |
| `parent_id` | `uuid null references recipe_comments(id) on delete cascade` | null = top-level review; set = reply (to a review or to another reply — unlimited depth) |
| `rating` | `smallint null check (rating between 1 and 5)` | required on top-level, forbidden on replies (see check below) |
| `body` | `text null` | nullable on top-level only (rating-only review is valid); required on replies |
| `created_at` | `timestamptz not null default now()` | |
| `updated_at` | `timestamptz not null default now()` | set explicitly on edit, matching `updateRecipe`'s convention |

Constraints:

```sql
-- rating is mandatory on a review, forbidden on a reply
check ((parent_id is null and rating is not null) or (parent_id is not null and rating is null))

-- a reply must have text
check (parent_id is null or body is not null)

-- one review per user per recipe (partial unique index, not a table constraint,
-- because it only applies to top-level rows)
create unique index recipe_comments_one_review_per_user
    on recipe_comments (recipe_id, user_id)
    where parent_id is null;

create index recipe_comments_recipe_id_idx on recipe_comments (recipe_id);
create index recipe_comments_parent_id_idx on recipe_comments (parent_id);
```

`ON CONFLICT` upserts against a **partial** unique index need the constraint referenced by name (or an equivalent `where` clause) rather than just column names — flagging this now so it isn't a surprise when writing `upsertReview()`; supabase-js's `.upsert(..., { onConflict: '...' })` takes a constraint/column-list string, so this needs verifying against the installed `@supabase/supabase-js` version, with a raw `insert ... on conflict ... do update` via an RPC as the fallback if the JS client can't target a partial index directly.

### `recipe_comment_likes`

| Column | Type | Notes |
|---|---|---|
| `comment_id` | `uuid not null references recipe_comments(id) on delete cascade` | |
| `user_id` | `uuid not null references auth.users(id) on delete cascade` | |
| `created_at` | `timestamptz not null default now()` | |

Primary key `(comment_id, user_id)` — mirrors `recipe_favorites` exactly (composite PK doubles as the "did I already like this" uniqueness check). Index on `comment_id` for fast like-count aggregation.

### RLS

Following the two patterns CLAUDE.md already documents ("public read, owner-scoped write" and "fully owner-scoped"), `recipe_comments` is a new third shape — public read, author-or-recipe-owner write — but built entirely from the existing `owns_recipe()` helper:

```sql
alter table public.recipe_comments enable row level security;

create policy "Comments are viewable by anyone"
    on public.recipe_comments for select
    to anon, authenticated
    using (true);

create policy "Users can post their own comments"
    on public.recipe_comments for insert
    to authenticated
    with check (
        user_id = auth.uid()
        -- top-level review: can't review your own recipe
        and (parent_id is not null or not owns_recipe(recipe_id))
        -- reply: parent must exist on the same recipe
        and (parent_id is null or exists (
            select 1 from recipe_comments p
            where p.id = parent_id and p.recipe_id = recipe_comments.recipe_id
        ))
    );

create policy "Users can edit their own comments"
    on public.recipe_comments for update
    to authenticated
    using (user_id = auth.uid())
    with check (user_id = auth.uid());

create policy "Authors and recipe owners can delete comments"
    on public.recipe_comments for delete
    to authenticated
    using (user_id = auth.uid() or owns_recipe(recipe_id));
```

```sql
alter table public.recipe_comment_likes enable row level security;

create policy "Likes are viewable by anyone"
    on public.recipe_comment_likes for select
    to anon, authenticated
    using (true);

create policy "Users can like as themselves"
    on public.recipe_comment_likes for insert
    to authenticated
    with check (user_id = auth.uid());

create policy "Users can unlike as themselves"
    on public.recipe_comment_likes for delete
    to authenticated
    using (user_id = auth.uid());
```

Note the self-review block is enforced in the INSERT policy's `with check`, not a trigger — consistent with how the rest of the schema does ownership checks, and it fails closed (a self-review INSERT is simply rejected by Postgres, no app-level trust required). The app should still disable/hide the rating control for the recipe's own owner so they never see a confusing RLS error.

### Average rating — recommended for a later phase, not day one

You didn't ask for a star badge on recipe cards/lists, only for rating recipes on the detail page — so scope that separately (Phase 2 below) rather than bundling it in. When it's built, don't denormalize an `average_rating` column onto `recipes` (the codebase deliberately moved *away* from that shape — `is_favorite` used to be a column on `recipes` and was dropped in favor of a separate table once favorites needed to be per-user; a rating average has the same "derived, must stay in sync" problem). Instead add a small view:

```sql
create view recipe_rating_summary
with (security_invoker = true) as
select recipe_id, round(avg(rating), 2) as average_rating, count(*) as rating_count
from recipe_comments
where parent_id is null and rating is not null
group by recipe_id;
```

`security_invoker = true` (Postgres 15+, which Supabase runs) makes the view honor the querying user's own RLS instead of the view creator's — matters less here since the underlying table is public-read anyway, but it's the correct default so a future stricter policy on `recipe_comments` doesn't silently leak through an old view. Query it with `.in('recipe_id', ids)` the same way `getProfilesByIds` batches.

## 4. New application files

```
src/types/comment.ts               Comment type (+ replies: Comment[], likeCount, likedByMe, author)
src/api/comments.ts                getRecipeComments, getMyReview, upsertReview, deleteComment,
                                    addReply, updateComment, toggleCommentLike
src/hooks/useComments.ts           useRecipeComments, useMyReview, useUpsertReview, useDeleteComment,
                                    useAddReply, useUpdateComment, useToggleCommentLike
src/lib/commentTree.ts             buildCommentTree(flatRows) — pure function + test,
                                    same shape as lib/sections.ts's groupBySection
src/lib/relativeTime.ts            extended with minute/hour granularity (see §6) — existing file, not new
src/components/ui/Avatar.tsx       small reusable image-or-initials avatar (new, generically useful)
src/features/recipes/components/RatingStars.tsx          dual-mode: interactive (click to set) or
                                                           read-only (display average or someone's rating)
src/features/recipes/components/RecipeRatingSummary.tsx  average stars + "4.3 · 128 ratings", shown
                                                           near the title next to FavoriteStar
src/features/recipes/components/CommentComposer.tsx      Play-Store-style: stars first, then optional
                                                           textarea unlocks; prefills + relabels to
                                                           "Update your review" if you already reviewed
src/features/recipes/components/CommentCard.tsx           renders one comment; recursively renders
                                                           .replies for nested threads
src/features/recipes/components/CommentsSection.tsx       top-level container: summary + composer +
                                                           list, composed into RecipeDetailClient
```

Modified:

```
src/app/(authenticated)/recipes/[id]/RecipeDetailClient.tsx
    - <RecipeRatingSummary recipeId={recipe.id} /> next to the title, alongside FavoriteStar
    - <CommentsSection recipeId={recipe.id} isOwner={isOwner} /> below the Instructions block
CLAUDE.md
    - add recipe_comments / recipe_comment_likes to the data-model table once shipped
```

No changes needed to `middleware.ts` (page is already public) or to the `recipes`/`ingredients`/`steps` RLS (untouched).

## 5. UI/UX detail

**Composer** (`CommentComposer`, shown to everyone including guests):

1. Five stars are always visible and clickable, sized larger than the read-only display stars. Label above them: "Rate this recipe" (swap to "Your rating" once one is set).
2. Clicking a star as a guest calls `requireAuth(...)` → opens `AuthGateModal` with a message like "Sign in to rate this recipe." — nothing is submitted, exactly like `FavoriteStar`.
3. Once a rating is chosen (or the user already has one), a `Textarea` for the written review appears/enables, plus a "Post" button. The button stays disabled until a rating exists — this *is* the "must set a rating before writing a comment" rule; it's a UI/query-enablement rule, not something that needs its own DB constraint (the DB constraint already guarantees it server-side regardless).
4. If `useMyReview(recipeId)` returns an existing row, prefill the stars/text and change the button label to "Update your review". Submitting always upserts (edits your one row) rather than creating a second review.
5. If `isOwner` (current user owns this recipe), the composer doesn't render at all — replaced by nothing or a small note; there's no scenario where they can act on it anyway (RLS would reject it), so hiding it is a UX kindness, not a security measure.

**List** (`CommentsSection` → `CommentCard`, recursive for replies):

- Sort newest-first by default (`created_at desc` on top-level rows; replies always ordered oldest-first under their parent so a conversation reads top-to-bottom). A "most liked" sort is an easy Phase 2 addition (order by `recipe_comment_likes` count) — skip for v1.
- Each card: `Avatar` (signed URL via `useAvatarUrl`, linking to `/profile/[id]`), display name, timestamp (see §6), star row (top-level only — replies render no stars), body text, a like button (heart or thumbs-up + count, same optimistic-toggle shape as `useSetRecipeFavorite`), a "Reply" link that reveals an inline `Textarea` + "Post reply" button (also gated by `requireAuth`).
- Replies render indented under their parent, each capable of having its own "Reply" link — since nesting is unlimited, cap the *visual* indent (e.g. stop increasing left-margin past 3–4 levels even though the data can go deeper) so a long thread doesn't run off the right edge on mobile. This is purely a rendering clamp in `CommentCard`, not a data restriction.
- Edit/Delete: reuse the existing `ActionMenu` component (already used for recipe owner actions). Shown when `comment.user_id === currentProfile.id` (edit + delete) or, for delete only, when `isOwner` of the recipe (moderation) even if you didn't write the comment.
- Guests see everything above except the interactive affordances behave as sign-in prompts on click (like/reply/edit/delete all route through `requireAuth`, matching the composer).
- Fetch all comments for a recipe in one flat query, build the tree client-side with `buildCommentTree`, no pagination for v1 — a personal recipe app's comment volume per recipe won't be large enough to justify pagination machinery up front; revisit only if a recipe genuinely accumulates hundreds of comments.

## 6. Timestamp handling

`formatRelativeTime` (day-granularity) stays as-is for recipe cards. Comments need finer resolution, so add a sibling function rather than changing the existing one's behavior elsewhere in the app:

```ts
// src/lib/relativeTime.ts (add alongside the existing export)
export function formatCommentTime(isoDate: string): string {
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMinutes = Math.floor(diffMs / 60000);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 60 * 24) return `${Math.floor(diffMinutes / 60)}h ago`;

    return formatRelativeTime(isoDate); // falls back to the existing Today/Yesterday/N days/date logic
}
```

Render it with a `title` attribute holding the full absolute date+time (`date.toLocaleString(...)`) so hovering gives exact precision without cluttering the card. Covers "date time" from your requirements without inventing a second, inconsistent time-formatting convention in the codebase.

## 7. Suggested build order

1. Migrations: `recipe_comments` + `recipe_comment_likes` tables, RLS, indexes. Apply and verify against the live project with `list_tables`/`execute_sql` the way this investigation did, per [[project_recipe_manager_status.md]]'s standing rule — don't trust the migration file alone once applied.
2. `src/types/comment.ts`, `src/lib/commentTree.ts` (+ test).
3. `src/api/comments.ts` + `src/hooks/useComments.ts`.
4. `components/ui/Avatar.tsx`, extend `relativeTime.ts`.
5. `RatingStars.tsx` → `CommentComposer.tsx` → `CommentCard.tsx` → `CommentsSection.tsx` → `RecipeRatingSummary.tsx`.
6. Wire both into `RecipeDetailClient.tsx`.
7. `npm run lint`, `tsc --noEmit`, `vitest run` — per CLAUDE.md, required before considering this done. If `device_bash` on this machine is unavailable when implementation happens (it has been down across several recent sessions per [[project_recipe_manager_status.md]]), fall back to a throwaway `npm ci` in the cloud sandbox, the approach that already verified the Sections and Shopping List features cleanly.
8. Update CLAUDE.md's data-model table.

**Phase 2 (not in this plan's core scope, listed for awareness):** `recipe_rating_summary` view + surfacing average-rating badges on `RecipeCard`/`RecipeListRow` in list/grid views; "most liked" sort; an `activity_log` entry type for new reviews (`'recipe_reviewed'`, mirroring the existing `log_recipe_favorited` trigger) so reviews show up in the existing activity feed.

## 8. Things worth double-checking before/while building

- Confirm the installed `@supabase/supabase-js` version's `.upsert()` can target the partial unique index for `upsertReview()`; if not, use a raw `on conflict ... do update` via a Postgres function called through `.rpc()`.
- Decide the exact copy for the 1–5 star meaning ("Best restaurant quality" / "Garbage") — a label or tooltip under the stars, not stored in the DB (it's just UI copy, applies to every recipe identically).
- The recursive nested-reply UI is the one place complexity could balloon — worth a quick look at how deep real threads actually get in practice once this ships, since "unlimited" is a data-model choice, not a promise the UI has to render 20 levels beautifully on a phone.
