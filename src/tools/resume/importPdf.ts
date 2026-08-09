// Best-effort PDF import: extracts raw text via pdf.js and dumps it into a
// minimal Resume (see importText.ts) for the user to manually reorganize.
// Deliberately does not attempt structural parsing of arbitrary PDF layouts.
import * as pdfjsLib from 'pdfjs-dist'
import pdfjsWorkerUrl from 'pdfjs-dist/build/pdf.worker.mjs?url'
import type { AiSettings } from './aiTailor'
import { structureResumeFromText } from './aiImport'
import { resumeFromExtractedText } from './importText'
import type { Resume } from './types'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorkerUrl

export async function parseResumePdf(
  arrayBuffer: ArrayBuffer,
  fallbackName: string,
  aiSettings?: AiSettings,
): Promise<Resume> {
  let text: string
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const doc = await loadingTask.promise
    const pageTexts: string[] = []
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
        .join('')
      pageTexts.push(pageText)
    }
    text = pageTexts.join('\n')
  } catch (error) {
    console.error('Failed to extract text from PDF file', error)
    throw new Error('Could not read that PDF file. It may be corrupted or in an unsupported format.')
  }

  if (aiSettings?.apiKey && aiSettings?.model) {
    try {
      return await structureResumeFromText(text, fallbackName, aiSettings)
    } catch (error) {
      console.error('AI-assisted structuring failed, falling back to basic text import', error)
    }
  }

  return resumeFromExtractedText(text, fallbackName)
}
