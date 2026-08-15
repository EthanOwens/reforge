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

    // Must stay in sync with `.pdf-export-mode .main-col`/`.side-col`'s
    // hardcoded `width: 62%`/`width: 38%` in ResumePreview.css — html2canvas
    // captures a DOM clone with that class applied (see the `onclone`
    // callback below), not the live grid-based layout, so deriving the
    // split from `getBoundingClientRect()` on the pre-clone DOM would
    // measure a layout that was never actually captured.
    const PDF_EXPORT_MAIN_COL_FRACTION = 0.62

    // Look up the live `.main-col`/`.side-col` background colors so the
    // canvas extension below (for resumes shorter than one page) can
    // reproduce the two-column pattern without hardcoding colors that could
    // drift out of sync with ResumePreview.css. (Unlike the split fraction
    // above, these colors match between the live DOM and the html2canvas
    // clone, so measuring them here is safe.)
    const mainColElement = element.querySelector<HTMLElement>('.main-col')
    const sideColElement = element.querySelector<HTMLElement>('.side-col')

    let mainColColor = '#ffffff'
    let sideColColor = '#f3f5f7'

    if (mainColElement && sideColElement) {
      mainColColor = getComputedStyle(mainColElement).backgroundColor
      sideColColor = getComputedStyle(sideColElement).backgroundColor
    }

    let canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      onclone: (clonedDocument) => {
        const clonedRoot = clonedDocument.querySelector('.resume-page-backdrop')
        clonedRoot?.classList.add('pdf-export-mode')
      },
    })

    // If the captured content is shorter than one full page, extend the
    // canvas downward (rather than stretching the DOM/CSS before capture,
    // which html2canvas handles unreliably for flex/grid layouts) by
    // painting solid color bands that continue the resume's two-column
    // pattern to the bottom of the page.
    const targetHeight = canvas.width * (PAGE_HEIGHT_PT / PAGE_WIDTH_PT)
    if (canvas.height < targetHeight) {
      const extendedCanvas = document.createElement('canvas')
      extendedCanvas.width = canvas.width
      extendedCanvas.height = Math.ceil(targetHeight)
      const ctx = extendedCanvas.getContext('2d')

      if (ctx) {
        ctx.drawImage(canvas, 0, 0)

        const splitX = canvas.width * PDF_EXPORT_MAIN_COL_FRACTION
        const remainingY = canvas.height
        const remainingHeight = extendedCanvas.height - canvas.height

        ctx.fillStyle = mainColColor
        ctx.fillRect(0, remainingY, splitX, remainingHeight)

        ctx.fillStyle = sideColColor
        ctx.fillRect(splitX, remainingY, canvas.width - splitX, remainingHeight)

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
    // two-column pattern in the common case — kept in place for when
    // `.main-col`/`.side-col` aren't found, or to cover any sub-pixel
    // rounding sliver left unfilled.
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
