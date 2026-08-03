// AI-tailored resume suggestions: build a prompt from the current resume +
// a target job description, call the Anthropic Messages API directly from
// the browser (using a user-supplied API key — see aiSettings.ts), parse the
// model's response into a small, typed suggestion schema, and apply an
// accepted subset of those suggestions to produce a new (never mutated in
// place) Resume.

import type { AiSettings } from './aiSettings'
import { newId } from './id'
import type { Resume } from './types'

export type ResumeSuggestion =
  | { id: string; kind: 'replaceSummary'; newText: string; rationale: string }
  | { id: string; kind: 'replaceTagline'; newText: string; rationale: string }
  | { id: string; kind: 'replaceBullet'; bulletId: string; newText: string; rationale: string }
  | {
      id: string
      kind: 'addBullet'
      parentType: 'skill' | 'job'
      parentId: string
      newText: string
      rationale: string
    }

const ANTHROPIC_MESSAGES_URL = 'https://api.anthropic.com/v1/messages'

function buildPrompt(resume: Resume, jobTitle: string, jobDescription: string): string {
  return `You are helping tailor a resume for a specific job application.

Here is the candidate's current resume, as JSON (note the "id" fields — these
are stable identifiers you must reference exactly when proposing changes to
existing content):

${JSON.stringify(resume, null, 2)}

The candidate is applying for this job title: ${jobTitle || '(not specified)'}

Here is the full job description:

${jobDescription}

Propose 3-8 specific, high-value suggestions for tailoring this resume to the
job description. Do not attempt an exhaustive rewrite — only suggest changes
that meaningfully improve the resume's fit for this specific job.

Respond with ONLY a single JSON object (no markdown code fences, no
commentary before or after) of this exact shape:

{ "suggestions": [ ... ] }

Each entry in "suggestions" must be one of the following four shapes:

1. Replace the resume's summary paragraph:
   { "kind": "replaceSummary", "newText": "...", "rationale": "..." }

2. Replace the resume's tagline (the short line under the candidate's name):
   { "kind": "replaceTagline", "newText": "...", "rationale": "..." }

3. Replace the text of one existing bullet point (in a skill group or a job).
   "bulletId" MUST be one of the actual bullet "id" values found in the
   resume JSON above (inside a skill group's "bullets" array or a job's
   "bullets" array):
   { "kind": "replaceBullet", "bulletId": "...", "newText": "...", "rationale": "..." }

4. Add a brand-new bullet point to an existing skill group or job.
   "parentType" is "skill" if "parentId" is a skill group's "id" (from the
   resume's "skills" array), or "job" if "parentId" is a job's "id" (from the
   resume's "experience" array). "parentId" MUST be an actual id from the
   resume JSON above:
   { "kind": "addBullet", "parentType": "skill" | "job", "parentId": "...", "newText": "...", "rationale": "..." }

Every suggestion must include a short "rationale" explaining why it helps for
this specific job. Do not include any fields other than the ones listed
above. Return ONLY the JSON object, nothing else.`
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim()
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return fenceMatch ? fenceMatch[1].trim() : trimmed
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function normalizeSuggestion(raw: unknown): ResumeSuggestion | null {
  if (!raw || typeof raw !== 'object') return null
  const candidate = raw as Record<string, unknown>
  const rationale = isNonEmptyString(candidate.rationale) ? candidate.rationale : ''
  const id = newId('suggestion')

  switch (candidate.kind) {
    case 'replaceSummary':
      if (!isNonEmptyString(candidate.newText)) return null
      return { id, kind: 'replaceSummary', newText: candidate.newText, rationale }
    case 'replaceTagline':
      if (!isNonEmptyString(candidate.newText)) return null
      return { id, kind: 'replaceTagline', newText: candidate.newText, rationale }
    case 'replaceBullet':
      if (!isNonEmptyString(candidate.newText) || !isNonEmptyString(candidate.bulletId)) return null
      return {
        id,
        kind: 'replaceBullet',
        bulletId: candidate.bulletId,
        newText: candidate.newText,
        rationale,
      }
    case 'addBullet':
      if (
        !isNonEmptyString(candidate.newText) ||
        !isNonEmptyString(candidate.parentId) ||
        (candidate.parentType !== 'skill' && candidate.parentType !== 'job')
      ) {
        return null
      }
      return {
        id,
        kind: 'addBullet',
        parentType: candidate.parentType,
        parentId: candidate.parentId,
        newText: candidate.newText,
        rationale,
      }
    default:
      return null
  }
}

export async function generateResumeSuggestions(
  resume: Resume,
  jobTitle: string,
  jobDescription: string,
  settings: AiSettings,
): Promise<ResumeSuggestion[]> {
  if (!settings.apiKey) {
    throw new Error('Missing API key. Add your Anthropic API key in the AI settings above.')
  }
  if (!settings.model) {
    throw new Error('Missing model. Enter a model id in the AI settings above.')
  }

  const promptText = buildPrompt(resume, jobTitle, jobDescription)

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
        max_tokens: 2048,
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
    throw new Error('Could not parse a valid suggestion list from the response.')
  }

  const content = (data as { content?: unknown[] })?.content
  const textBlock = Array.isArray(content)
    ? (content.find((block) => (block as { type?: string })?.type === 'text') as
        | { type?: string; text?: unknown }
        | undefined)
    : undefined
  if (!textBlock || !isNonEmptyString(textBlock.text)) {
    throw new Error('Could not parse a valid suggestion list from the response.')
  }

  const jsonText = stripCodeFences(textBlock.text)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonText)
  } catch {
    throw new Error('Could not parse a valid suggestion list from the response.')
  }

  const rawSuggestions = (parsed as { suggestions?: unknown })?.suggestions
  if (!Array.isArray(rawSuggestions)) {
    throw new Error('Could not parse a valid suggestion list from the response.')
  }

  return rawSuggestions
    .map((entry) => normalizeSuggestion(entry))
    .filter((entry): entry is ResumeSuggestion => entry !== null)
}

export function applySuggestions(resume: Resume, suggestions: ResumeSuggestion[]): Resume {
  return suggestions.reduce<Resume>((current, suggestion) => {
    switch (suggestion.kind) {
      case 'replaceSummary':
        return { ...current, header: { ...current.header, summary: suggestion.newText } }

      case 'replaceTagline':
        return { ...current, header: { ...current.header, tagline: suggestion.newText } }

      case 'replaceBullet': {
        const hasBullet = (bullets: { id: string }[]) =>
          bullets.some((bullet) => bullet.id === suggestion.bulletId)

        if (
          !current.skills.some((group) => hasBullet(group.bullets)) &&
          !current.experience.some((job) => hasBullet(job.bullets))
        ) {
          return current
        }

        return {
          ...current,
          skills: current.skills.map((group) => ({
            ...group,
            bullets: group.bullets.map((bullet) =>
              bullet.id === suggestion.bulletId ? { ...bullet, text: suggestion.newText } : bullet,
            ),
          })),
          experience: current.experience.map((job) => ({
            ...job,
            bullets: job.bullets.map((bullet) =>
              bullet.id === suggestion.bulletId ? { ...bullet, text: suggestion.newText } : bullet,
            ),
          })),
        }
      }

      case 'addBullet': {
        const newBullet = { id: newId('bullet'), text: suggestion.newText }

        if (suggestion.parentType === 'skill') {
          if (!current.skills.some((group) => group.id === suggestion.parentId)) return current
          return {
            ...current,
            skills: current.skills.map((group) =>
              group.id === suggestion.parentId
                ? { ...group, bullets: [...group.bullets, newBullet] }
                : group,
            ),
          }
        }

        if (!current.experience.some((job) => job.id === suggestion.parentId)) return current
        return {
          ...current,
          experience: current.experience.map((job) =>
            job.id === suggestion.parentId ? { ...job, bullets: [...job.bullets, newBullet] } : job,
          ),
        }
      }

      default:
        return current
    }
  }, resume)
}
