import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { flushSync } from 'react-dom'
import { createRoot } from 'react-dom/client'
import StaticResumeView from './StaticResumeView'
import type { Resume } from './types'

// US Letter, in points (jsPDF's 'pt' unit), matching the old `@page { size:
// letter }` print rule.
const PAGE_WIDTH_PT = 612
const PAGE_HEIGHT_PT = 792

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
  container.style.width = '900px'
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

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      onclone: (clonedDocument) => {
        const clonedRoot = clonedDocument.querySelector('.resume-page-backdrop')
        clonedRoot?.classList.add('pdf-export-mode')
      },
    })

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

    const x = (PAGE_WIDTH_PT - imageWidth) / 2
    const y = (PAGE_HEIGHT_PT - imageHeight) / 2

    pdf.addImage(imageData, 'PNG', x, y, imageWidth, imageHeight)

    return pdf.output('blob')
  } finally {
    root.unmount()
    container.remove()
  }
}
