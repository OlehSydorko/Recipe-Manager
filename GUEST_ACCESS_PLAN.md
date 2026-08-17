# Guest Access — Implementation Plan

Status: planning only, no code changed. Grounded in the actual repo state as of 2026-08-14 (verified via `src/middleware.ts`, `supabase/migrations/`, `src/api/`, `src/components/layout/`), not CLAUDE.md's "Project Status" section, which is stale (confirmed against 14 migrations already applied, including two from 2026-08-13 that already opened recipe read access to `authenticated` users).

## Current state (why this isn't a greenfield feature)

A few things about the existing implementation change the shape of this work and are worth stating up front:

- **Auth is enforced in one place: `src/middleware.ts`.** It redirects any unauthenticated request to `/login` unless the path is exactly `/login` or `/signup`. There is no per-route allow-list today — it's binary. The `(authenticated)` route group name is a leftover from that binary model; it isn't itself an auth boundary, `middleware.ts` is.
- **Recipes are already "public-ish," but only to logged-in users.** Migrations from 2026-08-13 (`public_recipe_read_access`, `public_recipe_images_and_collection_saves`, `add_recipe_favorites_table`) already changed `recipes`, `categories`, `ingredients`, `steps`, and the `recipe-images` bucket from owner-only SELECT to `to authenticated using (true)`. Favoriting was already split into a per-user `recipe_favorites` table for this reason. So the "any signed-in user can view any recipe" half of the CLAUDE.md security model is done. What's missing for guest access is narrower than it looks: change `to authenticated` to also cover the `anon` Postgres role (what PostgREST uses when a request carries no session) on those same policies, plus the storage/profile/avatar policies below.
- **Collections have no public/private concept at all.** `collections` and `collection_recipes` are fully owner-scoped (`user_id = auth.uid()` on every operation). "Public Collections" in this plan is a net-new column + policy set, not a gating change.
- **`profiles` and the `avatars` bucket are already public-read to `authenticated` users** (`add_profile_fields`, `add_avatars_storage` migrations) — same pattern as recipes: needs the `anon` role added, not new policies.
- **`follows` SELECT is scoped to the two parties in the relationship** (`follower_id = auth.uid() or followed_id = auth.uid()`), not open. This means follower/following counts on *someone else's* profile are already under-counting today for any viewer who isn't one of the two people in each row — this is a pre-existing bug, not something guest access introduces, but it blocks "Followers count" from working correctly for guests *or* logged-in third parties until fixed.
- **Comments, difficulty, cooking time, and nutrition are explicitly out of scope for this effort.** They don't exist in the schema today (`recipes` currently has `title`, `description`, `instructions`, `portions`, `category_id`, `image_url`, and there's no `comments` table), and per direction they should not be added as part of guest access — this plan treats "Comment" as removed from the protected-actions list and the three recipe fields as removed from the recipe-detail surface. They remain net-new features for a separate effort, not something this plan builds.
- **"Discover" is already a nav label, but it points at `/people`** (creator/people search), not recipe discovery. The request's public-page list treats "Recipes" and "Discover" as distinct browsing surfaces. This needs a product decision before Phase 1 routing is final — see Open Questions.

## Open questions (need answers before Phase 1 can be scoped precisely)

1. **What is "Discover"?** Repurpose the existing `/people` page (creator search) as the public Discover page, or build a new recipe-discovery page (trending/filtered recipes) and rename `/people` to something else in the nav? This changes which route is public and what it contains.
2. **"Collections" nav item for guests** — does it show public collections from *all* users (a community collections feed, which doesn't exist yet either), or is it hidden entirely for guests until they sign in? The request says guests can "browse public collections" but the current `/collections` page is "my collections only."
3. **Own-profile route (`/profile`)** — stays fully auth-gated (it's edit-oriented), correct? Assumed yes throughout this plan.

**Resolved:** comments and nutrition/difficulty/cooking-time are out of scope for this effort (confirmed) — removed from every phase below. Recipe detail pages ship with what already exists: ingredients, instructions, portions, image, author, category. Protected-actions list drops "Comment."

---

## Phase 1 — Routing & Authentication

**Objective:** Replace the binary "everything requires auth" middleware with a route-level public/protected split, without breaking the existing session-refresh logic middleware also performs.

**Tasks:**
- Replace the `publicPaths` allow-list in `src/middleware.ts` with a `protectedPaths` list (or matcher) covering: `/recipes/new`, `/recipes/[id]/edit`, `/profile` (own profile), `/collections/new`, `/collections/[id]/edit`, and any people-search page that stays gated per Open Question 1. Everything not in that list — `/`, `/recipes`, `/recipes/[id]`, `/profile/[id]`, `/collections/[id]` (when public), and the Discover route — becomes reachable without a session.
- Keep the existing "logged-in user hitting `/login`/`/signup` gets redirected to `/`" behavior unchanged.
- Split the `(authenticated)` route group. Recommended: keep one route group for the shared chrome (`Nav`, `Sidebar`, `MobileTabBar` already render fine for both states) but stop relying on the group name/middleware pairing implying "this is all gated" — rename to `(app)` or similar so it's not misleading, and do resource-level checks (see Phase 2) for anything that must differ by owner even on a nominally public page (e.g., a private collection at `/collections/[id]`).
- Add a small `useRequireAuth()` (or equivalent) client helper that components call before firing a protected action (favorite, follow, save, comment, create) — opens the auth-gate modal (Phase 3) instead of relying on the page itself being gated, since these actions now live on public pages.
- Server-side: for pages that must 404/redirect differently depending on both auth state *and* resource ownership (e.g. a private collection someone guesses the URL for), add the check in the page/server component itself, not middleware — middleware can't know if a specific collection is public without a DB round-trip per request, which isn't worth it at the edge.

**Files/components likely affected:**
- `src/middleware.ts` (core logic change)
- `src/app/(authenticated)/**` — likely renamed/reorganized route group
- Any page component that currently assumes `useCurrentProfile()`/`auth.getUser()` always returns a user (several `api/*.ts` functions throw `'Not authenticated'` today — these become legitimate guest states, not error states, on pages that stay mounted for guests)

**Risks:**
- `getRecipes()`, `getCollections()`, `getCommunityRecipes()`, etc. currently call `supabase.auth.getUser()` and `throw` if there's no session. Once their pages are reachable by guests, these throws will surface as broken pages, not gentle empty states — every data-fetching function reachable from a public page needs an explicit guest path (Phase 2 covers which ones, Phase 3 covers the UI for it).
- Middleware matcher regex is already fairly involved (`config.matcher` excludes static assets); adding path-based branching increases the chance of an unintended path falling on the wrong side. Needs explicit test coverage per route, not just spot-checks.
- Renaming the route group is a structural change that touches every file's relative position — do this in its own commit, separate from behavior changes, to keep diffs reviewable.

**Testing checklist:**
- [ ] Each newly-public route loads with no session (no cookies) and does not redirect.
- [ ] Each still-protected route redirects a signed-out request to `/login`.
- [ ] A signed-in user hitting `/login` or `/signup` still redirects to `/`.
- [ ] Guest hitting a protected action on a public page sees the auth gate, not a thrown error or console exception.
- [ ] `npm run build` succeeds (route group rename can silently break `next build` if a route collides).

---

## Phase 2 — Backend & Database

**Objective:** Extend RLS so the `anon` Postgres role can read what guests are allowed to see, add the schema needed for collection visibility (and comments/nutrition if in scope per Open Question 2), and fix the follows-visibility gap.

**Tasks:**
- **Extend existing public-read policies to `anon`.** For `recipes`, `categories`, `ingredients`, `steps`, `profiles` (table policies), and the `recipe-images`/`avatars` storage SELECT policies: either drop the `to authenticated` role restriction (defaults to `public`, i.e. both `anon` and `authenticated`) or add a parallel `to anon` policy. This is a small, mechanical migration — no new tables.
- **Fix `follows` SELECT** so follower/following counts are correct for any viewer, not just the two parties: change the policy to `using (true)` for SELECT (the relationship itself isn't sensitive — Instagram-style public counts are the explicit goal here). Insert/delete stay owner-scoped, unchanged.
- **Add `collections.is_public boolean not null default false`.** Add a SELECT policy on `collections` for `is_public = true` (any role), keep the existing owner-only policy for the owner's own private collections. Mirror the same visibility on `collection_recipes` SELECT (a row is visible if its parent collection is public OR owned by the viewer) — this needs a rewritten policy, not just role changes, since it currently checks ownership via a subquery.
- **Cover images / recipe images inside public collections**: already covered by the `recipe-images` bucket policy change above, since collection covers resolve through `recipes.image_url`.
- No `comments` table and no `difficulty`/`cooking_time`/`nutrition` columns — explicitly excluded from this migration set. If they land later, they follow the same public-read pattern already established for the rest of `recipes`, but that's a separate effort.
- Regenerate Supabase TypeScript types (`supabase gen types typescript`) after schema changes and update `src/types/recipe.ts`, `src/types/collection.ts` accordingly.
- Run Supabase advisors (`get_advisors`) after applying the migrations to catch any RLS gaps the manual review misses, especially around the reworked `collection_recipes` policy.

**Files/components likely affected:**
- New file(s) under `supabase/migrations/` (one migration per logical change, matching the existing convention of small, single-purpose files with an explanatory comment header)
- `src/types/collection.ts`, `src/types/recipe.ts`, possibly a new `src/types/comment.ts`
- `src/api/collections.ts` (`getCollections()` needs a public-vs-mine split, mirroring the `getRecipes()`/`getCommunityRecipes()` pattern already established for recipes)
- `src/api/recipes.ts`, `src/api/follows.ts` (no signature changes needed for the role-only fixes, but the `'Not authenticated'` throws in read paths need to become guest-safe — e.g. `getRecipe(id)` currently calls `isRecipeFavorited(id)` unconditionally; that needs to short-circuit to `false` for guests instead of erroring)

**Risks:**
- `to authenticated using (true)` → dropping the role restriction is easy to get wrong in the opposite direction (accidentally exposing write policies to `anon` too) — audit that only SELECT policies are touched, INSERT/UPDATE/DELETE stay `to authenticated` or owner-scoped everywhere.
- The `collection_recipes` visibility rewrite is the trickiest RLS change in this plan (visibility depends on a join to `collections`, not a column on the row itself) — worth a dedicated review/test pass, ideally with the Supabase advisor tool plus manual policy testing via `execute_sql` as different roles.
- Any API function that assumes `auth.getUser()` succeeds will need auditing project-wide — this is the same list as the Phase 1 risk, but from the data layer's side.

**Testing checklist:**
- [ ] `get_advisors` (security) run clean after all migrations.
- [ ] Manual RLS check as `anon` (no JWT) via SQL editor or `execute_sql` for each newly-public table: SELECT succeeds, INSERT/UPDATE/DELETE fail.
- [ ] Private collection is invisible to `anon` and to a different authenticated user; visible to its owner.
- [ ] Follower/following counts on another user's profile match reality when viewed by a guest and by an unrelated logged-in user.
- [ ] Regenerated types compile with no `any` introduced (project rule: no explicit `any`).

---

## Phase 3 — UI & Components

**Objective:** Make the existing chrome and action components behave correctly for a signed-out visitor: swap nav items, and intercept protected actions with a soft gate instead of letting them fail or relying on a redirect that no longer happens (since the pages are no longer gated).

**Tasks:**
- **`src/components/layout/Sidebar.tsx`**: reorder/relabel to Home, Recipes, Discover, Collections per the spec (currently Home, Recipes, Collections, Discover→`/people`) — pending Open Question 1 on what Discover actually points to. Add conditional rendering: guests don't need a visual change here since these are all public routes.
- **`src/components/layout/Nav.tsx`**: currently only renders a "Profile" link. Add a guest branch: show a "Sign In" link/button instead of the profile avatar link when there's no session.
- **`src/components/layout/MobileTabBar.tsx`**: same swap — "Profile" tab becomes "Sign In" for guests.
- **Auth gate modal**: new component, built on the existing generic `src/components/ui/Modal.tsx` (already used by `CollectionModal`, `EditProfileModal`, `FollowListModal` — consistent pattern to extend rather than building a new modal primitive). Content: short message + Sign In / Sign Up buttons, likely carrying a `redirectTo` so the user lands back where they were after auth.
- **Wire the gate into every protected action component**: `FavoriteStar`, `FollowButton`, `SaveToCollectionButton`, recipe/collection create buttons. Each needs a guest check before calling its mutation — cleanest as the `useRequireAuth()` hook from Phase 1 wrapping the `onClick`/`onSubmit` handler, so the gating logic lives in one place instead of being reimplemented per component.
- **Guest-safe data hooks**: hooks in `src/hooks/` that assume a logged-in user (`useCurrentProfile`, favorite/follow status hooks) need to resolve to "not favorited / not following / no profile" for guests rather than erroring, since their pages now render without a session.
- Disabled-state styling isn't the intended pattern here per the request ("instead of blocking pages... these actions should trigger a soft authentication gate") — so buttons stay visually active for guests and open the modal on click, rather than being greyed out. Worth confirming this matches intent, since a disabled+tooltip pattern is also common for this UX and is a smaller change.

**Files/components likely affected:**
- `src/components/layout/Nav.tsx`, `Sidebar.tsx`, `MobileTabBar.tsx`
- New: `src/components/auth/AuthGateModal.tsx` (or similar), a `useRequireAuth` hook
- `src/features/recipes/components/FavoriteStar.tsx`, `SaveToCollectionButton.tsx`
- `src/features/social/components/FollowButton.tsx`
- `src/features/collections/CollectionModal.tsx` (create/edit entry points)
- `src/hooks/useProfile.ts`, `useFollows.ts`, `useCollections.ts`, `useRecipes.ts` (favorite-status branches)

**Risks:**
- Scattering "is this a guest?" checks across many components risks inconsistent UX (some actions gated, some silently failing) if the `useRequireAuth` hook isn't adopted everywhere consistently — worth a checklist pass across every action listed in the request's "Authentication Required" section before calling this phase done.
- `FavoriteStar`/`SaveToCollectionButton` etc. currently assume a resolved favorite/save state fetched per-recipe; for guests this data fetch can be skipped entirely (always "not favorited") rather than attempted and failing, which also avoids unnecessary requests.

**Testing checklist:**
- [ ] Every action in the request's "Authentication Required" list opens the gate for a guest and does not mutate anything.
- [ ] Gate modal's Sign In/Sign Up buttons preserve the current page so the user returns after auth.
- [ ] Nav/Sidebar/MobileTabBar render correctly in both guest and logged-in states, including the active-route highlight logic.
- [ ] No console errors from hooks that used to assume a session.

---

## Phase 4 — Public Profile System

**Objective:** Make `/profile/[id]` and public collections fully guest-viewable, with Follow gated.

**Tasks:**
- Confirm `/profile/[id]` (already exists and already shows avatar, tagline, location, bio, follower/following counts, and the user's recipes) works end-to-end for a guest once Phase 2's RLS/role changes land — this page likely needs little UI change, mostly depends on the data layer no longer requiring a session.
- Gate the existing `FollowButton` via `useRequireAuth()` (Phase 3) rather than building new gating logic specific to profiles.
- Build the public collections surface: a section on the profile page (or a tab, matching the existing `ProfileTabs` pattern) showing that user's `is_public = true` collections, using the Phase 2 `getCollections()` split.
- Decide and implement the community-wide "Public Collections" browsing surface per Open Question 3 (all-users feed vs. per-profile only) — this is the one piece of the request that has no existing page to extend.

**Files/components likely affected:**
- `src/app/(authenticated)/profile/[id]/page.tsx` (rename/relocate per Phase 1's route-group split)
- `src/features/profile/components/ProfileTabs.tsx`, `ProfileHeader.tsx`, `ProfileStats.tsx`
- `src/features/social/components/FollowButton.tsx`
- Possibly a new route for the community collections feed if Open Question 3 resolves that way

**Risks:**
- This phase is mostly downstream of Phase 2 being correct — if the follows/collections RLS work is incomplete, bugs here will look like UI bugs but actually be data-layer gaps.

**Testing checklist:**
- [ ] Guest can view any user's public profile, recipes, public collections, and follower/following counts.
- [ ] Guest cannot see a user's private collections via profile or direct URL.
- [ ] Follow button gates correctly for guests, works normally for logged-in users.

---

## Phase 5 — Polish

**Objective:** Empty states, SEO for public recipe pages, performance, analytics — the parts that matter once the core guest experience works but aren't required for it to function.

**Tasks:**
- Empty states for: guest viewing a user with no public recipes/collections, guest viewing an empty Discover/search result, empty community collections feed.
- SEO: recipe detail pages are the one place SSR/metadata investment pays off now that they're genuinely public (CLAUDE.md notes the app currently gets "no real benefit from SSR/SEO" since everything was gated — that changes for `/recipes/[id]` and `/profile/[id]` specifically). Add `generateMetadata` for title/description/OG image per recipe; consider `robots.txt`/sitemap for public routes only.
- Performance: guest traffic has no session, so React Query's per-user cache keys need review — public data (recipe lists, recipe detail) should cache independently of auth state so a guest browsing doesn't refetch everything the moment they sign in.
- Analytics: guest→signup conversion funnel (which gated action triggered the auth modal, whether they completed sign-up afterward) — depends on whatever analytics tooling gets chosen; out of scope to design without knowing that.

**Files/components likely affected:**
- `src/app/(authenticated)/recipes/[id]/page.tsx`, `profile/[id]/page.tsx` (metadata)
- React Query key structures in `src/hooks/*`
- New `robots.txt`/`sitemap.ts` if pursued

**Risks:**
- SEO work implies these pages should arguably become Server Components (or at least SSR the initial data) rather than the current client-fetched pattern — that's a bigger architectural shift than this phase's scope suggests; worth scoping as its own decision rather than bundling into "polish."

**Testing checklist:**
- [ ] Empty states render for each guest-facing empty scenario.
- [ ] Recipe detail pages have correct `<title>`/meta description per recipe.
- [ ] React Query cache doesn't leak "my" data into a subsequent guest session on a shared device, and doesn't stale-serve guest data after sign-in.

---

## Recommended implementation order

1. Phase 1 (routing) and Phase 2 (RLS/DB) together, in lockstep — Phase 1's public routes are unsafe to ship without Phase 2's RLS changes (a public page calling an API that still 403s isn't shippable), and Phase 2's RLS changes are inert without Phase 1 making the routes reachable.
2. Phase 3 (UI/gating) once 1+2 are in — this is what makes the guest experience actually usable rather than just theoretically reachable.
3. Phase 4 (public profiles) — mostly validates and extends what 1–3 built; the one new surface (community collections feed) can slot in here or slip to a later pass depending on Open Question 3.
4. Phase 5 (polish) last, and can be spread out post-launch.

## What can be developed independently

- The `follows` SELECT fix (Phase 2) is fully independent — it's a bug fix that's correct regardless of guest access and can ship on its own.
- Nav/Sidebar/MobileTabBar relabeling (Phase 3) can be built and merged before the RLS work lands, behind the existing auth check, with no user-facing effect until Phase 1/2 ship.
- SEO metadata (Phase 5) can be written in parallel with Phase 3/4 once the target pages are stable.

## Breaking vs. non-breaking

**Non-breaking:**
- All RLS role additions (`anon` alongside `authenticated`) — purely additive for SELECT, no existing authenticated behavior changes.
- New `is_public` column (defaults `false`, so all existing collections stay private until a user opts in).
- New nav items, new modal, new hooks.

**Breaking / needs careful sequencing:**
- Middleware rewrite — a bug here either leaks a protected page or locks out a page that should be public; needs the full route-by-route testing checklist from Phase 1, not spot checks.
- Any `api/*.ts` function that currently `throw`s on no session and is called from a page that becomes public — this is a behavior change from "page redirects before this code ever runs" to "this code runs with `user === null`" and needs to be audited function-by-function, not assumed safe.
- `collection_recipes` SELECT policy rewrite — replaces the existing ownership-subquery policy; a mistake here either hides a user's own collections from them or exposes private ones.

## Rough complexity estimate

| Phase | Complexity | Why |
|---|---|---|
| 1 — Routing & Auth | Medium | Conceptually simple (allow-list vs. deny-list flip) but every route needs individual verification, and the route-group rename touches many files |
| 2 — Backend & DB | Medium | Role-only changes are easy; the `collection_recipes` visibility rewrite is the one genuinely hard part now that comments/nutrition are excluded |
| 3 — UI & Components | Medium | Mechanical once the `useRequireAuth` pattern exists, but touches many components and needs consistency across all of them |
| 4 — Public Profile System | Easy–Medium | Mostly validates existing pages against the new data layer; the community collections feed (if built) is the one genuinely new surface |
| 5 — Polish | Medium | SEO done properly implies an SSR conversation bigger than "polish" suggests; empty states/analytics are straightforward |

Overall: with comments and nutrition/difficulty/cooking-time excluded, this is a more contained project than the original request implied — mostly RLS role changes, a middleware rewrite, and consistent gating on existing action components. The collections visibility model (`is_public` + policy rewrite) is the one piece of real net-new schema left in scope.
