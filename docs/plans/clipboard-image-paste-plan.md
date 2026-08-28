# Plan: Paste an image from the clipboard (Ctrl+V), like Google Translate

## 1. What you asked for

Right now, getting a screenshot into the app means: take the screenshot → save it to disk somewhere → click the photo box → browse to that file. You want to skip the save-to-disk step: take a screenshot (or copy any image), then just press **Ctrl+V** anywhere on the page and have it drop straight into the image field — the way Google Translate's image tab works.

Scope, confirmed with you:

- Applies to **both** image pickers in the app (see below).
- Paste is scoped to the specific photo box: click into it first (the same click that opens the file browser), then Ctrl+V pastes. Paste does nothing anywhere else on the page.

## 2. Current state (investigated in the live code)

There are exactly two places in the app where you pick an image via a file browser, and neither supports paste today:

1. **`src/features/recipes/components/RecipeImagePicker.tsx`** — the recipe's own "Photo" field, used on both `/recipes/new` and `/recipes/[id]/edit`. Supports click-to-browse and drag-and-drop onto the dashed box. Validates type (`image/jpeg`, `image/png`, `image/webp`) and size (≤ 5MB), shown inline as `validationError`.
2. **`src/features/recipes/components/ImportRecipeDialog.tsx`** — the "Upload a screenshot" tab inside the "Import from URL or photo" dialog (opened from `/recipes/new`). This is the AI-extraction flow: you upload a screenshot/photo of a recipe from somewhere else, Gemini reads it, and it pre-fills the form. Supports click-to-browse only (no drag-and-drop currently). Same validation rules, duplicated as a second copy of the same constants (there's a comment in the file acknowledging this: *"Mirrors RecipeImagePicker.tsx's own validation... a separate, small file input rather than reusing that component directly"*).

Both components currently do their own `ALLOWED_IMAGE_TYPES` / `MAX_FILE_SIZE_BYTES` checks inline, and both funnel a picked `File` into a small `processFile`/`handleScreenshotChange`-style function that's already structured to accept a `File` from more than one source (click or drag). Paste is a third source of the same thing, which is why this fits cleanly into the existing shape rather than needing a redesign.

Neither component currently listens for `paste` events. Nothing else in the app touches clipboard APIs.

## 3. Design

### 3.1 One shared validation helper (new, small)

Pull the duplicated type/size check into one place both components (and the new paste code) call:

**New file: `src/lib/imageFileValidation.ts`**

```ts
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;

// Returns an error message if the file fails validation, or null if it's fine.
export function validateImageFile(file: File): string | null {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        return 'Please choose a JPG, PNG, or WEBP image.';
    }
    if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
        return 'Image must be smaller than 5MB.';
    }
    return null;
}
```

`RecipeImagePicker.tsx` and `ImportRecipeDialog.tsx` both switch their inline checks to call this instead of keeping their own copies. This isn't a drive-by refactor — the paste feature needs this exact validation in a third place, so consolidating it now avoids a third copy of the same two constants and two error strings.

### 3.2 One shared paste hook (new)

**New file: `src/hooks/usePasteImageFile.ts`**

Returns an `onPaste` handler to attach directly to the focusable drop zone (a `<button>` in both pickers). Clicking the zone focuses it — the same click that opens the file browser — and Ctrl+V only does anything while that element has focus:

```ts
export function usePasteImageFile(onImage: (file: File) => void) {
    return useCallback(
        (event: ClipboardEvent<HTMLElement>) => {
            const file = extractImageFileFromClipboard(event.clipboardData);

            if (!file) {
                return; // not an image paste -- let normal text paste behave normally
            }

            event.preventDefault();
            onImage(file);
        },
        [onImage]
    );
}
```

with the extraction itself pulled into its own pure, unit-testable function (mirrors how this repo already isolates logic like `groupBySection` or `sectionedDrafts.ts` from the components that use them):

```ts
// src/lib/extractImageFileFromClipboard.ts
export function extractImageFileFromClipboard(clipboardData: DataTransfer | null): File | null {
    if (!clipboardData) return null;

    for (const item of clipboardData.items) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            return item.getAsFile();
        }
    }
    return null;
}
```

Why an element-scoped `onPaste` (not a `window`-level listener, and not `navigator.clipboard.read()`):

- It's the standard `ClipboardEvent`, triggered only by the user's own Ctrl+V — **no permission prompt**, unlike `navigator.clipboard.read()` which requires clipboard-read permission and user activation gymnastics.
- Attaching it directly to the drop-zone `<button>` (rather than `window`) means paste only fires while that specific box has focus — click the box, then paste, exactly like clicking into a text field before typing into it. This is the behavior you asked for instead of the initial "anywhere on the page" version.
- Broad browser support for `onPaste` on a focusable, non-editable element (Chrome, Edge, Firefox); worth a specific check on Safari since clipboard behavior has historically been the one area it lags.
- It only acts when the clipboard actually contains image data (`kind === 'file'` and an `image/*` type). Pasting text into the Title field, description, ingredient names, etc. is completely unaffected, both because those live outside this element and because the handler no-ops (no `preventDefault()`) when there's no image on the clipboard.

### 3.3 Why the dropzone had to become a `<div>` + a separate "browse" button

The first cut of this made the whole dropzone a `<button>` whose `onClick` opened the file browser (`inputRef.current?.click()`) *and* whose focus made paste work. That combination doesn't work in practice: clicking the box immediately pops the OS file-picker dialog, which steals focus from the page — so pasting only worked *after* cancelling that dialog, which isn't what "click the box, then paste" should feel like.

Fix: split the two actions apart.

- The dropzone itself becomes a plain `tabIndex={0}` `<div>` — focusable, drag-and-drop target, `onPaste` handler — but **no `onClick`**. Clicking anywhere on it just focuses it (the browser's normal behavior for a focusable element), ready for Ctrl+V immediately, no dialog involved.
- A small nested "browse" `<button>` inside the box is the only thing that opens the OS file picker (`inputRef.current?.click()`), same as before. It's a real `<button>`, so it keeps native keyboard support (Tab to it, Enter/Space to activate) for free.
- The paste event still bubbles from wherever focus actually is (including from inside that nested browse button) up to the outer `<div>`'s `onPaste`, so this doesn't need any extra wiring — a single `onPaste` on the container catches paste regardless of which descendant triggered it.

### 3.4 Wire it into `RecipeImagePicker.tsx`

- Replace the inline `ALLOWED_IMAGE_TYPES`/`MAX_FILE_SIZE_BYTES`/`processFile` body with a call to `validateImageFile`.
- Add:
  ```ts
  const handlePaste = usePasteImageFile(processFile);
  ```
  attached as `onPaste={handlePaste}` on the outer `<div>` described above (disabled -> `onPaste={undefined}` and `tabIndex={-1}`, matching how a native `disabled` button would behave).
- Copy: "Drag a photo here, or **browse**" (browse is the nested button) plus a second line "or click here, then paste (Ctrl+V)".

### 3.5 Wire it into `ImportRecipeDialog.tsx`

- Refactor `handleScreenshotChange` so the validation + `setScreenshotFile` logic lives in a small `processScreenshotFile(file: File)` function that both the file `<input onChange>` and the paste handler call (same pattern as `RecipeImagePicker`'s existing `processFile`).
- Same `<div>` + nested "Browse" `<button>` + `ref`-triggered hidden input restructure as `RecipeImagePicker`, replacing the old `<label>`-wraps-hidden-input pattern (a `<label>` isn't focusable itself, and the file input can't be focused while hidden — so there was nothing for `onPaste` to attach to under the old structure regardless of the click-steals-focus problem above).
- Add:
  ```ts
  const handleScreenshotPaste = usePasteImageFile(processScreenshotFile);
  ```
  attached as `onPaste={handleScreenshotPaste}` on that `<div>`. Scoped to the "Upload a screenshot" tab automatically, since it only renders while that tab is active and no screenshot is picked yet.
- Copy: "**Browse** for a photo" (browse is the nested button) plus "or click here, then paste (Ctrl+V)".

### 3.5 What does *not* change

- No new dependencies, no schema/DB changes, no new API routes.
- `RecipeImagePicker`'s and `ImportRecipeDialog`'s existing props/behavior (click, drag-and-drop, remove, submit flow) are unchanged — paste is purely additive, funneling into the exact same `onFileChange`/`onImage` callbacks that click and drag already use.
- No confirmation toast on a successful paste — the pasted photo appearing in the preview *is* the feedback, consistent with how drag-and-drop behaves today (no toast either). A failed paste (wrong type/too large) shows the same inline red `validationError`/`screenshotError` text that click and drag already produce.

## 4. Files touched

**New:**
- `src/lib/imageFileValidation.ts` (+ `imageFileValidation.test.ts`)
- `src/lib/extractImageFileFromClipboard.ts` (+ `extractImageFileFromClipboard.test.ts`)
- `src/hooks/usePasteImageFile.ts`

**Modified:**
- `src/features/recipes/components/RecipeImagePicker.tsx`
- `src/features/recipes/components/ImportRecipeDialog.tsx`

## 5. Testing plan

- **Unit tests** (`vitest`, following this repo's existing pattern of one `.test.ts` per pure `lib/` helper): `extractImageFileFromClipboard` against constructed `DataTransfer`-like objects (image item present / absent / non-image file present), and `validateImageFile` against the type/size boundary cases. These don't require simulating a real browser paste event — jsdom's `ClipboardEvent` doesn't reliably implement `clipboardData`, which is exactly why the extraction logic is split into a plain function the hook calls, rather than tested through the event itself.
- **Manual test** (needed either way — this is real OS clipboard + browser behavior that automated tests can't fully cover):
  1. Take a screenshot (or right-click → Copy image on any web image).
  2. Open `/recipes/new`, click the Photo box, then press Ctrl+V → photo should appear in the Photo field. Also confirm Ctrl+V does nothing if you *haven't* clicked the box first.
  3. Open "Import from URL or photo" → "Upload a screenshot" tab, click the dropzone, then press Ctrl+V → screenshot should appear, ready to submit for AI extraction.
  4. Confirm pasting plain text into Title/Description/ingredient fields still works normally (regression check that the global listener doesn't interfere).
  5. Try pasting a non-image (e.g. copied text, copied file from Explorer) while a photo box is showing → nothing should happen (no error, no change).
  6. Try pasting an oversized or wrong-format image (if you have one handy) → same inline validation error as today's drag-and-drop path.
- Run `npm run lint` and `tsc --noEmit` on the touched files before considering it done (per `CLAUDE.md`'s standing rule), plus `vitest run` for the new test files.

## 6. Risks / edge cases

- **Low risk overall** — additive, client-only, no new dependencies or permissions.
- If the clipboard contains *both* an image and other data (rare in practice — a straight OS screenshot or "Copy image" only puts image data on the clipboard), the image takes priority and `preventDefault()` stops any default text paste for that same event. This matches user intent in every realistic case, since there's nowhere else on either of these two screens an image paste could sensibly go.
- Safari's `paste` event support for images is solid in current versions; no special-casing planned, but worth a real check on Safari specifically if you use it, since clipboard behavior has historically been the one area where Safari lags Chrome/Firefox.
- This repo's `device_bash` (the tool this session uses to work on your files directly) has been down for the last few sessions, so implementation — if you'd like me to proceed — may need to go through the slower stage/edit/commit fallback plus a cloud-sandbox `npm ci` for lint/type-check/test verification, same as the last couple of fixes in this project.

## 7. Out of scope (flagging, not building)

- The recipe **detail/view page** (read-only, not a form) doesn't get paste support — there's no editable image field there.
- No visual "flash"/animation on successful paste beyond the image appearing — can add if you want extra feedback, but nothing else in this app does that for drag-and-drop either, so it'd be a new pattern rather than matching existing UX.
