# CLAUDE.md

This file provides guidance to Claude when working with code in this repository.

## Project

Recipe Manager — a personal, private recipe vault. Users write down their own recipes so they don't lose them, organize them into categories, and follow an interactive ingredient checklist while cooking. Every recipe is private to its owner by default; family sharing (explicit, account-based, not public links) is a planned future feature, not yet built.

## Commands

```bash
npm run dev       # Start dev server (Turbopack) at http://localhost:3000
npm run build     # Production build
npm run start     # Run the production build locally
npm run lint      # ESLint (legacy .eslintrc, ESLint 8)
npm run lint:fix  # ESLint with --fix
npm run format    # Prettier --write across the project
```

## Local Environment Setup

Create a `.env.local` file in the root (values come from your Supabase project settings):

```
NEXT_PUBLIC_SUPABASE_URL=<your Supabase project URL>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your Supabase anon/public key>
```

The anon key is safe to expose client-side by design — real security comes from Postgres Row Level Security (RLS) policies, not from hiding this key. Never put the `service_role` key in this file or in any client code.

## Tech Stack & Why

- **Next.js (App Router, TypeScript, Turbopack)** — chosen for framework/learning value. Note: every page is behind auth, so this project gets no real benefit from SSR/SEO — Next.js's App Router/Client Component split is the main added complexity vs. a plain SPA, worth remembering when something feels unnecessarily fiddly.
- **Supabase** — Postgres database, Auth, and Storage, no custom backend server. Chosen over Firebase because the data is relational (recipe → ingredients → steps → category), and over a hand-rolled Express backend because there's no logic here that Supabase's auto-generated API + RLS can't handle.
- **Tailwind CSS**
- **TanStack Query** — all Supabase data fetching goes through this for caching/loading/error state, not raw `useState`/`useEffect`.

## Architecture

### Auth

Uses `@supabase/ssr` (not plain `supabase-js`) because Next.js renders both server and client — the session needs to be readable in both. A `middleware.ts` keeps the session cookie in sync. On signup, a Postgres trigger creates the user's `profiles` row and seeds their 6 default categories — this lives in the database, not in frontend code, so it can't be bypassed.

### Security model

Every table has Row Level Security (RLS) enabled, default-deny. Policies key off `auth.uid()` — e.g. `recipes`: a user can only SELECT/INSERT/UPDATE/DELETE rows where `user_id = auth.uid()`. This is enforced by Postgres itself, not by frontend checks, so it holds even against direct API calls.

### Folder structure

```
src/
  app/            # Next.js App Router routes
  api/            # Supabase data-access functions, one file per entity (recipes.ts, categories.ts...)
                   # Components never call supabase.from(...) directly — always through this layer
  components/     # Reusable, presentational UI pieces
  features/       # Feature-scoped logic (recipes/, auth/, categories/)
  hooks/          # Custom hooks, mostly TanStack Query wrappers (useRecipes, useCategories)
  lib/            # supabaseClient.ts (browser) and supabaseServerClient.ts (server), single instances
  types/          # Supabase-generated types (via `supabase gen types typescript`) + app types
```

### Data model

| Table         | Key columns                                                                     | Notes                                                                  |
| ------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| `profiles`    | id (= auth.users.id), display_name, avatar_url                                  | One per user                                                           |
| `categories`  | id, user_id, name                                                               | Seeded with 6 defaults on signup; user can add more                    |
| `recipes`     | id, user_id, category_id, title, description, image_url, created_at, updated_at |                                                                        |
| `ingredients` | id, recipe_id, name, quantity (text), sort_order                                | No `checked` column — checklist state is client-only, resets on reload |
| `steps`       | id, recipe_id, instruction, sort_order                                          |                                                                        |

Future (not built): `recipe_shares (recipe_id, shared_with_user_id)` for family sharing — additive, no changes needed to existing tables.

### Image storage

Supabase Storage bucket `recipe-images`, paths scoped as `{user_id}/{recipe_id}/{filename}`. Bucket policies mirror the DB RLS pattern.

## Code Style

Enforced by the project's ESLint/Prettier config (ported from the team's work setup — see `.eslintrc` and `.prettierrc`). Before writing or modifying any code, enforce these on every file you touch:

- Newline at end of file
- Single quotes only
- No explicit `any`
- Use TS types over interfaces
- External imports first, then local imports (auto-sorted by `@trivago/prettier-plugin-sort-imports`)
- Constants in SCREAMING_SNAKE_CASE, components in PascalCase, everything else camelCase
- Event handlers named `handle*`, props named `on*`
- No inline styles — use Tailwind classes
- No unused imports, props, or type keys

Run `npm run lint` before considering any change done.

### Limit code changes to a minimum

Only touch code directly required by the task. Don't refactor, rename, reformat, or "improve" unrelated code, even if it looks wrong — flag it instead of fixing it inline. Prefer the smallest diff that correctly solves the task.

## Project Status

Built incrementally, mentor-style, one sprint at a time — see conversation history for the full roadmap. Sprint 1 (project setup, tooling) is complete. Sprint 2 (Supabase project, database schema, RLS policies, auth) is next.
