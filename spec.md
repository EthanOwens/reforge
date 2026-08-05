# Reforge — Resume Tool Suite: UI restructure, settings, landing page, and fixes

## Goal

Take the working Resume Tool Suite (editing, variations, 5 export formats, 3
import formats, AI-tailoring) and, per `planning.md`:

- Restructure its editing screen around a sidebar with "Files" (variations +
  export/import) and "AI-tailored" tabs, instead of the current inline
  toolbar rows.
- Add a settings system (a cog-wheel menu) with a "General" tab (an
  auto-fill-variation-name toggle) and a "Model API" tab (add/edit/delete
  named API keys, auto-detected by provider, each with an estimated
  accumulated cost).
- Introduce a real landing page and a new "Schema" concept: a schema is a
  named resume profile (its own base content) that owns a set of job-tailored
  variations, so the landing page can show "which resume profile do you want
  to work on" before "which tailored copy of it."
- Let the user click any section/contact icon in the resume preview and pick
  a different emoji for it from a small built-in set.
- Fix two real bugs: PDF export currently includes browser-injected chrome
  (title, page numbers, margins) because it's built on `window.print()`, and
  DOCX/PDF import currently just dumps raw text into one field instead of
  populating the resume's actual sections.

## Non-goals

- **`.gdoc` export** — dropped from this pass. A real `.gdoc` file is just a
  pointer to a document that must already exist in the user's Google Drive;
  producing one for real requires Google OAuth + Drive API calls, which is a
  first-time "the user has an account with an external service" dependency
  and a real architecture change. Not attempted here — flagged as its own
  future decision if wanted later.
- **The other README utilities** (Convert, Trim/restructure, gif/png tools)
  — still not built. The landing page reserves a visible slot for them (so
  the "choose between resume maker and other utility features" framing from
  `planning.md` is honored structurally) but that slot stays a disabled/
  "coming soon" placeholder; no utility logic behind it.
- **Any backend/server component** — still fully client-side. Cost tracking,
  API keys, schemas/variations all stay in this browser's `localStorage`.
- **Multi-provider AI-tailoring generation** — the *settings UI* supports
  saving/naming/deleting keys for multiple providers (for bookkeeping and
  cost tracking), but only an Anthropic key is actually used to generate
  suggestions or structure an import in this pass. Wiring OpenAI/others into
  the actual generation calls is not in scope.
- **Real-time/live pricing data** — no provider exposes a "this call cost
  $X" field in its API response (confirmed by checking how a prior project,
  `RuleExtraction`, handles this: it also computes cost from token usage via
  a maintained price table, just using a Python library (`litellm`) that has
  no browser equivalent). Cost figures here are estimates from a small,
  hand-maintained price table × real token usage, not authoritative billing
  data, and will drift as providers change pricing.

## Subtasks

1. **Settings modal: shell + General tab + Model API tab.** Add a cog-wheel
   button (bottom-left, always visible) that opens a settings modal with two
   tabs: "General" (a single toggle, "Auto-fill variation name," default on,
   persisted to a new `localStorage` settings key) and "Model API" (a list of
   saved API keys with an "Add provider" flow: paste a key into a
   censored/toggle-visibility text field, save it; on save, auto-detect the
   provider from the key's shape/prefix — e.g. Anthropic keys start
   `sk-ant-`, OpenAI keys start `sk-` — and label the entry
   `"<providerName> — API Key"`; support editing and deleting a saved key;
   show each saved key's accumulated estimated cost, starting at $0). Include
   a small hardcoded price-per-million-tokens table for a handful of current
   Anthropic models (used by subtask 2) and a documented "unknown model"
   fallback (still count tokens, just can't estimate a dollar figure — show
   "cost unknown" rather than silently showing $0). No wiring to the actual
   AI-tailoring call yet — that's subtask 2.

2. **Wire AI-tailoring to Settings-managed keys.** Remove the inline API
   key/model fields from the existing AI-tailoring panel; have it read the
   saved Anthropic key (and a model id — keep a model text field, but now
   sourced from/saved to the settings key entry rather than a separate local
   field) from the Settings store built in subtask 1. After each successful
   `generateResumeSuggestions` call, read the real `usage.input_tokens`/
   `usage.output_tokens` from the Anthropic response, look up that model in
   the price table, and add the computed cost (or mark "unknown" if the
   model isn't in the table) to that key's running total, persisted via
   Settings. If no Anthropic key is configured, disable "Get suggestions"
   with a message pointing at Settings instead of the old "fill in the key
   field" message.

3. **Data model: introduce the Schema hierarchy.** Add a `Schema` type
   (`{ id, name, variations: Variation[], activeVariationId }`) as a new
   layer above today's flat `Variation` list; top-level persisted state
   becomes `{ schemas: Schema[], activeSchemaId }`. Add `favorite?: boolean`
   to `Variation`. Write a migration in the storage-loading code that wraps
   any existing flat variations list (from before this change) into a single
   default `Schema` on first load, so no one's saved data disappears.
   Update `ResumeTool.tsx`'s internal state plumbing to operate against "the
   active schema's variations" instead of a flat top-level list. No new UI
   yet in this subtask — the app should keep working exactly as it does
   today (auto-selecting the sole/migrated schema), just backed by the new
   data shape underneath. This is intentionally a plumbing-only subtask so
   subtask 4 can build real navigation on top of a settled data model.

4. **Landing page + schema/variation navigation.** Build the actual
   navigation flow ahead of the editor: a landing screen offering "Resume
   Maker" (functional) and "Other Utilities" (visibly disabled/"coming
   soon" placeholder, per the non-goals above); choosing Resume Maker shows
   a grid of the user's schemas (each schema tile shows its name; a "new
   schema" tile starts one from the default resume content and prompts for
   a name); clicking a schema shows a grid/list of its variations, with a
   star/favorite toggle per variation and favorited ones pinned to a top
   row; clicking a variation opens the existing editor (`ResumeTool`'s
   current experience) scoped to that schema+variation. Wire `src/App.tsx`'s
   existing `screens` concept to support this multi-step flow (it was
   deliberately left generic in the original scaffold for exactly this kind
   of extension).

5. **Sidebar + tabs shell in the editor.** Inside the editor screen (reached
   via subtask 4's navigation), replace the current inline toolbar rows with
   a persistent sidebar containing two tabs: "Files" and "AI-tailored."
   Move the existing variation controls (selector/rename/job title/add/
   delete), export controls, and import control into the "Files" tab. Move
   the AI-tailoring panel (now simplified per subtask 2 — just the job
   description textarea and "Get suggestions" button/results, no inline
   key/model fields) into the "AI-tailored" tab. This subtask is UI
   relocation — behavior of the moved controls should be unchanged except
   where subtasks 6/7 explicitly change it.

6. **Files tab: combined auto-fill variation name.** Replace the separate
   "Name" (variation rename) and "Job title" text boxes with a single box
   showing `<firstName> <lastName> - <jobTitle>` (e.g.
   "Ethan Owens - Graphic Designer"), derived from the resume's
   `header.name` and the variation's `jobTitle`. When the General setting
   from subtask 1 ("Auto-fill variation name") is on, this box live-updates
   automatically whenever the underlying name or job title changes elsewhere
   in the editor (and is read-only or auto-syncing — user edits to name/
   title happen at the source fields, not in this box). When the toggle is
   off, this reverts to today's behavior: an independently-editable
   variation name box (decouple it from name/job-title changes). This name
   also drives export filenames, unchanged from the existing
   `buildResumeFilename`/`buildVariationLabel` convention.

7. **Files tab: export-on-select.** Change the export control from "pick a
   format in a dropdown, then click a separate Export button" to a single
   dropdown where choosing a format immediately triggers that export (no
   separate button). Applies to all five existing formats (HTML/TXT/MD/PDF/
   DOCX) unchanged in behavior otherwise.

8. **Emoji picker for section/contact icons.** Make each icon currently
   rendered from a fixed lookup (the five section-header icons — skills/
   experience/tools/education/interests — and the per-contact-type icons in
   the contact bar) clickable, opening a small popover with a curated set of
   ~20-40 resume-relevant emoji (no new dependency/library) to replace it.
   Persist the chosen override in the resume data (e.g. an optional
   `sectionIcons` map on `Resume` for the five section slots, and an
   optional `icon` field on each `ContactItem` for contact icons) so it
   round-trips through save/export/import like any other resume field, with
   a way to reset back to the default icon.

9. **Fix: PDF export via a real PDF-generation library, not the print
   dialog.** Replace the current `window.print()`-based PDF export with a
   library-based approach — capture the rendered resume and produce an
   actual downloadable `.pdf` file — so the output contains only the
   resume's content with no browser-injected title, page-number footer, or
   default margins. This directly fixes the reported bug (import notes an
   attached screenshot showing "reforge" and "1 of 1" chrome around the
   resume). Accept the trade-off that a screenshot-based PDF has
   non-selectable text and a larger file size compared to a hand-built
   vector PDF — building a full vector re-implementation of the two-column
   layout is out of proportion to this app's effort level.

10. **Fix: AI-assisted structured DOCX/PDF import.** When a saved Anthropic
    key exists (per Settings), extend the DOCX/PDF import path so that,
    instead of only doing today's "dump everything into the summary field"
    behavior, the extracted raw text is sent to the model with the resume
    JSON schema and asked to return a structured `Resume` (name, jobs,
    skills, bullets, education, etc.) — reusing the same
    validate-and-filter-malformed-entries approach already used for AI
    suggestions, so a partially-wrong model response can't crash the app.
    If no key is configured, or the AI call/parse fails for any reason, fall
    back to exactly today's existing heuristic (first non-empty line → name,
    rest → summary) rather than blocking the import — no new heuristic
    section-detection logic is being built; the "fallback" is today's
    already-shipped behavior.

## Key decisions

- **Schema = a new hierarchy level**, not a rename of "variation." A schema
  is a resume profile with its own base content; each schema owns its own
  list of job-tailored variations. Existing flat variation data is migrated
  into one default schema so nothing is lost.
- **`.gdoc` dropped.** A real one needs Google OAuth + Drive API, which is a
  first-time external-account dependency and out of proportion to this pass.
- **PDF export switches to a real generation library** (a screenshot-to-PDF
  approach, e.g. rendering the resume DOM to an image and embedding it in a
  PDF) instead of `window.print()`. Chosen over a hand-built vector PDF
  because re-implementing the two-column CSS layout in a PDF-drawing API is
  much more effort for comparatively little benefit here; the trade-off
  (non-selectable text, larger file) is accepted.
- **Import gets AI-assisted structuring with a fallback**, not hand-rolled
  heuristic section detection. Reuses the Anthropic key already required for
  AI-tailoring; degrades to today's existing simple text-dump behavior if no
  key is configured or the call fails, rather than blocking import or
  building a second, separate heuristic parser.
- **API cost tracking is an estimate**, computed from real token-usage
  numbers returned by the Anthropic API × a small hand-maintained price
  table in this codebase — not a value read directly from any API response,
  since no provider (Anthropic, OpenAI, or others) returns a dollar-cost
  field. Confirmed by checking how `RuleExtraction` does the equivalent: it
  also derives cost from tokens × a price table, just via a Python library
  with no browser equivalent.
- **Settings UI supports multiple providers for bookkeeping; only Anthropic
  actually generates.** Keeps this pass bounded — generalizing the actual
  AI call to multiple providers' request/response shapes is real, separate
  work not required to satisfy `planning.md`'s "add provider" UI ask.
- **Emoji picker is a small curated set, hand-rolled** — no new dependency.
  Covers the described use case (swap a handful of resume icons) without a
  full emoji-picker library's bundle/maintenance cost.
- **New schema starts from the existing default resume content**, prompting
  the user for a name — consistent with how creating a new variation already
  works today, just one level up.

## Open questions

- **Exact curated emoji list** (subtask 8) isn't chosen yet — can be decided
  during that subtask's implementation (a reasonable resume-relevant set:
  contact-type icons like phone/email/pin/link, plus general symbols for the
  five section headers and a handful of extras).
- **Anthropic model price table contents** (subtask 1) will need whatever
  models are current at implementation time — the table should be easy to
  extend, and should clearly mark any model not in the table as "cost
  unknown" rather than guessing.
- **Landing page visual design** (subtask 4) — no specific layout/mockup was
  discussed beyond the functional flow described above; implementor has
  latitude on presentation as long as the described navigation steps exist.

## Progress

- Subtask 1 (Settings modal: shell + General tab + Model API tab) done. Added `src/settings/settingsStore.ts` (localStorage-backed `AppSettings`/`ApiKeyEntry`), `providerDetection.ts`, `pricing.ts` (unused until subtask 2), `id.ts`, and `ApiKeyRow.tsx`/`SettingsModal.tsx`/`SettingsModal.css` implementing the cog button + modal with General/Model API tabs and full key CRUD. `App.tsx` renders the cog/modal as siblings of the active screen. Fixed: editing a key to a different value was carrying over the old key's accumulated cost/tokens; `saveAppSettings`'s failure return value wasn't checked (now surfaced via a warning banner); the "no usage yet" cost state was indistinguishable from a genuine $0.00 result (now reads "no usage yet"). No remaining concerns — `src/tools/resume/` untouched as intended.
- Subtask 2 (Wire AI-tailoring to Settings-managed keys) done. `aiTailor.ts` now returns `{ suggestions, usage }` exposing real Anthropic token usage; `App.tsx` threads `appSettings`/`onAppSettingsChange` into `ResumeTool` as the single source of truth; the AI panel's inline API-key field is gone, its model field now reads/writes the first saved Anthropic `ApiKeyEntry`, and each successful call accumulates real usage + an `estimateCostUsd` cost onto that key. Deleted the superseded `src/tools/resume/aiSettings.ts`. Fixed: the new required `ApiKeyEntry.model` field would have caused `isAppSettings` to reject and silently wipe any settings blob saved under the prior subtask (losing both the saved API key and the unrelated `autoFillVariationName` toggle) — added `withModelBackfill`, mirroring the existing `withJobTitleBackfill` pattern. No remaining concerns.
- Subtask 3 (Data model: introduce the Schema hierarchy) done — pure plumbing, no visible/behavioral change. Added `Schema`/`SchemasState` types in `variationsStorage.ts` (replacing `VariationsState`), with `Variation` gaining an optional `favorite?: boolean` (unused by any UI yet). A one-time migration wraps any pre-existing flat `{ activeId, variations }` data into a single default `Schema`, persisted under a new key so it only runs once. Every state-mutating handler in `ResumeTool.tsx` now goes through a new `updateActiveSchema` helper instead of writing to a flat top-level list. Reviewer found no bugs — no fixer pass needed. Exactly one schema exists and is auto-selected for now; the next subtask builds real schema navigation on top of this.
