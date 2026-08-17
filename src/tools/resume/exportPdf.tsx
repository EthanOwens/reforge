import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import StaticResumeView from './StaticResumeView'
import type { Resume } from './types'

// US Letter, in points (jsPDF's 'pt' unit), matching the old `@page { size:
// letter }` print rule.
export const PAGE_WIDTH_PT = 612
export const PAGE_HEIGHT_PT = 792

// Fixed pixel width the off-screen export container below is rendered at
// before being screenshotted. `.resume-page` only has a CSS `max-width`, so
// other code that needs to reason about how the page will actually wrap/lay
// out for export (e.g. the "may not fit on one page" heuristic in
// ResumeTool.tsx) should measure at this same width rather than trusting
// the live, possibly-narrower on-screen width.
export const EXPORT_REFERENCE_WIDTH_PX = 900

// Renders `resume` off-screen via `StaticResumeView`, captures it with
// html2canvas as a raster image, and wraps it in a single-page US Letter
// PDF. A dedicated off-screen static render (rather than capturing the live,
// editable `ResumePreview` DOM) is used because html2canvas can't reliably
// rasterize live form controls (inputs/textareas) — it previously produced
// clipped text, garbled glyphs, and visible input chrome.
//
// Screenshot-based rather than a hand-built vector PDF: the resulting text
// isn't selectable and the file is larger than a "real" PDF would be, but a
// full vector re-implementation of the two-column layout is out of
// proportion to this app's effort level.
export async function buildResumePdfBlob(resume: Resume): Promise<Blob> {
  const container = document.createElement('div')
  container.style.position = 'fixed'
  container.style.top = '0'
  container.style.left = '-10000px'
  container.style.width = `${EXPORT_REFERENCE_WIDTH_PX}px`
  // Explicit opaque background, independent of `document.body` (which,
  // via `index.css`, paints the app-wide UI theme's dot-grid background —
  // e.g. a tan/beige tone under the Parchment theme). This container has
  // no background of its own otherwise, so without this it's transparent
  // and shows whatever's behind it in the real page.
  container.style.backgroundColor = '#ffffff'
  document.body.appendChild(container)

  const root = createRoot(container)

  try {
    flushSync(() => {
      root.render(<StaticResumeView resume={resume} />)
    })

    const element = container.querySelector<HTMLElement>('.resume-page-backdrop')
    if (!element) {
      throw new Error('Failed to render resume for PDF export')
    }

    // `.resume-page-backdrop`'s BASE (non-pdf-export-mode) rule sets
    // `min-height: 100svh` — full viewport height — and a `--page-bg`
    // background that now follows the app-wide UI theme. The
    // `.pdf-export-mode` class (added below, in `onclone`) overrides both,
    // but that class is only ever added to html2canvas's CLONE, never to
    // this ORIGINAL element still sitting in the live, off-screen DOM.
    // Setting these directly here, via inline style on the original,
    // guarantees the element is already correctly sized/colored before
    // html2canvas does any measurement/cloning at all — not dependent on
    // the clone-only override applying to whatever html2canvas internally
    // uses to determine capture bounds.
    element.style.minHeight = '0'
    element.style.backgroundColor = '#ffffff'

    // Must stay in sync with `.pdf-export-mode .main-col`/`.side-col`'s
    // hardcoded `width: 62%`/`width: 38%` in ResumePreview.css — html2canvas
    // captures a DOM clone with that class applied (see the `onclone`
    // callback below), not the live grid-based layout, so deriving the
    // split from `getBoundingClientRect()` on the pre-clone DOM would
    // measure a layout that was never actually captured.
    const PDF_EXPORT_MAIN_COL_FRACTION = 0.62

    // Hardcoded rather than read from `getComputedStyle` at capture time:
    // `--paper`/`--ink-tint` (what `.resume-page`/`.side-col` actually
    // resolve to) are fixed, non-themeable values — never customized per
    // resume, never overridden by the app-wide UI theme — so there's no
    // upside to a live lookup, and a live lookup proved unreliable in
    // practice (previous attempts using `getComputedStyle` on `.main-col`/
    // `.resume-page` produced a stray colored band in the exported PDF,
    // most likely from CSS custom-property resolution not behaving
    // identically across the html2canvas clone boundary — never fully
    // isolated, so hardcoding sidesteps the whole class of bug instead).
    const MAIN_COL_COLOR = '#ffffff'
    const SIDE_COL_COLOR = '#f3f5f7'

    let canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      onclone: (clonedDocument) => {
        const clonedRoot = clonedDocument.querySelector<HTMLElement>('.resume-page-backdrop')
        clonedRoot?.classList.add('pdf-export-mode')
        // Force the backdrop to white via inline style (highest CSS
        // specificity, no dependency on the `.pdf-export-mode` class rule
        // or on `--page-bg`/`--app-surface` custom-property resolution
        // behaving identically inside html2canvas's clone) — this is the
        // capture's actual background and must never reflect the app-wide
        // UI theme (e.g. Parchment's tan surface color).
        if (clonedRoot) clonedRoot.style.backgroundColor = '#ffffff'
      },
    })

    // If the captured content is shorter than one full page, extend the
    // canvas downward (rather than stretching the DOM/CSS before capture,
    // which html2canvas handles unreliably for flex/grid layouts) by
    // painting solid color bands that continue the resume's two-column
    // pattern to the bottom of the page.
    //
    // The two-tone pattern is painted across the FULL extended canvas
    // FIRST, then the real captured content is drawn on top of it — rather
    // than painting only the "leftover" strip below `canvas.height` — so
    // there's no seam/gap math that can leave a sliver of the canvas
    // unpainted (canvas defaults to transparent, which doesn't composite
    // predictably once embedded in a PDF). Since the real captured image is
    // fully opaque, it simply overwrites the two-tone fill everywhere real
    // content exists, leaving the fill visible only below it.
    const targetHeight = canvas.width * (PAGE_HEIGHT_PT / PAGE_WIDTH_PT)
    if (canvas.height < targetHeight) {
      const extendedCanvas = document.createElement('canvas')
      extendedCanvas.width = canvas.width
      extendedCanvas.height = Math.ceil(targetHeight)
      const ctx = extendedCanvas.getContext('2d')

      if (ctx) {
        const splitX = canvas.width * PDF_EXPORT_MAIN_COL_FRACTION

        ctx.fillStyle = MAIN_COL_COLOR
        ctx.fillRect(0, 0, splitX, extendedCanvas.height)

        ctx.fillStyle = SIDE_COL_COLOR
        ctx.fillRect(splitX, 0, extendedCanvas.width - splitX, extendedCanvas.height)

        ctx.drawImage(canvas, 0, 0)

        canvas = extendedCanvas
      }
    }

    const imageData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({ unit: 'pt', format: 'letter' })

    const maxWidth = PAGE_WIDTH_PT
    const maxHeight = PAGE_HEIGHT_PT

    const aspectRatio = canvas.height / canvas.width

    let imageWidth = maxWidth
    let imageHeight = imageWidth * aspectRatio

    // A single-page PDF doesn't paginate long content (matching the old
    // print-based approach's implicit single-page assumption) — instead of
    // clipping an overflow, scale the whole image down to fit the page height.
    if (imageHeight > maxHeight) {
      imageHeight = maxHeight
      imageWidth = imageHeight / aspectRatio
    }

    // Fill the page with the resume's own paper color first (matching
    // `--paper`/the `.pdf-export-mode` backdrop override, both `#fff`). This
    // is now mostly a fallback safety net — the canvas extension above
    // already fills short-content leftover space with the matching
    // two-column pattern in the common case — kept in place to cover any
    // sub-pixel rounding sliver left unfilled around the placed image.
    pdf.setFillColor('#ffffff')
    pdf.rect(0, 0, PAGE_WIDTH_PT, PAGE_HEIGHT_PT, 'F')

    // Anchor to the top: the resume should start at the top of the page,
    // with any leftover vertical space (from content shorter than a full
    // page) pushed to the bottom rather than split evenly top-and-bottom.
    // Horizontal centering is kept as-is (not part of this fix).
    const x = (PAGE_WIDTH_PT - imageWidth) / 2
    const y = 0

    pdf.addImage(imageData, 'PNG', x, y, imageWidth, imageHeight)

    return pdf.output('blob')
  } finally {
    root.unmount()
    container.remove()
  }
}
