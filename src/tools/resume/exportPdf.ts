import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// US Letter, in points (jsPDF's 'pt' unit), matching the old `@page { size:
// letter }` print rule.
const PAGE_WIDTH_PT = 612
const PAGE_HEIGHT_PT = 792
const MARGIN_PT = 25 // ~0.35in, matching the old `@page { margin: 0.35in }`

// Captures `element` (expected to be the resume's `.resume-page-backdrop`
// root) as a raster image and wraps it in a single-page US Letter PDF.
// Screenshot-based rather than a hand-built vector PDF: the resulting text
// isn't selectable and the file is larger than a "real" PDF would be, but a
// full vector re-implementation of the two-column layout is out of
// proportion to this app's effort level.
export async function buildResumePdfBlob(element: HTMLElement): Promise<Blob> {
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

  const maxWidth = PAGE_WIDTH_PT - MARGIN_PT * 2
  const maxHeight = PAGE_HEIGHT_PT - MARGIN_PT * 2

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
  const y = MARGIN_PT

  pdf.addImage(imageData, 'PNG', x, y, imageWidth, imageHeight)

  return pdf.output('blob')
}
