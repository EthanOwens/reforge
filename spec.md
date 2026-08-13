# Reforge — Theming, layout customization, and remaining polish fixes

## Goal

Per the latest `planning.md` update:

- Recolor the "off-white" theme into a warmer beige/parchment-paper palette.
- Give the resume editor's right sidebar its own floating box (peer to the
  nav rail/main panel), so the dot-grid background shows around it too.
- Replace the fixed "shrink 30%" idea with a real settings-driven control:
  a floating-box size slider, and a Spread vs. Compact layout mode, both in
  Settings → General.
- Add a Gruvbox Dark theme option.
- Make hover highlights theme-aware (several hover states are hardcoded to a
  light-gray color that looks wrong against dark themes).
- Default a new variation's Job Title from the resume's own header tagline
  instead of leaving it blank.
- Fix the PDF export's white border by removing the intentional page margin
  (full-bleed image).
- Move the "← Back to variations" button out of the deep editor's right
  sidebar and into the app shell's left nav rail, matching the pattern the
  schema/variation grid view already uses for its own Back button.
- Add a subtle dotted separator between each tab in the top ribbon.

## Non-goals

- **No ribbon/content panel split.** The top ribbon and center content area
  stay one combined floating box, as they are today — only the deep editor's
  right sidebar becomes a new, separate floating box.
- **No textured/paper-image parchment effect.** The beige/parchment theme
  change is colors only (CSS custom properties), not a background texture
  or image.
- **No change to the resume's own ink/accent theming system** — still
  independent of the app-wide UI theme.
- **No change to which controls live in the editor's right sidebar**, other
  than removing the Back button — Variation select/Name/Job title fields,
  +New/Delete variation, Export menu, Import, and the Files/AI-tailored tabs
  all stay exactly where they are.
- **No continuous sync between a variation's Job Title and the resume's
  tagline.** The tagline only supplies the *default* value at creation/import
  time — after that, Job Title remains its own independently-editable field
  (unrelated to `autoFillVariationName`, which governs the variation *name*,
  not this field).

## Subtasks

1. **Add a Gruvbox Dark theme.** Widen the `AppTheme` type/`APP_THEMES` list
   in `settingsStore.ts` to include `'gruvbox-dark'`, add a matching
   `:root[data-app-theme='gruvbox-dark']` block to `appTheme.css` using
   standard Gruvbox dark colors (bg `#282828`, fg `#ebdbb2`, etc. — exact
   shades are an implementation call, but should follow the well-known
   Gruvbox dark palette), and add it as an option in `SettingsModal.tsx`'s
   Style `<select>`.

2. **Recolor the off-white theme to a beige/parchment palette.** Change only
   the color values inside `appTheme.css`'s existing
   `:root[data-app-theme='off-white']` block (`--app-bg`, `--app-surface`,
   `--app-text`, `--app-text-muted`, `--app-border`, `--app-dot-color`) to
   warmer beige/parchment tones instead of the current neutral grays. Keep
   the `'off-white'` key/id and its label ("Off-white") in
   `SettingsModal.tsx` unchanged — this is a recolor, not a rename.

3. **Theme-aware hover highlights.** Add an `--app-hover` custom property to
   every theme block in `appTheme.css` (light, dark, off-white/parchment,
   gruvbox-dark, and the `system`-under-dark-OS-preference block), each set
   to a hover tint appropriate for that theme's `--app-bg`/`--app-surface`.
   Replace every hardcoded `#f3f5f7` hover background in the codebase
   (`AppShell.css`'s `.app-shell-nav-entry:hover` and
   `.app-shell-ribbon-tab:hover`, `ResumeTool.css`'s `.variation-btn:hover`
   and `.export-menu-item:hover`, `SettingsModal.css`'s
   `.settings-btn:hover`) with `var(--app-hover, #f3f5f7)`.

4. **Dotted separator between ribbon tabs.** Add a subtle dotted vertical
   line between adjacent `.app-shell-ribbon-tab` buttons in
   `AppShell.css` (e.g. a `border-left` with `border-style: dotted` on all
   but the first tab, themed via `--app-border` or similar).

5. **Add floating-box scale + layout-mode settings (data model).** Extend
   `AppSettings` in `settingsStore.ts` with two new fields:
   `floatingBoxScale: number` (default `1`, representing 100%) and
   `layoutMode: 'spread' | 'compact'` (default `'spread'`). Update
   `defaultAppSettings()`, `isAppSettings()`, and add a backfill function
   (following the existing `withAppThemeBackfill`/`withModelBackfill`
   pattern) so settings saved before these fields existed still load
   correctly instead of being discarded.

6. **Settings UI for floating-box scale + layout mode.** In
   `SettingsModal.tsx`'s General tab, add a range slider bound to
   `settings.floatingBoxScale` (reasonable min/max/step are an
   implementation call — e.g. roughly 60%–100%) and a two-option
   Spread/Compact control (radio buttons or a segmented control) bound to
   `settings.layoutMode`, both persisting through the existing
   `updateSettings` path.

7. **Apply floating-box scale + layout mode to the shell layout.** Plumb
   `floatingBoxScale`/`layoutMode` from `AppSettings` into the shell's CSS
   (e.g. a `--app-box-scale` custom property plus a `data-app-layout`
   attribute set on `<html>` alongside the existing `data-app-theme`
   attribute — check `App.tsx` for where `data-app-theme` is currently set
   and mirror that approach). Implement the two layout behaviors for the
   existing floating boxes (nav rail, main panel):
   - **Spread**: each box shrinks by the scale factor in place, within its
     existing grid/flex slot — more dot-grid becomes visible around each
     box individually, in its original position.
   - **Compact**: all boxes shrink by the scale factor and are pulled
     together near the center of the screen, with a small consistent gap
     between them, rather than staying spread across the full shell width.

8. **Give the resume editor's right sidebar its own floating box.** In
   `ResumeTool.tsx`/`ResumeTool.css`, restructure `.resume-tool-sidebar` so
   it's no longer nested inside the same panel as the resume preview —
   render it as a sibling floating box (same rounded/bordered/shadowed
   treatment as the nav rail and main panel, themed via the same
   `--app-surface`/`--app-border` variables) with visible dot-grid gap
   around it, and make it respect the scale/layout-mode behavior from
   subtask 7 the same way the other floating boxes do.

9. **Move "← Back to variations" into the left nav rail.** Thread
   `onNavContextChange` through from `ResumeMakerScreen.tsx` into
   `ResumeTool.tsx` (currently `ResumeTool` doesn't receive or use it), and
   add a `useEffect` there — mirroring the pattern already used in
   `ResumeMakerScreen.tsx` for the grid view's own Back button — that sets
   the shell's left nav rail to a single "← Back to variations" button
   calling the existing `onBack` prop, clearing it on unmount. Remove the
   Back button from `.resume-tool-sidebar`'s JSX; everything else in the
   sidebar (tabs, variation fields, export, import) stays as-is.

10. **Default Job Title from the resume's header tagline.** Wherever a
    variation is created with an empty `jobTitle` and there's no prior
    variation to inherit from — `ResumeMakerScreen.tsx`'s `handleNewSchema`
    (new schema's initial variation) and `ResumeTool.tsx`'s
    `handleImportFile` (imported resumes) — default `jobTitle` to the
    resume's `header.tagline` instead of `''`. Variation-copy paths that
    already inherit `jobTitle` from a source variation (`handleNewVariation`,
    `handleAddVariation`, `handleApplySuggestions`) are unaffected — they
    keep carrying over the existing value, per the non-goal above.

11. **Fix PDF export white border (full bleed).** In `exportPdf.tsx`,
    remove the intentional `MARGIN_PT` page margin so the captured resume
    image fills the full US Letter page edge-to-edge, updating the
    width/height/centering math accordingly (image sized to the full page
    dimensions rather than page-minus-margins).

## Key decisions

- **Floating-box sizing becomes a user-controlled setting, not a fixed
  30% shrink.** Chosen over a hardcoded value because a single fixed
  percentage doesn't fit every content size/monitor — a slider plus a
  Spread/Compact mode gives the user control while keeping today's layout
  as the default (scale `1`, `'spread'`).
- **Only the Back button moves to the left nav rail** (not the Files/
  AI-tailored tab switcher or other sidebar controls) — the narrowest
  reading of the planning note's own example, keeping this pass scoped
  rather than restructuring the whole sidebar's control placement.
- **Ribbon and content stay one combined floating box** — only a new 4th
  box (the editor's right sidebar) is added; the nav/ribbon/content
  structure itself isn't being re-split this pass.
- **Job Title default is a one-time seed from the tagline, not a live
  sync** — keeps the field's existing independent-edit behavior intact
  for every path except the two "starting from nothing" cases (brand-new
  schema, freshly imported file).
- **PDF fix is full bleed, per explicit direction** — no margin at all,
  rather than trying to preserve-but-even-out a margin.

## Open questions

- **Exact Gruvbox Dark hex values, hover-tint amounts per theme, dotted
  separator spacing, and slider min/max/step** are left to implementation-
  time judgment using standard references (e.g. the canonical Gruvbox
  palette) rather than pixel-exact specs.
- **Compact mode's exact centering/gap values** (subtask 7) are an
  implementation call — "pulled together near the center with a small
  gap" is the bar, not precise pixel numbers.

## Progress

- Subtask 1 (Add a Gruvbox Dark theme) done. Added `gruvbox-dark` to `AppTheme`/`APP_THEMES` in `settingsStore.ts`, a new `:root[data-app-theme='gruvbox-dark']` block in `appTheme.css` using the canonical Gruvbox dark palette, and a "Gruvbox Dark" option in `SettingsModal.tsx`'s Style select. Reviewer confirmed all seven theme custom properties are present with plausible contrast, and that `isAppSettings`/`withAppThemeBackfill` validate the new theme correctly via `APP_THEMES` generically. No fixer pass needed. No remaining concerns.
- Subtask 2 (Recolor the off-white theme to a beige/parchment palette) done. `appTheme.css`'s `off-white` block recolored to warm parchment tones (`--app-bg: #f2e8d5`, `--app-surface: #e8dabd`, `--app-text: #3a2f22`, `--app-text-muted: #5f4d35`, `--app-border: #d3bf99`, `--app-dot-color: rgba(58, 47, 34, 0.1)`); `--app-accent` and the `'off-white'` key/label left untouched per scope. Fixed: reviewer caught the initial `--app-text-muted` choice failed WCAG AA against both new backgrounds; fixer darkened it to `#5f4d35` (6.65:1/5.85:1 contrast, passing AA). Remaining: the unchanged blue `--app-accent` now looks visually mismatched against the warm palette (still legible, out of scope for this subtask, noted for a possible future pass).
- Subtask 3 (Theme-aware hover highlights) done. Added `--app-hover` to all 5 theme blocks in `appTheme.css` (light `#f3f5f7`, dark `rgba(255,255,255,0.06)`, off-white/parchment `#cfb886`, gruvbox-dark `#4a4540`, system-dark synced with `dark`); replaced the 5 hardcoded `#f3f5f7` hover backgrounds (`.app-shell-nav-entry`/`.app-shell-ribbon-tab` in `AppShell.css`, `.variation-btn`/`.export-menu-item` in `ResumeTool.css`, `.settings-btn` in `SettingsModal.css`) with `var(--app-hover, #f3f5f7)`. Fixed: reviewer caught the initial off-white (`#ecdfc4`, ~1.05-1.09:1 contrast) and gruvbox-dark (translucent, context-dependent) hover values were effectively invisible/inconsistent; fixer replaced both with opaque colors (`#cfb886` at 1.59:1/1.40:1, `#4a4540` at 1.56:1/1.22:1). No remaining concerns.
- Subtask 4 (Dotted separator between ribbon tabs) done. Added `.app-shell-ribbon-tab:not(:first-child) { border-left: 1px dotted var(--app-border, #ccc); }` in `AppShell.css`. Reviewer confirmed `:not()`'s specificity reliably wins over the earlier `border: none` shorthand and doesn't interfere with the active-tab underline indicator. No fixer pass needed. No remaining concerns (two purely cosmetic/subjective observations noted, not defects: separator sits slightly closer to the following tab, and also appears next to the two currently-disabled placeholder tabs).
- Subtask 5 (Add floating-box scale + layout-mode settings (data model)) done. Added `LayoutMode` type and `floatingBoxScale: number`/`layoutMode: LayoutMode` fields to `AppSettings` in `settingsStore.ts`, defaulting to `1`/`'spread'`. `isAppSettings()` validates both; new `withFloatingBoxSettingsBackfill` fills in defaults independently for missing/invalid values, wired into `loadAppSettings()`'s backfill chain. No UI/CSS consumes these yet, per scope. Reviewer traced all missing/invalid-value cases, confirmed backfill and validator use identical predicates, confirmed backfill chain order-independence, and confirmed all mutation call sites round-trip the new fields correctly (verified via `tsc --noEmit`). No fixer pass needed. No remaining concerns.
