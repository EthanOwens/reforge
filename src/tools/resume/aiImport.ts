// AI-assisted structured resume import: given raw text extracted from a
// DOCX/PDF file (see importDocx.ts / importPdf.ts), ask the Anthropic
// Messages API to structure it into the app's Resume shape. Uses the same
// fetch pattern and error handling as aiTailor.ts's generateResumeSuggestions
// so the two "call Anthropic and parse the JSON response" paths stay
// consistent, even though the actual payloads they produce are different.
//
// Once we have *any* parsed JSON object back, we never throw — we tolerantly
// coerce whatever fields are present (with safe fallbacks for missing/
// malformed ones) into a fully-valid Resume, generating fresh ids for every
// list item exactly like defaultResume.ts's hand-written data does. Only
// request/parsing failures upstream of having real data throw, since that's
// what triggers the caller's fallback to the basic heuristic import.

import { defaultResume } from './defaultResume'
import { newId } from './id'
import type { AiSettings } from './aiTailor'
import type {
  ContactItem,
  ContactType,
  Education,
  Job,
  Resume,
  SkillGroup,
  TextItem,
  ToolGroup,
} from './types'

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'

const CONTACT_TYPES: ContactType[] = ['email', 'phone', 'location', 'linkedin', 'github', 'other']

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

function buildPrompt(rawText: string): string {
  return `You are helping import a resume into a structured format from raw text
that was extracted from a DOCX or PDF file (extraction may have lost some
formatting, so line breaks and spacing may be imperfect).

Here is the raw extracted text:

"""
${rawText}
"""

Extract the information in this resume into a single JSON object of this
exact shape (all fields are required, but use empty strings "" or empty
arrays [] for anything genuinely not present in the text — do not invent
information that is not in the source text):

{
  "header": { "name": "...", "tagline": "...", "summary": "..." },
  "contacts": [ { "type": "email" | "phone" | "location" | "linkedin" | "github" | "other", "value": "..." } ],
  "skills": [ { "title": "...", "bullets": ["...", "..."] } ],
  "experience": [ { "title": "...", "organization": "...", "dates": "...", "bullets": ["...", "..."] } ],
  "tools": [ { "title": "...", "description": "..." } ],
  "education": { "degree": "...", "school": "...", "dates": "...", "gpa": "...", "thesis": "..." },
  "interests": ["...", "..."]
}

Notes on the fields:
- "header.tagline" is a short line under the candidate's name (e.g. a job
  title or area of specialization), if one can be identified.
- "skills" bullets and "experience" bullets are plain strings, not objects.
- "tools" groups are categories of tools/technologies with a short
  "description" (e.g. a comma-separated list), not full bullet lists.
- "education.thesis" is optional — omit it or use "" if not present.
- "interests" is a plain array of short strings.

Respond with ONLY the single JSON object described above — no markdown code
fences, no commentary before or after.`
}

function coerceStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string')
}

function coerceTextItems(value: unknown, idPrefix: string): TextItem[] {
  return coerceStringArray(value).map((text) => ({ id: newId(idPrefix), text }))
}

function coerceContacts(value: unknown): ContactItem[] {
  if (!Array.isArray(value)) return []
  const contacts: ContactItem[] = []
  for (const entry of value) {
    if (!entry || typeof entry !== 'object') continue
    const candidate = entry as Record<string, unknown>
    if (!isNonEmptyString(candidate.value)) continue
    const type = CONTACT_TYPES.includes(candidate.type as ContactType)
      ? (candidate.type as ContactType)
      : 'other'
    contacts.push({ type, value: candidate.value })
  }
  return contacts
}

function coerceSkills(value: unknown): SkillGroup[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((candidate) => ({
      id: newId('skill'),
      title: isNonEmptyString(candidate.title) ? candidate.title : '',
      bullets: coerceTextItems(candidate.bullets, 'skill-bullet'),
    }))
}

function coerceExperience(value: unknown): Job[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((candidate) => ({
      id: newId('job'),
      title: isNonEmptyString(candidate.title) ? candidate.title : '',
      organization: isNonEmptyString(candidate.organization) ? candidate.organization : '',
      dates: isNonEmptyString(candidate.dates) ? candidate.dates : '',
      bullets: coerceTextItems(candidate.bullets, 'job-bullet'),
    }))
}

function coerceTools(value: unknown): ToolGroup[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is Record<string, unknown> => !!entry && typeof entry === 'object')
    .map((candidate) => ({
      id: newId('tool'),
      title: isNonEmptyString(candidate.title) ? candidate.title : '',
      description: isNonEmptyString(candidate.description) ? candidate.description : '',
    }))
}

function coerceEducation(value: unknown): Education {
  const candidate = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  const education: Education = {
    degree: isNonEmptyString(candidate.degree) ? candidate.degree : '',
    school: isNonEmptyString(candidate.school) ? candidate.school : '',
    dates: isNonEmptyString(candidate.dates) ? candidate.dates : '',
    gpa: isNonEmptyString(candidate.gpa) ? candidate.gpa : '',
  }
  if (isNonEmptyString(candidate.thesis)) {
    education.thesis = candidate.thesis
  }
  return education
}

function coerceResume(parsed: unknown, fallbackName: string): Resume {
  const root = (parsed && typeof parsed === 'object' ? parsed : {}) as Record<string, unknown>
  const headerCandidate = (root.header && typeof root.header === 'object' ? root.header : {}) as Record<
    string,
    unknown
  >

  return {
    header: {
      name: isNonEmptyString(headerCandidate.name) ? headerCandidate.name : fallbackName,
      tagline: isNonEmptyString(headerCandidate.tagline) ? headerCandidate.tagline : '',
      summary: isNonEmptyString(headerCandidate.summary) ? headerCandidate.summary : '',
    },
    contacts: coerceContacts(root.contacts),
    skills: coerceSkills(root.skills),
    experience: coerceExperience(root.experience),
    tools: coerceTools(root.tools),
    education: coerceEducation(root.education),
    interests: coerceTextItems(root.interests, 'interest'),
    theme: { ...defaultResume.theme },
  }
}

export async function structureResumeFromText(
  rawText: string,
  fallbackName: string,
  settings: AiSettings,
): Promise<Resume> {
  if (!settings.apiKey) {
    throw new Error('Missing API key. Add your Anthropic API key in the AI settings above.')
  }
  if (!settings.model) {
    throw new Error('Missing model. Enter a model id in the AI settings above.')
  }

  const promptText = buildPrompt(rawText)

  let response: Response
  try {
    response = await fetch(ANTHROPIC_MESSAGES_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': settings.apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: settings.model,
        max_tokens: 4096,
        messages: [{ role: 'user', content: promptText }],
      }),
    })
  } catch (error) {
    throw new Error(
      `Request failed: could not reach the Anthropic API (${error instanceof Error ? error.message : 'network error'}).`,
    )
  }

  if (!response.ok) {
    let apiMessage = ''
    try {
      const errorBody: unknown = await response.json()
      const message = (errorBody as { error?: { message?: unknown } })?.error?.message
      if (isNonEmptyString(message)) apiMessage = message
    } catch {
      // Ignore — fall back to just the status below.
    }
    throw new Error(
      `Request failed: ${response.status} ${response.statusText}${apiMessage ? ` — ${apiMessage}` : ''}`,
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error('Could not parse a structured resume from the response.')
  }

  const content = (data as { content?: unknown[] })?.content
  const textBlock = Array.isArray(content)
    ? (content.find((block) => (block as { type?: string })?.type === 'text') as
        | { type?: string; text?: unknown }
        | undefined)
    : undefined
  if (!textBlock || !isNonEmptyString(textBlock.text)) {
    throw new Error('Could not parse a structured resume from the response.')
  }

  const jsonText = stripCodeFences(textBlock.text)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Could not parse a structured resume from the response.')
  }

  return coerceResume(parsed, fallbackName)
}
