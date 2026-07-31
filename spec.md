# Reforge — Resume Tool Suite (first slice)

## Goal

Turn the current static scaffold into a real Vite + React app, and build the
first working tool inside it: a resume editor/tailoring suite. A user should
be able to start from a built-in resume template, edit it section by section,
save multiple named variations (e.g. per job application), switch between
them in one webview, and export/import in HTML, TXT, MD, PDF, and DOCX. This
supersedes the throwaway `index.html` / `style.css` / `script.js` scaffold.

Everything runs client-side in the browser — no backend, no accounts, no
server-side file processing. Data persists per-browser via `localStorage`.

The visual/UX design comes from an existing Claude-artifact resume template
(single-file HTML/CSS/vanilla-JS prototype with contenteditable fields,
localStorage "copies," and export/import already working end to end). That
artifact is the *design and behavior reference*, not code to paste in: this
plan re-implements it as data-driven React components backed by a resume
JSON schema, so resume content lives in app state rather than scattered
across the DOM. That's what makes variations, structured import, and the
later AI-tailoring feature tractable.

## Non-goals

- The other README utilities (generic Convert, Trim/restructure, add-text-to-gif,
  PNG-transparency) — not part of this slice. The app shell should not be
  over-generalized into a plugin framework to anticipate them; just don't
  paint this slice into a corner that makes adding a second tool later hard.
- Any backend/server component, hosting/deployment setup, or user accounts —
  everything stays client-side and per-browser for now.
- Cross-device sync of saved variations — `localStorage` only.
- Porting the artifact's own vanilla-JS implementation verbatim (its
  contenteditable DOM-scraping approach, its hand-rolled OOXML zip builder,
  its ad hoc localStorage scheme). It's reference material for layout, CSS,
  and feature behavior only.
- Fully building out AI-tailored recommendations. It's included as the final
  subtask per the README, but the exact mechanism (bring-your-own API key vs.
  invoking local Claude Code vs. both) is still open — see Open Questions.

## Subtasks

1. **Scaffold Vite + React app.** Replace the static `index.html` /
   `style.css` / `script.js` scaffold with a Vite + React project
   (TypeScript). Basic `App` shell that renders a single "Resume" screen for
   now, structured so a second tool could be added later without a rewrite
   (e.g. a simple top-level route/screen concept), but don't build out a
   plugin system — just don't hardcode resume-specific assumptions into the
   app shell itself.

2. **Resume data schema + default content.** Define the resume data shape
   (header: name/tagline/summary; contacts list; skill groups; jobs;
   tool groups; education; interest tags) and a default/sample resume
   matching the artifact's placeholder copy. This is the single source of
   truth all later subtasks read/write.

3. **Static preview rendering.** Build the React component tree that renders
   the schema read-only, porting the artifact's CSS (two-column layout, header
   band, contact bar, sidebar) into the new project. No editing yet — just
   confirms the data model and visual port are correct.

4. **Inline editing + repeatable groups.** Make text fields editable
   (bound to state, not raw contenteditable DOM scraping) and add add/remove
   controls for repeatable groups (skill categories + their bullets, jobs +
   their bullets, tool categories, interest tags), mirroring the artifact's
   add/remove affordances.

5. **Accent color customization.** Port the artifact's two color pickers
   (accent/ink) as state-driven CSS custom properties.

6. **Variation management.** Save/rename/delete/switch between named resume
   variations in `localStorage`, keyed off the schema (not raw HTML), with a
   selector UI so switching is instant in the same webview.

7. **Filename convention utility.** A shared function that builds
   export/save filenames as `<firstName> <lastName> <fileType> - <jobTitle>.<fileFormat>`
   from the current resume data + a chosen job title, used by every
   export/save action from here on.

8. **Export: HTML, TXT, MD.** Standalone still-editable HTML export, plus the
   plain-text and Markdown renderers (port the logic/shape of the artifact's
   `toPlainText`/`toMarkdown`, adapted to read from React state).

9. **Export: PDF.** Print-flow export (print-specific CSS ported from the
   artifact, triggering the browser print dialog) — no external PDF library
   needed.

10. **Export: DOCX.** Real DOCX generation via a proper client-side library
    (e.g. the `docx` npm package) from the resume schema — replacing the
    artifact's hand-rolled OOXML/zip approach with a maintained library.

11. **Import: HTML.** Parse an HTML file previously exported by this app back
    into the resume schema (structured field extraction, not just
    re-injecting raw markup), creating a new variation from it.

12. **Import: DOCX, PDF.** Best-effort text extraction (e.g. mammoth.js for
    DOCX, pdf.js for PDF) mapped into the resume schema fields where
    possible, with a defined fallback (e.g. dump unmatched text into the
    summary field) when structure can't be confidently recovered.

13. **AI-tailored recommendations (final subtask).** Accept a job
    description/link + title, generate suggested edits, present them as
    accept/reject choices, and apply confirmed choices into a new variation
    named via the filename convention. Exact generation mechanism to be
    decided before this subtask starts (see Open Questions) — do not start
    this subtask until that's resolved.

## Key decisions

- **First slice = Resume Tool Suite**, not the generic Convert/Trim utilities.
  It's the most fully-specified feature in the README and has a working
  design reference already.
- **Client-side only, no backend.** Keeps hosting trivial and avoids standing
  up infra for a first slice; revisit if AI-tailoring ends up requiring a
  server-mediated API key.
- **Vite + React (TypeScript)**, replacing the vanilla scaffold. Better fit
  for a stateful multi-section editor with repeatable groups and multiple
  saved variations than plain DOM scripting.
- **All five formats (HTML/TXT/MD/PDF/DOCX) in scope now**, both export and
  import, rather than staging PDF/DOCX for later.
- **Re-architect the reference artifact as data-driven components** rather
  than embedding its vanilla JS/contenteditable DOM as-is. Chosen because the
  AI-tailoring feature (and structured import) need resume content as
  addressable data, not text buried in the DOM.
- **Resume template source**: the existing Claude artifact
  (`claude.ai/code/artifact/5dcba4f4-5c05-45c5-9321-0d554eb2c8b5`) is the
  design/behavior reference for layout, styling, and the feature set
  (contenteditable-style editing, named copies, export/import) — not code to
  paste in verbatim.

## Open questions

- **AI-tailoring mechanism** (subtask 13): user-supplied frontier-model API
  key, invoking local Claude Code to tweak a variation, or both? User noted
  "probably both is ideal" but this needs its own design discussion before
  that subtask is implemented — including whether it forces a reconsideration
  of the "client-side only" decision (a user-supplied API key called directly
  from the browser is exposed; a server-mediated call would need a backend).
- **DOCX/PDF import fidelity**: best-effort mapping is accepted as a known
  limitation, but the exact fallback UX (how partial/failed parses are
  surfaced to the user) isn't decided yet — can be resolved during subtask 12.
- **Deployment/hosting target** for the finished app hasn't been discussed —
  not blocking for local development, but will matter once this is ready to
  share.

## Progress

- Subtask 1 (Scaffold Vite + React app) done — commit `6225c8f9a3e3321372100750ab4d1a5644799aa8` "setup scaffolding for vite and react".
- Subtask 2 (Resume data schema + default content) done — commit `9e7816a477d452bd117258f5fd58a15b5f76aa64` "Setup resume data schema".
- Subtask 3 (Static preview rendering) done — commit `d2857effadcb94a050c61dc6095a512889f7c01d` "ported a resume schema as a static view to add functionality to later".
- Subtask 4 (Inline editing + repeatable groups) done — commit `e26339ff4dca8498c079a646ad92c2fe938408c5` "Added in line formatted editing for schemas".
