# Reforge — Polish pass: static resume renderer, PDF fix, thumbnails, and UI fixes

## Goal

Per the latest `planning.md` update (informed by the attached
`Ethan Owens Resume.pdf`, which confirms a real rendering bug, and a
`filesmith.io` screenshot for visual-polish direction):

- Fix PDF export, which currently produces garbled/clipped text and visible
  form-control chrome instead of a clean resume — root cause: `html2canvas`
  cannot reliably rasterize live `<input>`/`<textarea>` elements, which is
  what the current PDF capture points at.
- Give schema/variation tiles a real, live mini-preview of the actual resume
  they represent, in a page-like portrait card — not just a text label.
- Revert the Settings entry point back to a standalone floating cog button
  (undoing a merge into the left nav rail from a prior pass); the left rail
  goes back to being purely for contextual actions (open/rename/delete/
  export) shown when something is highlighted.
- Fix the main content area not following the app theme.
- Visual polish pass inspired by `filesmith.io`: a theme-aware dot-grid page
  background, and breathing room (margins/gaps) between the shell's three
  regions instead of an edge-to-edge layout.
- Replace the editor's flat "Export as" dropdown with a cascading
  Export ▸ Format menu.
- Fix a real regression: auto-fill variation naming doesn't apply when a
  variation is created via the schema/variation grid's own "+ New" tiles
  (only the deep editor's internal "+ New variation" button applies it).
- Fix dark-mode sidebar text contrast (too dim to read).
- Move the resume editor's sidebar from the left side to the right side.

## Non-goals

- **No image-based thumbnail generation/caching system.** Tile previews are
  a live, CSS-scaled render of the same data-driven component used
  elsewhere — always current, no async snapshot generation, no cache
  invalidation logic to maintain. This is a deliberate simplicity choice
  given the scope of this pass.
- **No redesign of the resume's own visual template** (header/two-column
  layout/colors) — the fix is about *how* it gets captured/rendered for
  PDF and thumbnails, not changing what it looks like.
- **No change to the resume's own ink/accent theming system** — still
  independent of the app-wide UI theme, per the existing established
  decision.
- **No new export formats** — still HTML/TXT/MD/PDF/DOCX; only the *menu
  presentation* for choosing one changes (subtask 7).
- **No general design system overhaul** — the `filesmith.io` reference is
  for spacing/background texture direction on the shell only, not a full
  restyle of every control in the app.

## Subtasks

1. **Revert Settings entry point to a floating cog button.** Remove the
   "Configurations" entry from the left nav rail (added in a prior pass);
   restore a standalone floating cog button (bottom-left, always visible,
   opens the same `SettingsModal`) as it existed before that merge. The nav
   rail's dedicated area goes back to being used *only* for contextual
   actions (open/rename/delete/export) when a schema or variation tile is
   highlighted — empty otherwise.

2. **Fix: main content area doesn't follow the app theme.** The shell's
   center content area (`app-shell-content`/`app-shell-main` or wherever the
   actual gap is) is missing a `background: var(--app-bg)`-style rule, so it
   stays a fixed color regardless of the selected theme. Find and fix the
   missing binding.

3. **Visual polish: dot-grid background + spaced three-panel shell layout.**
   Inspired by the attached `filesmith.io` screenshot: add a subtle,
   theme-aware dot-grid background to the page (dot color/opacity adapts
   per `data-app-theme`, using the existing `--app-*` variables), and give
   the shell's three regions (left nav rail, top ribbon, center content)
   visible breathing room — margins/gaps between them, each reading as a
   distinct rounded panel — instead of the current edge-to-edge layout.

4. **Build a shared static (read-only) resume renderer.** Create a new
   component (e.g. `StaticResumeView`) that renders a `Resume` object using
   the same visual structure/CSS classes as `ResumePreview.tsx` (header,
   contact bar, two-column body, section icons, tags) but with **no
   interactive elements** — plain text nodes instead of `<input>`/
   `<textarea>` for every editable field, and no clickable icon triggers.
   Takes `resume: Resume` only (no `onChange`, no editing state). This is
   the foundational piece both subtasks 5 and 6 build on: it gives
   `html2canvas` (subtask 6) markup it can actually rasterize correctly, and
   gives tiles (subtask 5) something real to render at a small scale.

5. **Schema/variation tiles: real live thumbnail previews.** Replace the
   current text-label tiles with a page-shaped (portrait, paper-like
   shadow/border) card containing a live, CSS-scaled-down render of
   `StaticResumeView` for that schema's/variation's actual resume content
   (for a schema tile, render its currently-active variation's resume). Use
   a fixed-size, `overflow: hidden` container with a CSS `transform: scale()`
   on the full-size static render — no image generation or caching, the
   thumbnail is always current because it's a live render of the real data.
   Keep the existing selection/highlight/double-click-to-open interaction
   model unchanged — only the tile's visual content changes.

6. **Fix: PDF export quality.** Point the existing `html2canvas`-based PDF
   capture (`exportPdf.ts`/`buildResumePdfBlob`) at an off-screen instance of
   `StaticResumeView` (rendered with the variation's actual resume + theme)
   instead of the live, editable `ResumePreview` DOM. This directly fixes
   the reported bug — clipped/truncated text, a garbled header glyph, and
   visible input/textarea chrome on tags — all symptoms of `html2canvas`
   failing to capture live form controls correctly. The resulting PDF
   should visually match the resume as shown in the app "exactly," per the
   bug report. The existing `.pdf-export-mode` CSS class/print-color-adjust
   handling still applies, now to genuinely static markup instead of fighting
   with form-control rendering quirks.

7. **Export menu: cascading "Export as ▸ Format" tree instead of a flat
   dropdown.** Replace the `<select>` + immediate-trigger-on-change export
   control in the editor's Files tab with a two-level menu: clicking
   "Export as" opens a submenu listing the five formats (HTML/TXT/MD/PDF/
   DOCX); clicking a format triggers that export immediately (same trigger
   behavior as today, just via a menu click instead of a `<select>` change
   event — this also resolves the keyboard-arrow-key-triggers-accidental-
   export risk flagged in an earlier pass, since a menu item click is an
   unambiguous deliberate action). No new dependency needed — plain React
   state (open/closed) + CSS is sufficient.

8. **Fix: auto-fill variation naming doesn't apply to grid-created
   variations.** The "+ New variation" tile in `ResumeMakerScreen.tsx`'s
   variations view (and the "+ New schema" tile's initial variation) name
   new variations with a hardcoded `Copy of <name>` / `'My Resume'` string,
   bypassing `buildAutoVariationName` entirely — so when
   `autoFillVariationName` is on, these grid-created variations don't get
   the `<firstName> <lastName> - <jobTitle>` treatment the deep editor's own
   "+ New variation" button already applies. Route both of `ResumeMakerScreen.tsx`'s
   creation paths through the same auto-fill-aware naming logic (checking
   `appSettings.autoFillVariationName`, matching the pattern already
   established in `ResumeTool.tsx`'s `handleAddVariation`/suggestion-apply
   paths).

9. **Fix: dark-mode sidebar text contrast.** The dark theme's
   `--app-text-muted` value is too dim against `--app-bg` in the resume
   editor's sidebar. Brighten it (adjust the value in `appTheme.css`'s
   `:root[data-app-theme='dark']` block, and the `system`-under-dark-OS-
   preference block, which currently duplicates the same values) to a
   clearly legible gray.

10. **Move the resume editor's sidebar to the right side.** In
    `ResumeTool.tsx`/`ResumeTool.css`, swap the layout so the Files/AI-
    tailored sidebar renders after (visually to the right of) the resume
    preview's main content area, instead of before/to the left of it.

## Key decisions

- **Thumbnails are live CSS-scaled renders, not generated/cached images.**
  Chosen over image-snapshot generation (which would need a trigger point,
  storage, and staleness/invalidation handling) — a live render is always
  correct by construction and reuses the same component built for the PDF
  fix, at the cost of rendering (a scaled, non-interactive) full resume
  markup per visible tile. Accepted given this app's data sizes (a handful
  of schemas/variations at a time, not hundreds).
- **One shared `StaticResumeView` component fixes both the PDF quality bug
  and powers the new thumbnails.** The PDF bug's root cause (`html2canvas`
  can't reliably rasterize live form controls) and the thumbnail feature's
  need (a real, small rendering of resume content) are solved by the same
  underlying piece: a non-interactive, pure-data rendering of a `Resume`.
- **Settings entry point reverts to a floating cog**, undoing the "merge
  into the nav rail" decision from the prior pass, per explicit new
  direction — the nav rail is purely for contextual per-selection actions
  now, with no permanently-present entries.
- **Export menu change is presentation-only** — the underlying export
  functions/logic (`exportVariationAs`, `buildResumePdfBlob`, etc.) are
  unchanged; only how the user picks a format changes, from a `<select>` to
  a cascading menu, which also incidentally fixes the earlier-known
  accidental-export-via-arrow-keys risk.

## Open questions

- **Exact dot-grid density/opacity/panel spacing values** (subtask 3) are
  left to implementation-time visual judgment, using `filesmith.io`'s
  screenshot as the general reference, not a pixel-exact target.
- **Thumbnail scale factor and tile aspect ratio** (subtask 5) — a
  reasonable portrait "page" proportion and a scale that keeps text
  legible-ish at a glance is the bar; exact numbers are an implementation
  call.
- **Whether schema tiles' thumbnails should show the schema's *active*
  variation specifically, or always its first variation** — leaning toward
  "active variation" since that's the one the user was last working in, but
  this is a minor judgment call for subtask 5's implementation.

## Progress
