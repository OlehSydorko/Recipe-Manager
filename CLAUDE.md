# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Team contracts (must follow on every task)

@.claude/contracts/architecture.md
@.claude/contracts/code-style.md
@.claude/contracts/styles.md
@.claude/contracts/component.md
@.claude/contracts/constants.md
@.claude/contracts/server-state.md

> Reviews run the shared `.claude/contracts/architecture-review-checklist.md` (blast-radius procedure + per-principle checks). It is referenced by every review command — not @-imported here because it is review-time, not write-time.

## Commands

```bash
yarn start          # Start dev server at http://localhost:3000
yarn test           # Run all tests (interactive watch mode)
yarn lint           # ESLint on all src TS/JS files
yarn prettier-check # Check formatting
yarn prettier-write # Auto-fix formatting
yarn build          # Production build
```

Run a single test file:
```bash
yarn test -- --testPathPattern=src/__tests__/specs/utils/helpers
```

## Local Environment Setup

Create a `.env.local` file in the root:
```
REACT_APP_API_URL=https://develop.api.eduki.info/api/
REACT_APP_FRONT_URL=https://develop.eduki.info
REACT_APP_INTERACTIVE_URL=https://develop.i.eduki.info
REACT_APP_BLOCK_SENTRY=true
REACT_APP_HTML_LANG=de
REACT_APP_STATSIG_CLIENT_API_KEY=<key from Statsig cabinet>
PORT=3000
```

> Eduki VPN is required to run the project locally.

## Architecture

### Entry & App Shell

- `src/index.tsx` — bootstraps the React app with `createBrowserRouter`
- `src/entry.tsx` — wraps the app in `StatsigProvider`, handles author domain routing, initializes Sentry/Usercentrics, chooses between `App` and `SelectionScreen`
- `src/App.tsx` — sets up Redux `Provider`, Header, Footer, global modals (`AddToCartModal`, `PersonalizationModal`), and renders route `<Outlet />`

### Routing

Routes are defined in `src/routes.tsx` and resolved via `AsyncComponent` in `src/routes/index.tsx`. All page components are lazy-loaded. New routes require:
1. A lazy import in `src/routes/index.tsx`
2. A `<Route>` entry in `src/routes.tsx`
3. A constant in `src/constants/routes.ts`

`PrivateRoute` (`src/common/private-route/`) guards authenticated routes. `DomainManager` (`src/utils/domain-manager.tsx`) switches between the author subdomain and the main marketplace.

### Redux Store

- `src/store.ts` — creates the store with redux-thunk
- `src/root-reducer.ts` — combines `main`, `globalABTest`, and `author` reducers; exports `injectReducer` for code-split async reducers
- `src/reducers/index.ts` — the `main` combined reducer: `user`, `cart`, `filters`, `searchResults`, `geotargeting`, `folders`, `currency`, `favorite`, `cookieConsent`, `schoolClassification`, `websocket`, `newFeaturesTour`
- Route-level reducers (e.g., `payment`, `materialUpload`, `bundle`) are loaded lazily via `injectReducer` when that route is visited

### API Layer

- `src/utils/axios.ts` — configures axios with `REACT_APP_API_URL` as base URL and `withCredentials: true`
- `src/utils/interceptor/` — request interceptor injects the `world` param into all requests; response interceptor handles auth errors and error tracking
- `src/api/<entity>/` — pure axios fetchers per data domain (URL + DTO + domain mapping only)
- `src/services/<entity>/` — React Query hooks (`useQuery`/`useMutation`) + `query-keys.ts`, wrapping the `src/api/<entity>/` fetchers (see `server-state.md`)
- Legacy flat files (`cart-service.ts`, `my-sales.ts`) remain until migrated.

### Multi-World / i18n

The app supports multiple language "worlds" (e.g., `de`, `es`). The `world` value is injected into every API request via the axios interceptor. i18n is done with `i18next` + PhraseApp integration (`src/i18n.ts`). The last visited world is persisted via `src/utils/last-visited-world.ts`.

### Key Directories

| Path | Purpose |
|------|---------|
| `src/routes/` | Page-level components (one folder per route) |
| `src/common/` | Shared UI components |
| `src/layouts/` | Header and Footer |
| `src/reducers/` | Global Redux reducers |
| `src/api/` | Pure axios fetchers (transport + DTO → domain mapping) |
| `src/services/` | React Query hooks + query-key factories wrapping `src/api/` |
| `src/utils/` | Pure helpers and utilities |
| `src/hooks/` | Custom React hooks |
| `src/contexts/` | React contexts |
| `src/constants/` | App-wide constants including route definitions |
| `src/__tests__/` | Jest tests (fixtures in `fixtures/`, specs in `specs/`) |

### A/B Testing

Statsig is used for A/B tests via `useStatsigGate`/`useExperiment` from `@statsig/react-bindings`. The `REACT_APP_STATSIG_CLIENT_API_KEY` env var is required. Legacy AB tests use `src/reducers/global-ab-test.ts`.

### Deployment

Branch names must be max 20 characters. Jenkins auto-deploys branches to `https://<branch-name>.eduki.info/de` after a PR is created.

## Code Style

IMPORTANT: follow our team codestyle from .claude/contracts/code-style.md

Before writing or modifying any code, enforce these rules on every file you touch:
- Newline at end of file
- Single quotes only
- No explicit `any`
- Use TS types over interfaces!
- External imports first, then local imports
- Constants in SCREAMING_SNAKE_CASE, components in PascalCase, everything else camelCase
- Event handlers named `handle*`, props named `on*`
- No inline styles — use class names
- No unused imports, props, or type keys

Use `/code-style` for a full checklist review.

## Unit Tests

IMPORTANT: Every utility function must be covered by unit tests. Add them while generating code. Unit test should be small, structured and understandable for human editing.

### Rule

- New util function → at least one test per code path in `src/__tests__/specs/utils/`
- New component → at least a render test and an interaction test (if interactive) in `src/__tests__/specs/components/`
- Bug fix → add a regression test that would have caught the bug

Do not submit a PR without corresponding tests for the changed code.

### Test stack

- Jest + `@testing-library/react` + `@testing-library/user-event`
- Fixtures in `src/__tests__/fixtures/`
- Prefer `getByRole`/`getByText`/`getByLabelText` over raw `querySelector`
- Use `userEvent` over `fireEvent` for user interactions

Use `/unit-tests` for the full writing and review guide.

### Structure

| Path | Purpose |
|------|---------|
| `src/api/` | Pure axios fetchers |
| `src/services/` | React Query hooks + query-key factories |
| `src/constants/` | Global constants |
| `src/utils/` | Common utils, parsers, validators, helpers, formatters |
| `src/types/` | Global types in `.d.ts` files |

Types/interfaces that belong to a specific component should be colocated (declared in the same file where used).
