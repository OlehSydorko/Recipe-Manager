# Google Sign-In — Implementation Plan

**Status:** planning only, nothing implemented yet
**Written:** 2026-09-09

## Approach

Use Supabase Auth's built-in Google OAuth provider, not a hand-rolled Google Identity SDK integration. The app already uses `@supabase/ssr` for email/password auth (`src/api/auth.ts`, `src/lib/supabaseClient.ts` / `supabaseServerClient.ts`, `src/middleware.ts`), and Supabase's OAuth support plugs into that same session/cookie machinery with no new client-side auth library. This is the smallest-diff option and keeps one auth system instead of two.

Confirmed against the live Supabase project (`bkpnrqtqmewcqyktyzlh`, not just the migration files, since those are known to drift from the live schema):

- Session handling is PKCE-based via `@supabase/ssr` (`createBrowserClient` / `createServerClient`), which is what the OAuth code-exchange step below relies on.
- `auth.users` has an `AFTER INSERT` trigger `on_auth_user_created` → `handle_new_user()`, which creates the `profiles` row and seeds the 6 default categories. **This function currently only reads `raw_user_meta_data->>'display_name'`**, a key that only exists for email/password sign-ups. Google sign-ins populate `full_name`/`name`/`avatar_url`/`picture` instead, not `display_name` — so a Google sign-up today would create a profile with a `null` name unless the trigger is updated (Part B below is not optional).

## Part A — Google Cloud Console + Supabase Dashboard (no code, do this first)

1. **Google Cloud Console** (console.cloud.google.com), in a project you control:
   - APIs & Services → OAuth consent screen: External user type, app name, support email, add the `email`/`profile`/`openid` scopes. (Can stay in "Testing" while you build; publish later for production use by arbitrary Google accounts.)
   - APIs & Services → Credentials → Create Credentials → OAuth client ID → **Web application**.
     - Authorized JavaScript origins: `http://localhost:3000` and your production URL (Vercel domain / custom domain).
     - Authorized redirect URI: `https://bkpnrqtqmewcqyktyzlh.supabase.co/auth/v1/callback` — this is **Supabase's** callback, not the app's. It's fixed and doesn't change between environments.
   - Copy the generated Client ID and Client Secret.
2. **Supabase Dashboard** → Authentication → Providers → Google: paste the Client ID/Secret, toggle it on.
3. **Supabase Dashboard** → Authentication → URL Configuration: make sure Site URL and the Redirect URLs allow-list include `http://localhost:3000/auth/callback` and `https://<your-prod-domain>/auth/callback` (the new callback route added in Part C).

No app env vars are needed for this — Supabase handles the OAuth handshake with Google server-side; the app never sees the Google client secret.

## Part B — Database migration (fixes profile/category seeding for Google users)

New migration, e.g. `supabase/migrations/20260909120000_fix_handle_new_user_oauth.sql`:

```sql
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data->>'avatar_url'
  );

  insert into public.categories (user_id, name)
  values
    (new.id, 'Breakfast'),
    (new.id, 'Lunch'),
    (new.id, 'Dinner'),
    (new.id, 'Dessert'),
    (new.id, 'Snacks'),
    (new.id, 'Drinks');

  return new;
end;
$$;
```

Notes:
- `coalesce(...)` falls back through email-signup's `display_name`, then Google's `full_name`/`name`, then the email's local part, so nobody ends up with a blank name.
- Seeding `avatar_url` from Google's profile picture on first sign-in is a nice-to-have, not required — drop that column from the insert if you'd rather users set their own avatar via `AvatarPicker`.
- Apply via the Supabase MCP `apply_migration` tool (keeps the migration tracked) or `supabase db push`, matching however the rest of this project's migrations have been applied.

## Part C — App code

1. **New OAuth callback route** — `src/app/auth/callback/route.ts` (separate from the existing `src/app/auth/confirm/route.ts`, which handles the OTP-token flow used by password reset, not OAuth):

   ```ts
   import { createClient } from '@/lib/supabaseServerClient';
   import { type NextRequest, NextResponse } from 'next/server';

   export async function GET(request: NextRequest) {
       const { searchParams, origin } = new URL(request.url);
       const code = searchParams.get('code');
       const next = searchParams.get('next') ?? '/';

       if (code) {
           const supabase = await createClient();
           const { error } = await supabase.auth.exchangeCodeForSession(code);

           if (!error) {
               return NextResponse.redirect(`${origin}${next}`);
           }
       }

       return NextResponse.redirect(`${origin}/login?message=oauth-error`);
   }
   ```

2. **`src/api/auth.ts`** — add a `signInWithGoogle` alongside the existing `signIn`/`signUp`:

   ```ts
   export async function signInWithGoogle(redirectTo = '/') {
       const supabase = createClient();

       const { error } = await supabase.auth.signInWithOAuth({
           provider: 'google',
           options: {
               redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`
           }
       });

       if (error) {
           throw error;
       }
   }
   ```

   (This redirects the whole page to Google, so there's no return value to await on success — the browser navigates away.)

3. **New `GoogleSignInButton` component** — `src/components/auth/GoogleSignInButton.tsx`. Needs an inline Google "G" logo SVG (Google's brand guidelines require the official multi-color mark, not a generic icon — lucide-react doesn't have one) and should follow Google's button styling guidelines (white background, subtle border, "Continue with Google" or "Sign in with Google" text). Wire it to call `signInWithGoogle(redirectTo)`.

4. **`login/page.tsx` and `signup/page.tsx`** — add the button plus an "or" divider above/below the existing email/password form, passing through the same `redirectTo` the page already computes from the `redirect` query param, so the Google flow respects the existing `AuthGateModal` → `/login?redirect=...` → post-login redirect behavior.

5. **`middleware.ts`** — no structural change needed: `/auth/callback` isn't in `authPaths` (`/login`, `/signup`) so it won't get the "already logged in, bounce to /" redirect while the code exchange is happening, and the route matcher already excludes only static assets, not this path. Worth a quick read-through after adding the route to confirm nothing about the new path needs to be added to `EXACT_PROTECTED_PATHS`/`authPaths`.

6. **Error/edge-case handling**:
   - User cancels the Google consent screen → Google/Supabase redirects back with `error`/`error_description` query params instead of `code`; the callback route above falls through to the `/login?message=oauth-error` branch. Add an `'oauth-error'` entry to the `MESSAGE_COPY` maps in `login/page.tsx` (and `signup/page.tsx` if it shows messages too), e.g. `"Google sign-in didn't complete — try again."`.
   - Existing email/password account signing in with Google using the same email address: verify Supabase's account-linking behavior in Authentication → Providers settings (whether same-email accounts auto-link or come back as a distinct identity) and decide/test the desired behavior — don't assume; this is a real product decision, not just wiring.

## Part D — Testing checklist

- Fresh Google sign-up (never used this email in the app before): confirm a `profiles` row is created with a real display name (not null) and the 6 default categories are seeded.
- Google sign-in redirects respect the `redirect`/`message` query-param pattern the same way email/password login does (e.g. triggering the flow from the `AuthGateModal` on `/recipes/new`).
- Cancel the Google consent screen partway through → lands back on `/login` with a sensible message, not a crash.
- `npm run lint` / `tsc` / `npm run test` clean on the new files, per this project's usual verification bar.
- Sanity-check on both `localhost:3000` and the production domain, since the redirect URI allow-list is environment-specific (Part A, step 3).

## Open decisions before/while implementing

- Whether to seed `avatar_url` from the Google profile picture (Part B) or leave avatars purely user-set.
- What happens when a Google sign-in email matches an existing email/password account (Part C, item 6) — worth deciding deliberately rather than discovering it in production.
- Whether "Continue with Google" should also appear on `AuthGateModal` itself (the sign-in-required popup), not just the full `/login` and `/signup` pages.
