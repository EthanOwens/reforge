// Shared best-effort mapper from raw extracted text (from a DOCX or PDF
// file, which have no reliable structure to parse into individual resume
// fields) into a minimal Resume. Rather than attempting to guess at
// sections, jobs, or skills, this takes a single simple heuristic (first
// non-empty line is the name) and dumps everything else into the summary
// field as a starting point for the user to manually reorganize using the
// app's existing editing tools.
import { defaultResume } from './defaultResume'
import type { Resume } from './types'

export function resumeFromExtractedText(rawText: string, fallbackName: string): Resume {
  const lines = rawText.split(/\r\n|\r|\n/)
  const firstNonEmptyIndex = lines.findIndex((line) => line.trim() !== '')

  const name = firstNonEmptyIndex === -1 ? fallbackName : lines[firstNonEmptyIndex].trim() || fallbackName
  const summary =
    firstNonEmptyIndex === -1 ? '' : lines.slice(firstNonEmptyIndex + 1).join('\n').trim()

  return {
    header: {
      name,
      tagline: '',
      summary,
    },
    contacts: [],
    skills: [],
    experience: [],
    tools: [],
    education: {
      degree: '',
      school: '',
      dates: '',
      gpa: '',
    },
    interests: [],
    theme: {
      ink: defaultResume.theme.ink,
      accent: defaultResume.theme.accent,
    },
  }
}
