# Fixing 403 errors on "Import from URL" (preppykitchen.com and similar)

## What's happening

The example URL —

```
https://preppykitchen.com/cheese-ravioli/?__cf_chl_rt_tk=mxRsTZHmTk9dRQvEmKOS2aElXPM40J1wSosRMHMjpoY-1787766725-1.0.1.1-68O8OB8fQCQ8z7Q76_dcQzyDM56NyXUC8ugpMODogIg#recipe
```

contains a `__cf_chl_rt_tk` query parameter. That's not part of the recipe's real URL — it's a Cloudflare challenge-response token that got appended to the address bar when your own browser passed a Cloudflare bot check (a "Managed Challenge" / JS challenge) to reach the page. Its presence confirms preppykitchen.com sits behind Cloudflare's bot management, and the token itself is single-use and tied to your browser's session/fingerprint — it means nothing when replayed by a different client.

Tracing the failure through the code (`src/lib/recipeImport/ssrfGuard.ts` → `src/app/api/recipes/import/route.ts`):

1. `handleUrlImport` calls `validateImportUrl` (passes — it's a normal public https URL, not an SSRF target), then `guardedFetch`.
2. `guardedFetchBytes` does the actual `fetch()`, sending this fixed header:
   ```ts
   headers: { 'user-agent': 'Mozilla/5.0 (compatible; RecipeManagerImport/1.0)' }
   ```
   That's the only header sent — no `Accept`, `Accept-Language`, or any of the other headers a real browser always sends.
3. Cloudflare (and most bot-management/WAF products) treat a `(compatible; SomethingBot/1.0)` User-Agent as a self-declared bot — it's the exact format Googlebot and friends use to identify themselves — and a request carrying only a User-Agent with no companion browser headers is itself a strong bot signal. Preppykitchen's edge rejects the request with `403`.
4. `guardedFetchBytes` sees `!response.ok` and throws `SsrfBlockedError('That page returned an error (403).')`. `handleUrlImport` catches that and returns it as a `400` from our own API, with that message as the error text — which is what shows up as "error 403" in the toast (`ImportRecipeDialog.tsx` → `useImportRecipe.ts`).

I couldn't reproduce the live Cloudflare response directly from this sandbox — its own network egress allowlist blocks arbitrary outbound domains (confirmed: `google.com` and `allrecipes.com` failed identically to `preppykitchen.com` here, all via a connection reset right after a canned 403 header, not a real page). So this diagnosis is based on the code path plus the strong evidence already in the URL itself, not a live repro. Worth a real test against the deployed app (or `npm run dev`) once the fix below is in.

## Two different failure modes, only one of which is fixable

**Fixable — naive User-Agent sniffing.** A lot of WordPress recipe blogs (WP Recipe Maker, Tasty Recipes, etc.) run behind Cloudflare in a *low* security mode that just checks for a "real browser–shaped" request: a normal-looking `Mozilla/5.0 (Windows NT ...) ... Chrome/...` UA plus the handful of headers a browser always sends alongside it. Sending a more convincing header set can get past this tier.

**Not fixable without a headless browser — real bot management.** The `__cf_chl_rt_tk` token specifically indicates preppykitchen.com has an active *Managed Challenge* on this zone, which typically means a JavaScript computation and/or TLS fingerprint check that a plain server-side `fetch()` fundamentally cannot satisfy — no header value will produce the right answer, because there's no JS engine running to compute it. If that's the tier this site runs, this URL will keep failing (either with a `403`, or a `200` whose body is Cloudflare's "Just a moment…" interstitial instead of the recipe — a different symptom worth watching for too).

Standing up a headless-browser fetch path (e.g. Playwright behind the import endpoint, or a paid scraping API like ScrapingBee/Browserless) would defeat tier 2, but it's a real infrastructure and cost commitment — a serverless function spinning up a real browser is slow and heavier than this project's current "Postgres + RLS, no custom backend" philosophy, and paid scraping APIs mean a new external dependency and a bill. That's a bigger decision than this bug fix; I'd flag it as a separate, explicit call for you to make rather than sneak in as part of a header tweak.

## Proposed implementation (scoped to what's fixable)

### 1. `src/lib/recipeImport/ssrfGuard.ts` — send a realistic browser header set

Replace the single `user-agent` header in `guardedFetchBytes`'s `fetch()` call with a current desktop-Chrome UA plus its usual companions:

```ts
headers: {
    'user-agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/<current>.0.0.0 Safari/537.36',
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'accept-language': 'en-US,en;q=0.9',
    'upgrade-insecure-requests': '1'
}
```
(Pin the Chrome version to whatever's current at implementation time — these strings age, so leave a comment noting it should be refreshed periodically, same spirit as the `GEMINI_MODEL` note in `CLAUDE.md`.)

This is a one-line-of-reasoning change with no architectural impact: it only affects the headers on the one outbound fetch this app makes for URL-mode import, doesn't touch the SSRF allow/deny logic at all, and should measurably reduce 403s from sites doing simple UA sniffing. It will *not* by itself fix Cloudflare Managed Challenge–tier sites like (possibly) this one.

### 2. Same file — recognize bot-management blocks and say so distinctly

Right now every non-2xx response becomes the same generic `SsrfBlockedError('That page returned an error (<status>).')`, which is indistinguishable from "the page moved," "the recipe was deleted," or any other ordinary HTTP error. Add a new error type and a cheap heuristic to tell bot-blocks apart, so the user gets an actionable message instead of a bare status code:

```ts
export class BotProtectionError extends Error {
    constructor(message = 'This site blocks automated page fetching, so it can’t be imported by pasting a link. Try "Upload a screenshot" instead.') {
        super(message);
        this.name = 'BotProtectionError';
    }
}

const BOT_PROTECTION_BODY_MARKERS = [
    'checking your browser',
    'just a moment',
    'attention required',
    'cf-browser-verification',
    'enable javascript and cookies',
    '/cdn-cgi/challenge-platform',
    'px-captcha', // PerimeterX
    'datadome' // DataDome
];

function looksLikeBotProtectionBlock(status: number, headers: Headers, bodySample: string): boolean {
    if (status !== 403 && status !== 503) {
        return false;
    }

    const server = headers.get('server')?.toLowerCase() ?? '';
    const hasBotHeaderSignal = headers.has('cf-mitigated') || headers.has('cf-ray') || server.includes('cloudflare');
    const lowerBody = bodySample.toLowerCase();
    const hasBotBodySignal = BOT_PROTECTION_BODY_MARKERS.some((marker) => lowerBody.includes(marker));

    return hasBotHeaderSignal || hasBotBodySignal;
}
```

Call this where `guardedFetchBytes` currently does `if (!response.ok) { throw new SsrfBlockedError(...) }` — read a small prefix of the body first (a few KB is enough for the marker strings above; the existing `MAX_RESPONSE_BYTES` streaming loop can just be reused, or a short separate peek if simpler) and throw `BotProtectionError` instead of `SsrfBlockedError` when `looksLikeBotProtectionBlock` is true.

This is a heuristic, not a certainty — some of these markers (`cf-ray` in particular) appear on *every* Cloudflare-proxied response, not just blocked ones, so the check needs to be status-gated (only 403/503) as above, not just "any Cloudflare header." It'll have some false negatives (bot-management products this list doesn't recognize) and it's fine to start narrow and extend the marker list later if another site trips it.

### 3. `src/app/api/recipes/import/route.ts` — surface the distinct message

In `handleUrlImport`'s catch block, add a branch for the new error type before the existing `SsrfBlockedError` branch:

```ts
if (error instanceof BotProtectionError) {
    return errorResponse(error.message, 422);
}
```

(422 rather than 400, to distinguish "we understood the request but the target refused us" from the existing "malformed/disallowed URL" case — purely a status-code nicety, `ImportRecipeDialog.tsx` only reads `error.message` today so this doesn't require a frontend change to work.)

### 4. No required frontend change

`ImportRecipeDialog.tsx` already surfaces `error.message` verbatim via a toast (`handleImportError`), and the dialog already has a working, unrelated "Upload a screenshot" tab right next to "Paste a link" — so the new message's own text ("Try 'Upload a screenshot' instead") is actionable without any UI work. If you want to go further later (e.g. auto-switch the active tab when this specific error comes back), that's a small, separate follow-up — I'd hold off on it for this pass per the "smallest diff" rule in `CLAUDE.md`.

## What this does and doesn't fix

Does fix: recipe sites whose bot-blocking is just User-Agent/header sniffing (a meaningful share of WordPress food-blog sites). Turns a raw, confusing "error 403" into a clear "this site blocks automated fetching, try the photo import" message for sites where it's still blocked either way.

Doesn't fix: this specific preppykitchen.com URL may keep failing even after the header change, if its Cloudflare zone really is running a JS/TLS-fingerprint Managed Challenge (which the `__cf_chl_rt_tk` token suggests) — in which case the win is that you get a clear, honest error message telling you to use the photo-import path instead of a bare, confusing 403.

## Testing plan

- `tsc --noEmit`, `eslint`, `vitest run` (existing `ssrfGuard.test.ts` will need a couple of new cases: bot-protection body/header markers correctly classified as `BotProtectionError`, ordinary 404/500s still classified as plain `SsrfBlockedError`).
- Can't be verified against the real internet from this sandbox (its own egress allowlist blocks arbitrary outbound domains, confirmed above) — needs a real check from `npm run dev` locally or the deployed app: retry this exact preppykitchen.com URL, plus 1-2 recipe sites *not* behind heavy bot protection (to confirm no regression) and, if you have one handy, another Cloudflare-protected recipe site (to see whether the header fix alone is enough for some).

## Open decision for you before I build this

Should I scope this to steps 1–3 above (headers + honest error message, no new dependency), or do you want to additionally investigate a headless-browser/paid-scraping fallback so preppykitchen.com-tier sites actually work? That's a materially bigger change (new dependency, cost, latency), so I want your call before starting rather than assuming.
