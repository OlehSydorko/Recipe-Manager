# Recipe Manager — UI Redesign Plan

Status: **draft, awaiting approval**. No application code has been touched. This document is the only new file.

## 1. Current state (what I found)

- Styling is Tailwind v4, CSS-first config (`@theme inline` in `src/app/globals.css`), no `tailwind.config.js`. Only two CSS variables exist today: `--background` / `--foreground`, with a `prefers-color-scheme: dark` media query that's currently disconnected from the actual body font (`body` hardcodes `font-family: Arial…`, overriding the Geist variable that's set up in `layout.tsx`).
- `input, select, textarea { color-scheme: light }` forces light native form controls everywhere — this alone will make checkboxes, the date-less native bits, and file inputs look wrong on a dark background if untouched.
- Every screen (`recipes/page.tsx`, `recipes/[id]/page.tsx`, `recipes/new`, `recipes/[id]/edit`, `login`, `signup`, `(authenticated)/page.tsx`) hand-rolls the same handful of raw Tailwind utilities inline: `rounded border px-3 py-2`, `bg-black text-white`, `text-gray-600`, etc. There are no shared `Button`/`Input`/`Card` components — every button is a one-off `<button className="...">`.
- No icon library is installed (checked `package.json`) — the only "icon" in the app is a literal `✕` character in `CategoryDropdown.tsx`.
- No toast/notification system and no modal/dialog component — destructive actions (`CategorySelect`, `CategoryFilter`, `LeaveButton`) use native `window.confirm` / `window.alert`, explicitly called out in code comments as "no custom modal component exists yet."
- No loading skeletons — loading states are a single line of gray text (`Loading recipes…`).
- `Sidebar.tsx` and `Nav.tsx` are minimal and will need real content once shopping list / meal planner ship, per `CLAUDE.md`.

This confirms the redesign is starting from a functionally-complete but visually bare app — good news: there's very little existing visual design to fight against, and no shared components to break by renaming.

## 2. Design system

### 2.1 Color palette (soft dark theme)

All values as CSS custom properties, defined once in `globals.css` under `@theme inline` (Tailwind v4 style) so they generate matching utilities (`bg-surface-2`, `text-text-secondary`, etc.).

| Token | Hex | Usage |
|---|---|---|
| `--color-bg` | `#12141A` | App shell / page background (level 0) — soft charcoal, not pure black |
| `--color-bg-secondary` | `#181B22` | Sidebar, header/nav bar (level 1) |
| `--color-surface` | `#1E222B` | Card surface — recipe cards, form panels (level 2) |
| `--color-surface-elevated` | `#262B36` | Dropdowns, popovers, modals, toasts (level 3) |
| `--color-border` | `#2C313D` | Default hairline border |
| `--color-border-strong` | `#3A4152` | Emphasized border (focus, active dropdown) |
| `--color-hover` | `rgba(255,255,255,0.045)` | Overlay applied on hover, any surface |
| `--color-active` | `rgba(255,255,255,0.075)` | Overlay applied on press/active |
| `--color-accent` | `#2FD3C2` | Primary accent — teal/mint. Primary buttons, links, active nav, checked state |
| `--color-accent-hover` | `#26B8A9` | Primary accent hover |
| `--color-accent-active` | `#1FA294` | Primary accent pressed |
| `--color-accent-muted` | `#16332F` | Accent tint background (selected chip, subtle highlight) |
| `--color-accent-secondary` | `#5EEAD4` | Secondary accent — lighter mint, used sparingly for secondary highlights/badges |
| `--color-success` | `#4ADE80` | Success text/icon |
| `--color-success-muted` | `#1C3327` | Success background tint (toast, badge) |
| `--color-warning` | `#FBBF24` | Warning text/icon |
| `--color-warning-muted` | `#332B14` | Warning background tint |
| `--color-error` | `#F87171` | Error text/icon, danger button |
| `--color-error-muted` | `#3A1D1D` | Error background tint |
| `--color-text-primary` | `#F1F5F4` | Headings, primary body text (off-white, not `#fff`) |
| `--color-text-secondary` | `#9BA5AE` | Secondary text, helper text, metadata |
| `--color-text-disabled` | `#5B6472` | Disabled labels, placeholder text |

Notes:
- Backgrounds step up in lightness with elevation (0→3); nothing above level 3, so at most two floating layers on screen at once (e.g. a dropdown inside a modal is the ceiling).
- Warm colors (success/warning/error) are desaturated slightly so they sit comfortably next to the teal accent instead of competing with it.
- `input, select, textarea { color-scheme: dark }` replaces the current `light` value so native pickers/scrollbars match.

### 2.2 Typography

Keep **Geist Sans** (already loaded via `next/font/google`, zero new dependency) — its geometric-but-friendly letterforms match the Linear/Raycast reference well. Fix the existing bug where `body` hardcodes Arial. Use **Geist Mono** (already loaded, currently unused) for numeric ingredient quantities — a small detail that reinforces the "developer tool" polish.

| Role | Size / weight | Example use |
|---|---|---|
| Display / H1 | 28px / 600 | Page titles ("Recipes", "New recipe") |
| H2 | 20px / 600 | Section headers ("Ingredients", "Instructions") |
| H3 | 16px / 500 | Card titles (recipe name on a card) |
| Body | 15px / 400 | Descriptions, instructions text |
| Label | 13px / 500 | Form field labels, uppercase tracking-wide for section eyebrows |
| Button | 14px / 500 | All button text |
| Helper / caption | 12px / 400 | Timestamps, counts, error text |
| Mono (quantities) | 14px / 500, Geist Mono | "250 g", "2 tbsp" |

Line height 1.5 for body, 1.25 for headings. No new font is installed.

### 2.3 Spacing, radius, elevation

- Spacing stays on Tailwind's default 4px scale; semantic conventions: 16px inside compact controls, 20–24px card padding, 32px between page sections, 24px page gutter on mobile / 40px on desktop.
- Radius scale: `--radius-sm: 8px` (chips, inputs, small buttons), `--radius-md: 12px` (buttons, dropdowns), `--radius-lg: 16px` (cards), `--radius-xl: 20px` (modals, images, FAB), `--radius-full` (pills, avatars, FAB).
- Elevation is built from surface color steps first, shadow second (dark backgrounds make shadows subtle by nature — a lighter surface + a thin 1px top highlight border reads as "raised" better than a shadow alone):
  - `--shadow-sm`: `0 1px 2px rgba(0,0,0,0.24)` — inputs, chips
  - `--shadow-md`: `0 4px 12px rgba(0,0,0,0.32)` — cards, dropdown menus
  - `--shadow-lg`: `0 16px 40px rgba(0,0,0,0.45)` — modals, dialogs
  - Cards additionally get `border: 1px solid var(--color-border)` plus a barely-visible `inset 0 1px 0 rgba(255,255,255,0.04)` top highlight to fake a soft light source.

### 2.4 Components

- **Primary button**: `bg-accent`, dark text (`#0A1F1C`) for contrast on the bright mint fill, `radius-md`, `shadow-sm`, hover → `bg-accent-hover` + `shadow-md`, active → `bg-accent-active` + scale 0.98. Used once per view for the main CTA ("Create recipe", "Save changes").
- **Secondary button**: transparent fill, `1px solid border-strong`, `text-primary`. Hover → `bg-hover` overlay. This becomes the *default* button for everything that isn't the one primary action (Cancel, Edit, Add ingredient).
- **Ghost button**: no border, no fill, `text-secondary`, hover → `bg-hover` + `text-primary`. Used for low-emphasis actions (Sign out, filters, "+ Add new category").
- **Danger button**: transparent fill, `1px solid` at `color-error` 40% opacity, `text-error`. Hover → `bg-error-muted`. Used for Delete.
- **Floating action button (FAB)**: replaces the current fixed "Leave" button's raw styling — `radius-full`, `bg-surface-elevated`, `shadow-lg`, icon + label, fixed bottom-right with 24px inset, subtle scale-up on hover.
- **Icon button**: `radius-full` or `radius-sm`, 40×40px minimum hit area (touch-friendly), `text-secondary` → `text-primary` on hover, transparent → `bg-hover` on hover.
- **Inputs**: `bg-surface`, `1px solid border`, `radius-sm`, 44px min height (touch-friendly), focus → `border-accent` + soft accent glow ring (`0 0 0 3px rgba(47,211,194,0.15)`). Placeholder in `text-disabled`.
- **Textareas**: same as inputs, `radius-md`, resizable vertically only.
- **Dropdowns** (`CategoryDropdown`): trigger styled like an input; open menu is a `surface-elevated` panel, `radius-md`, `shadow-md`, `border`, options get `bg-hover` on hover and `bg-accent-muted` + `text-accent` when selected.
- **Recipe cards**: `bg-surface`, `radius-lg`, `shadow-sm` idle → `shadow-md` + slight `translateY(-2px)` on hover, image on top with `radius-lg` matching top corners only, category shown as a chip overlaid on the image or beneath the title, metadata row (time / servings / ingredient count) in `text-secondary` with small icons.
- **Ingredient rows**: each row a subtle `bg-surface` strip with `radius-sm`, checkbox on the left, quantity in Geist Mono, name in body text; checked state → row background fades toward `bg-hover` and text gets `text-disabled` + strikethrough (already implemented, just needs restyling).
- **Checkboxes**: custom-styled (native checkbox is hard to theme fully dark) — 20×20px, `radius-sm`, unchecked = `1px border-strong` on transparent, checked = `bg-accent` with a white/dark checkmark, animated with a quick scale/opacity pop.
- **Sidebar**: `bg-secondary`, `radius-lg` on the active nav item only (not the whole rail), active item gets `bg-accent-muted` + `text-accent` + a 3px accent indicator bar, icons for each nav entry (Home, Recipes, and future Shopping List / Meal Plan) at 20px.
- **Header**: `bg-secondary`, sticky, bottom `1px border`, logo/wordmark left, search bar centered or left-aligned depending on breakpoint, sign-out as a ghost/icon button right.
- **Search bar**: pill-shaped (`radius-full`), `bg-surface`, search icon left, clears with an "×" icon button when non-empty, focus → same accent ring as inputs. (Search isn't wired to data yet per current code — this styles the shell only, ready for future implementation.)
- **Category chips**: `radius-full`, small, `bg-surface` + `border` when unselected, `bg-accent-muted` + `text-accent` + `border-accent` when selected/active filter.
- **Recipe action menu**: the recipe detail view's Edit/Delete buttons are replaced by a single icon button (pen icon, top-right of the recipe header) that opens a small dropdown menu on click — `surface-elevated`, `radius-md`, `shadow-md`, `border`, containing "Edit" (default text color) and "Delete" (`text-error`) rows; closes on outside click, Escape, or selection; fully keyboard-navigable (arrow keys between items, Enter to activate) with proper `role="menu"`/`role="menuitem"` semantics.
- **Dialogs / modals**: replace native `confirm`/`alert` calls (delete category, delete recipe, unsaved-changes leave) with a real modal component — centered, `bg-surface-elevated`, `radius-xl`, `shadow-lg`, backdrop `rgba(0,0,0,0.55)` with blur, entrance = fade + scale from 0.96→1.
- **Toast notifications**: bottom-right stack, `bg-surface-elevated`, `radius-md`, `shadow-lg`, left accent bar colored by type (success/error/warning), auto-dismiss with a thin progress bar, replaces the current `window.alert` error surfacing in `CategorySelect`/`CategoryFilter`.
- **Empty states**: centered icon (outline style, `text-disabled`), short headline in `text-primary`, one line of `text-secondary` helper copy, primary button CTA where applicable ("No recipes yet — create your first one" → button).
- **Loading skeletons**: shimmering `bg-surface` blocks (subtle gradient sweep animation) shaped like the content they replace — card-shaped skeletons on the recipe list, line-shaped skeletons on recipe detail — replacing today's plain "Loading…" text.

### 2.5 Icons

No icon library exists today. Recommendation: add **`lucide-react`** — lightweight, tree-shakeable, outline-style icons that match the Linear/Raycast/Notion aesthetic referenced. This is the one new dependency this redesign would introduce; flagged as a decision point below. Icons would be used for: sidebar nav items, search, category chip clear, checkbox (custom), delete/edit actions (replacing the literal `✕`), empty states, toast types, and the FAB.

## 3. Layout recommendations

- **Recipe list** (`recipes/page.tsx`): move from a bordered `<ul>` list to a responsive card grid (1 column mobile, 2 tablet, 3 desktop). Category filter becomes chips instead of a dropdown-only control, with an overflow "More" dropdown if categories exceed the row.
- **Recipe details** (`recipes/[id]/page.tsx`): hero image full-bleed at the top (rounded, contained), title/category below it with the recipe action menu (pen icon → Edit/Delete dropdown) in place of separate Edit/Delete buttons, ingredients and instructions as two clearly separated card sections rather than plain stacked divs. Sticky FAB stays for "back to list."
- **Create/Edit recipe**: keep the current single-column form (it's the right call for a focused data-entry task) but widen slightly, group related fields visually (title+category in one card, ingredients in their own card, instructions in their own card), image picker gets a proper dropzone look instead of a bare `<input type=file>`.
- **Sidebar**: currently a bare 48-width column with text links; keep the concept (it's appropriate for this app's shallow nav depth) but add icons, active-state styling, and reserve space for the two upcoming nav entries (Shopping List, Meal Plan) so adding them later doesn't require re-layout.
- **Header/Nav**: add the search bar shell here (currently absent) since the design brief calls for one and the reference screenshot centers navigation in a header-like area.
- **Responsive behavior**: sidebar collapses to a bottom tab bar on mobile (this mirrors the reference screenshot's bottom nav) rather than disappearing; tablet keeps the sidebar but narrower; desktop is the current max-width-4xl centered layout, possibly widened slightly to accommodate the card grid without feeling cramped.

## 4. Animation recommendations

All animations short (120–200ms) and use an ease-out or standard curve — nothing bouncy, per "professional" brief.

- Hover: background/border color transitions (150ms ease-out) on buttons, cards, rows, nav items.
- Button press: scale to 0.98 (100ms) on `:active`.
- Opening a recipe: card → detail could get a subtle fade/slide (150ms) on route transition; kept minimal since Next.js App Router transitions add complexity — recommend CSS-only fade-in on mount rather than a full page-transition library.
- Closing/leaving: reverse fade, same duration.
- Dialogs/modals: backdrop fade (150ms) + dialog scale 0.96→1 + fade (180ms).
- Dropdowns: fade + slight translateY(-4px→0) on open (120ms), instant close.
- Checkboxes: check mark scale/opacity pop (150ms) on check, plain fade on uncheck.
- Page transitions: skip a heavy transition system; rely on per-component enter animations (cards, sections) via simple CSS `@starting-style` or a small `framer-motion`-free approach to avoid adding another dependency unless you want one (flagged as optional, not required).

## 5. Implementation phases

Each phase is independently shippable and reviewable; the app keeps working after every phase.

### Phase 1 — Design tokens
**What**: Add all color, typography, spacing, radius, and shadow tokens to `globals.css` under `@theme inline`. Fix the `body` font bug (remove hardcoded Arial). Change `color-scheme` to `dark`. No component changes yet — app will look mostly the same except native form controls and the base background/text color.
**Why**: Every later phase depends on these tokens existing; doing it first means Phases 2+ never touch raw hex values.
**Files**: `src/app/globals.css` only.
**Risk**: Low. Possible flash of unstyled native controls if `color-scheme: dark` is set before other tokens land — cosmetic only.

### Phase 2 — Layout structure
**What**: Restyle `Nav.tsx`, `Sidebar.tsx`, and `(authenticated)/layout.tsx` with the new surface levels, add icons to sidebar links, add the search bar shell to the header, prep (but don't yet require) the mobile bottom-tab-bar behavior.
**Why**: The shell is what's visible on every screen — establishing it early means every subsequent phase is reviewed inside the real chrome, not a blank white page.
**Files**: `src/components/Nav.tsx`, `src/components/Sidebar.tsx`, `src/app/(authenticated)/layout.tsx`.
**Risk**: Low-medium. Adding icons requires the `lucide-react` decision (Phase 2 is the natural point to install it, or substitute inline SVGs if you'd rather not add a dependency).

### Phase 3 — Buttons and inputs
**What**: Introduce shared `Button` (primary/secondary/ghost/danger variants) and `Input`/`Textarea` components; replace every inline `className="rounded border px-3 py-2..."` button/input across the app with them.
**Why**: This is the highest-leverage phase — nearly every screen has at least one button or input, and centralizing them means Phases 4–6 just consume components instead of repeating utility strings.
**Files**: new `src/components/ui/Button.tsx`, `src/components/ui/Input.tsx`, `src/components/ui/Textarea.tsx`; edits to `SignOutButton.tsx`, `LeaveButton.tsx`, `recipes/page.tsx`, `recipes/new/page.tsx`, `recipes/[id]/edit/page.tsx`, `recipes/[id]/page.tsx`, `login/page.tsx`, `signup/page.tsx`, `CategorySelect.tsx`.
**Risk**: Medium — touches the most files, but changes are mechanical (swap classes for a component) so regression risk is more about consistency than logic.

### Phase 4 — Recipe cards and recipe list
**What**: Convert `recipes/page.tsx` from a bordered list to the card grid; restyle `CategoryFilter` as chips; add card hover/elevation animation; add the empty-state and loading-skeleton treatment.
**Why**: This is the first screen a user sees after login — biggest visual impact for the "modern mobile-app feeling" goal.
**Files**: `src/app/(authenticated)/recipes/page.tsx`, `src/components/CategoryFilter.tsx`, `src/components/CategoryDropdown.tsx` (chip variant or shared styling), new skeleton component.
**Risk**: Medium — grid layout needs to handle recipes without images gracefully (current data model allows `image_url` to be null).

### Phase 5 — Recipe details page
**What**: Restyle `recipes/[id]/page.tsx` — hero image treatment, card-sectioned ingredients/instructions, restyled ingredient rows and checkboxes. Replace the current separate Edit and Delete buttons with a single icon-based action menu: a pen-icon button in the top-right of the recipe header that opens a dropdown containing "Edit" and "Delete" (Delete shown in red). Build the new `ActionMenu` component with keyboard navigation and click-outside/Escape-to-close. Replace the native `confirm()` on delete with the real modal component.
**Why**: This is the "long cooking session" screen the brief specifically calls out for comfort — checkbox interaction quality matters most here. Consolidating Edit/Delete into one icon menu also declutters the header per the latest feedback.
**Files**: `src/app/(authenticated)/recipes/[id]/page.tsx`, new `src/components/ui/ActionMenu.tsx`, `src/components/IngredientRows.tsx` (or a new read-only ingredient-row display, since `IngredientRows.tsx` today is actually the *editable* draft component used by New/Edit — worth confirming naming during this phase), new `Modal`/`Dialog` component.
**Risk**: Medium — introducing a real modal component means also deciding where else to reuse it (category delete confirm, leave-without-saving confirm) — recommend doing that consolidation in this phase since the component will already exist. The new `ActionMenu` also needs the same accessibility care as `CategoryDropdown` (focus handling, ARIA roles) to avoid regressing keyboard usability.

### Phase 6 — Create/Edit recipe pages
**What**: Restyle `recipes/new/page.tsx` and `recipes/[id]/edit/page.tsx` forms with card grouping, restyle `IngredientRows.tsx` editable rows, restyle `RecipeImagePicker.tsx` as a proper dropzone, restyle `CategorySelect.tsx`/`CategoryDropdown.tsx` dropdown panel.
**Why**: These are the most form-heavy screens; getting inputs/dropdowns/file-picker right here validates the whole component set built in Phase 3.
**Files**: `src/app/(authenticated)/recipes/new/page.tsx`, `src/app/(authenticated)/recipes/[id]/edit/page.tsx`, `src/components/IngredientRows.tsx`, `src/components/RecipeImagePicker.tsx`, `src/components/CategorySelect.tsx`, `src/components/CategoryDropdown.tsx`.
**Risk**: Medium — `IngredientRows.tsx` has non-trivial input-sanitizing logic (`sanitizeQuantity`) that must not be touched, only its JSX/classNames — a good test of "restyle without refactoring."

### Phase 7 — Animations and micro-interactions
**What**: Layer in the hover/press/dropdown/dialog/checkbox transitions defined in Section 4, once all components exist and aren't going to be restructured further.
**Why**: Animating a component that's about to be redesigned again is wasted work — doing this last means every transition is final.
**Files**: Touches most component files from Phases 2–6, but only adding transition/animation classes — no structural changes.
**Risk**: Low. Main risk is overdoing it — brief explicitly wants "minimal, professional," so this phase should be reviewed critically for anything that feels showy.

### Phase 8 — Responsiveness and accessibility polish
**What**: Verify/adjust breakpoint behavior (mobile bottom tab bar, tablet sidebar width, desktop grid columns), audit color contrast (teal-on-dark and text-secondary against all surface levels) against WCAG AA, verify all interactive elements have visible focus states and adequate touch targets (44px minimum), verify toasts/modals are keyboard-dismissible and screen-reader announced.
**Why**: Final pass across the whole app rather than per-screen, since responsive/accessibility issues often only show up once everything else is in place.
**Files**: Potentially any file, but primarily spot-fixes rather than rewrites.
**Risk**: Low-medium — accessibility fixes occasionally reveal a component needs a structural tweak (e.g., a missing `aria-live` region for toasts) rather than just a class change.

## 6. Decisions (resolved)

1. **Icon library** — `lucide-react` will be added as a new dependency.
2. **Modal/Dialog primitive** — custom-built component, no new dependency.
3. **Phase granularity** — one phase at a time, reviewed and approved before moving to the next.

## 7. Wireframes

See the accompanying visual mockup (recipe list + recipe detail, dark teal theme) shared alongside this document for a concrete look at the direction before any code changes.
