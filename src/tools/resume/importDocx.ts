// Best-effort DOCX import: extracts raw text via mammoth and dumps it into
// a minimal Resume (see importText.ts) for the user to manually reorganize.
// Deliberately does not attempt structural parsing of arbitrary DOCX layouts.
import mammoth from 'mammoth'
import { resumeFromExtractedText } from './importText'
import type { Resume } from './types'

export async function parseResumeDocx(arrayBuffer: ArrayBuffer, fallbackName: string): Promise<Resume> {
  let text: string
  try {
    const result = await mammoth.extractRawText({ arrayBuffer })
    text = result.value
  } catch (error) {
    console.error('Failed to extract text from DOCX file', error)
    throw new Error('Could not read that DOCX file. It may be corrupted or in an unsupported format.')
  }

  return resumeFromExtractedText(text, fallbackName)
}
