// Best-effort DOCX import: extracts raw text via mammoth and dumps it into
// a minimal Resume (see importText.ts) for the user to manually reorganize.
// Deliberately does not attempt structural parsing of arbitrary DOCX layouts.
import mammoth from 'mammoth'
import type { AiSettings } from './aiTailor'
import { structureResumeFromText } from './aiImport'
import { resumeFromExtractedText } from './importText'
import type { Resume } from './types'

export async function parseResumeDocx(
  arrayBuffer: ArrayBuffer,
  fallbackName: string,
  aiSettings?: AiSettings,
): Promise<Resume> {
  let text: string
  try {
    const result = await mammoth.extractRawText({ arrayBuffer })
    text = result.value
  } catch (error) {
    console.error('Failed to extract text from DOCX file', error)
    throw new Error('Could not read that DOCX file. It may be corrupted or in an unsupported format.')
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
