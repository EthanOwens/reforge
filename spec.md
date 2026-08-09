# Reforge — App shell redesign, theming, and API key mask fix

## Goal

Per the latest `planning.md` update (and `reforge_gui.png`'s wireframe):

- Replace the current full-page-swap navigation (landing page → schema grid
  → variation grid, each a separate screen takeover) with a persistent
  three-region app shell: a left **Navigation** rail (global nav + settings
  entry, plus context-sensitive actions for whatever's selected in the
  center), a top **tool ribbon** (Resume Maker / placeholder utility tabs,
  highlighting whichever tool is active), and a center **content area**
  showing the active tool's current view (schema grid, then variation grid).
  Clicking a schema/variation tile selects and highlights it (showing
  rename/open/delete/... actions in the left rail); double-clicking (or the
  rail's "open" action) navigates in. A "Back" rail entry appears once
  you're inside a schema's variation view. Clicking a ribbon tab always
  returns to that tool's home view.
- Add an app-wide UI theme setting (Settings → General): light, dark,
  off-white, or system, affecting the app's own chrome only.
- Fix the API key display in Settings → Model API to show the provider's
  identifying prefix (e.g. `sk-ant-`) instead of trailing characters, so a
  glance at the masked value still tells you which provider it's for.

## Non-goals

- **The resume editor itself is untouched.** Opening a variation still takes
  you to today's existing full-screen editor (its own Files/AI-tailored
  sidebar tabs, its own "Back to variations" button) — the new nav-rail/
  ribbon shell wraps only the schema-grid and variation-grid browsing
  screens, not the deep editor. This was an explicit scope decision: folding
  the editor into the persistent shell too is real, separate work not
  requested here.
- **No real "Utility" tool functionality.** The ribbon's non-Resume-Maker
  tabs stay visible, disabled placeholders — same non-goal as before, just
  relocated from the old landing page's tile into the new ribbon.
- **The resume preview's own theming is untouched.** The new app-wide style
  setting (light/dark/off-white/system) only affects the app's UI chrome
  (nav rail, ribbon, modals, buttons). The resume preview keeps using its
  existing, independent per-resume ink/accent color system — a resume's
  printed appearance shouldn't change because the app's UI theme changed.
- **Schema-level "export" is not being added.** `reforge_gui.png` shows
  rename/open/delete/export as schema-tile actions, but export doesn't map
  cleanly onto a schema (which holds multiple variations). Only
  rename/open/delete are wired at the schema level; export becomes a
  variation-level action instead (where it already makes sense and reuses
  existing export logic).

## Subtasks

1. **App shell primitives: nav rail + top ribbon + content area.** Build the
   new persistent layout replacing `LandingScreen.tsx`'s role: a left
   Navigation rail (a "Configurations" entry, always present, opening the
   existing `SettingsModal` — replacing the standalone floating cog button
   so there's one settings entry point, not two) and an empty slot for
   context-sensitive content (filled in by subtasks 2–3); a top ribbon
   listing tools (`Resume Maker`, plus visually-disabled placeholder tabs
   for future utilities) with none highlighted and the center content area
   empty on first load; clicking `Resume Maker` highlights it and shows its
   home view in the center. Clicking an already-active ribbon tab returns to
   that tool's home view regardless of how deep you'd navigated. This
   subtask can land with the center content area showing a placeholder for
   Resume Maker's home view — the real schema grid is subtask 2.

2. **Resume Maker home view: schema grid with selection + rail actions.**
   Move the schema-grid browsing screen (currently `ResumeMakerScreen.tsx`'s
   `'schemas'` step) into the shell's center content area. Clicking a schema
   tile selects/highlights it (does not navigate) and populates the left
   rail with `Rename`, `Open`, and `Delete` actions for that schema.
   Double-clicking a tile (or using the rail's `Open` action) navigates into
   that schema's variation view (subtask 3). `Rename` and `Delete` are new
   functionality — schema rename/delete don't exist yet. Deleting a schema
   needs the same "keep at least one" or equivalent safety consideration
   already established for variations (decide during implementation whether
   schemas can go to zero or must always have at least one — lean toward
   allowing zero schemas with a clear empty state, since a user might
   legitimately want to delete their only schema and start fresh, but this
   is a judgment call for the implementor).

3. **Variations view: tile grid with selection + rail actions + back
   navigation.** Move the variation-grid browsing screen (currently
   `ResumeMakerScreen.tsx`'s `'variations'` step, including the existing
   favorites-row/star-toggle behavior) into the shell's center content area,
   reached by opening a schema per subtask 2. Clicking a variation tile
   selects/highlights it and populates the left rail with `Rename`, `Open`,
   `Delete`, and `Export` actions (reusing the existing rename/delete logic
   already built, and the existing favorite-star toggle stays on each tile
   as before). `Export` reuses the export logic already built in the
   editor (`ResumeTool.tsx`'s `handleExport`/format-specific builders) —
   factor out whatever's needed so it can be triggered from this
   rail-action context without fully opening the editor first (e.g. a small
   format-choice affordance in the rail, or a lightweight shared export
   helper module both the editor and this view call into). Double-clicking a
   tile (or the rail's `Open` action) navigates into the full `ResumeTool`
   editor for that variation, unchanged. While in this view, the left rail
   shows a `Back` entry that returns to the schema grid (subtask 2).

4. **App-wide UI theme setting.** Add a "Style" control to Settings →
   General with four options: `light`, `dark`, `off-white`, `system`.
   Implement via a root-level attribute (e.g. `data-app-theme` on `<html>`
   or the app's top-level element) driving CSS custom properties for the
   app chrome's surface/text/border colors — nav rail, ribbon, modals
   (including `SettingsModal` itself), and buttons outside the resume
   preview. `off-white` uses grays `#EAEAEA` and `#D5D5D5` (exact shades/
   roles — background vs. surface vs. border — are an implementation
   judgment call within that palette). `system` follows the OS/browser's
   `prefers-color-scheme` (mapping to light or dark); live-updating if the
   OS preference changes while the app is open is a nice-to-have, not
   required. Persist the choice in `AppSettings` (default: `system`).

5. **Fix: API key masking shows the provider prefix, not trailing
   characters.** In `src/settings/ApiKeyRow.tsx`'s `maskKey`, change the
   masked display from `••••••1234` (trailing characters visible) to
   showing the identifying prefix (e.g. `sk-ant-`) followed by a few dots
   and an ellipsis truncation (e.g. `sk-ant-•••…`), so the masked value
   still indicates which provider it belongs to at a glance, matching how
   `detectProvider` already recognizes these same prefixes. The "reveal
   full key" toggle behavior is unaffected — this only changes the masked
   (default) display.

## Key decisions

- **Editor screen stays separate from the new shell.** Confirmed with the
  user: folding the already-built editor (with its own Files/AI-tailored
  sidebar) into the persistent nav-rail/ribbon shell is out of scope here.
- **Schema-level actions are rename/open/delete only — no export.**
  Confirmed with the user: export becomes a variation-level action instead,
  where it maps cleanly onto "export this one resume."
- **The new theme setting affects app chrome only, not the resume preview.**
  Confirmed with the user: the resume's own ink/accent theming (built
  earlier) is independent and shouldn't change based on the app's UI theme.
- **The standalone floating cog button is replaced by a "Configurations"
  entry in the new left nav rail** — one settings entry point, matching the
  wireframe's literal layout, rather than keeping both.
- **Single-click selects/highlights a tile and shows rail actions;
  double-click (or the rail's "Open" action) navigates in** — matches
  `planning.md`'s explicit "double clicking will open the schema as well"
  phrasing, implying a single click alone does not navigate.
- **Variation-level export reuses existing export logic** rather than
  duplicating it — whatever refactor is needed to call it from outside the
  editor is in scope for subtask 3, but building a second, parallel export
  implementation is not.

## Open questions

- **Schema deletion's "can it go to zero" behavior** (subtask 2) is left as
  an implementor judgment call — see that subtask's note. Either answer is
  reasonable; whichever is chosen should have a sensible empty-state UI if
  zero schemas is allowed.
- **Exact off-white palette beyond the two named grays** (`#EAEAEA`,
  `#D5D5D5`) — which chrome elements use which shade, and what accent/
  border colors pair with them — is left to implementation-time judgment
  within subtask 4.
- **Whether "system" theme live-updates on OS preference change** while the
  app is already open is a nice-to-have, not a requirement — fine to ship
  without it if it adds meaningful complexity.

## Progress

- Subtask 1 (App shell primitives: nav rail + top ribbon + content area) done. Added `AppShell.tsx`/`AppShell.css` — left nav rail with "Configurations" entry (sole settings entry point now) + reserved empty context slot, top tool ribbon (Resume Maker enabled, two disabled placeholder tabs), center content area. `App.tsx` simplified to just render `<AppShell>`; deleted the now-superseded `LandingScreen.tsx`/`.css`. Reviewer found no issues — no fixer pass needed. Remaining: `ResumeMakerScreen.tsx`'s internal step logic untouched (subtasks 2–3); re-clicking the already-active tool tab is currently a no-op, deferred reset-to-home behavior intentionally left for a later subtask.
- Subtask 2 (Resume Maker home view: schema grid with selection + rail actions) done. Added schema Rename/Delete (new functionality) and a nav-context channel (`onNavContextChange`) letting `ResumeMakerScreen` populate the shell's left rail with Rename/Open/Delete for a highlighted schema; single-click highlights, double-click (or rail Open) navigates in; also fixed the previously-deferred "re-click active ribbon tab" no-op via a `resetKey` remount. Fixed 3 reviewer findings: deleting the last schema left "zero schemas" as only transient (the very next reload/tab-reclick would silently reseed a default resume with no indication) — relaxed `isSchemasState` to accept an empty `schemas` array as legitimate; `activeSchemaId` was left dangling after deleting the last schema — now falls back to `''`; schema tiles lost their keyboard "open" equivalent — added `onKeyDown` matching the existing variation-tile pattern. No remaining concerns.
