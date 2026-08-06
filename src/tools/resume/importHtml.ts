// Parses an HTML file previously produced by buildStandaloneResumeHtml
// (exportHtml.ts) back into a Resume object, so a user can re-import a file
// they exported earlier (or one they hand-edited in a browser) as a new
// variation. Deliberately narrow: it only understands the exact structure
// exportHtml.ts emits (see the `data-reforge-resume="1"` marker check below)
// rather than trying to scrape arbitrary HTML resumes.

import { DEFAULT_SECTION_ICON, sanitizeThemeColor } from './exportHtml'
import { contactIcon } from './contactIcons'
import { newId } from './id'
import type {
  ContactItem,
  ContactType,
  Education,
  Job,
  Resume,
  SectionIcons,
  SkillGroup,
  TextItem,
  ToolGroup,
} from './types'

const DEFAULT_INK = '#1e2a38'
const DEFAULT_ACCENT = '#e07a3f'

const CONTACT_TYPES: ContactType[] = ['email', 'phone', 'location', 'linkedin', 'github', 'other']

function isContactType(value: string | null): value is ContactType {
  return value !== null && (CONTACT_TYPES as string[]).includes(value)
}

// Converts an element's markup back into plain text, turning <br>-family
// tags into literal newlines first so multi-line fields (e.g. the summary)
// round-trip correctly instead of losing their line breaks or keeping stray
// "<br>" text. Works on a detached clone so the live DOM is left untouched.
function elementTextWithLineBreaks(element: Element | null): string {
  if (!element) return ''
  const clone = element.cloneNode(true) as Element
  const breaks = Array.from(clone.querySelectorAll('br'))
  for (const br of breaks) {
    br.replaceWith(clone.ownerDocument.createTextNode('\n'))
  }
  return clone.textContent ?? ''
}

function textOf(element: Element | null): string {
  return element?.textContent?.trim() ?? ''
}

function parseTheme(doc: Document): { ink: string; accent: string } {
  const styleText = doc.querySelector('style')?.textContent ?? ''
  const inkMatch = styleText.match(/--ink:\s*([^;]+);/)
  const accentMatch = styleText.match(/--accent:\s*([^;]+);/)
  const ink = inkMatch ? inkMatch[1].trim() : DEFAULT_INK
  const accent = accentMatch ? accentMatch[1].trim() : DEFAULT_ACCENT
  return {
    ink: sanitizeThemeColor(ink, DEFAULT_INK),
    accent: sanitizeThemeColor(accent, DEFAULT_ACCENT),
  }
}

function parseContacts(root: Element): ContactItem[] {
  const items = Array.from(root.querySelectorAll('.contact-bar .contact-item'))
  return items.map((item) => {
    const typeAttr = item.getAttribute('data-contact-type')
    const type: ContactType = isContactType(typeAttr) ? typeAttr : 'other'
    const valueSpan = item.querySelector('span[contenteditable="true"]')
    const iconSpan = item.querySelector('span[data-icon="1"]')
    const icon = textOf(iconSpan)
    const contact: ContactItem = { type, value: textOf(valueSpan) }
    if (icon && icon !== contactIcon(type)) {
      contact.icon = icon
    }
    return contact
  })
}

// Reads a section's icon-badge glyph and only reports it as an override if
// it differs from that section's known default — keeping imported data clean
// instead of force-setting every slot in `sectionIcons`.
function parseSectionIcon(root: Element, section: keyof SectionIcons): string | undefined {
  const iconSpan = root.querySelector(`section[data-section="${section}"] > h2 > span[data-icon="1"]`)
  const icon = textOf(iconSpan)
  return icon && icon !== DEFAULT_SECTION_ICON[section] ? icon : undefined
}

function parseSectionIcons(root: Element): SectionIcons | undefined {
  const sections: (keyof SectionIcons)[] = ['skills', 'experience', 'tools', 'education', 'interests']
  const icons: SectionIcons = {}
  for (const section of sections) {
    const icon = parseSectionIcon(root, section)
    if (icon) icons[section] = icon
  }
  return Object.keys(icons).length > 0 ? icons : undefined
}

function parseBullets(container: Element): TextItem[] {
  const items = Array.from(container.querySelectorAll('li[data-bullet-id]'))
  return items.map((item) => ({
    id: item.getAttribute('data-bullet-id') || newId('bullet'),
    text: elementTextWithLineBreaks(item),
  }))
}

function parseSkills(root: Element): SkillGroup[] {
  const section = root.querySelector('section[data-section="skills"]')
  if (!section) return []
  const groups = Array.from(section.querySelectorAll('.skill-group'))
  return groups.map((group) => ({
    id: group.getAttribute('data-skill-group-id') || newId('skill'),
    title: textOf(group.querySelector('h3')),
    bullets: parseBullets(group),
  }))
}

function parseExperience(root: Element): Job[] {
  const section = root.querySelector('section[data-section="experience"]')
  if (!section) return []
  const jobs = Array.from(section.querySelectorAll('.job'))
  return jobs.map((job) => {
    const metaSpans = job.querySelectorAll('.job-meta span')
    const organization = metaSpans.length > 0 ? textOf(metaSpans[0]) : ''
    return {
      id: job.getAttribute('data-job-id') || newId('job'),
      title: textOf(job.querySelector('h3')),
      organization,
      dates: textOf(job.querySelector('.job-meta .dates')),
      bullets: parseBullets(job),
    }
  })
}

function parseTools(root: Element): ToolGroup[] {
  const section = root.querySelector('section[data-section="tools"]')
  if (!section) return []
  const groups = Array.from(section.querySelectorAll('.tool-group'))
  return groups.map((group) => ({
    id: group.getAttribute('data-tool-group-id') || newId('tool'),
    title: textOf(group.querySelector('h3')),
    description: elementTextWithLineBreaks(group.querySelector('p')),
  }))
}

function parseEducation(root: Element): Education {
  const section = root.querySelector('section[data-section="education"] .education')
  const thesisSpan = section?.querySelector('.edu-thesis span[contenteditable="true"]') ?? null
  const thesisText = thesisSpan ? elementTextWithLineBreaks(thesisSpan) : ''
  return {
    degree: textOf(section?.querySelector('.edu-degree') ?? null),
    school: textOf(section?.querySelector('.edu-school') ?? null),
    dates: textOf(section?.querySelector('.edu-dates') ?? null),
    gpa: textOf(section?.querySelector('.edu-gpa') ?? null),
    ...(thesisText ? { thesis: thesisText } : {}),
  }
}

function parseInterests(root: Element): TextItem[] {
  const section = root.querySelector('section[data-section="interests"]')
  if (!section) return []
  const items = Array.from(section.querySelectorAll('.tag[data-interest-id]'))
  return items.map((item) => ({
    id: item.getAttribute('data-interest-id') || newId('interest'),
    text: elementTextWithLineBreaks(item.querySelector('span[contenteditable="true"]')),
  }))
}

// Parses HTML text previously exported by buildStandaloneResumeHtml back
// into a Resume. Throws a descriptive Error if the input doesn't look like a
// file this app exported, or is missing structural pieces required to build
// a valid Resume (rather than returning a partial object that could crash
// downstream rendering).
export function parseResumeHtml(htmlText: string): Resume {
  const doc = new DOMParser().parseFromString(htmlText, 'text/html')
  const root = doc.querySelector('[data-reforge-resume="1"]')
  if (!root) {
    throw new Error('This file was not recognized as a Reforge resume export.')
  }

  const header = root.querySelector('.resume-header')
  if (!header) {
    throw new Error('This resume file is missing its header section and cannot be imported.')
  }

  const name = textOf(header.querySelector('h1'))
  const tagline = textOf(header.querySelector('.tagline'))
  const summary = elementTextWithLineBreaks(header.querySelector('.summary'))

  const sectionIcons = parseSectionIcons(root)

  return {
    header: { name, tagline, summary },
    contacts: parseContacts(root),
    skills: parseSkills(root),
    experience: parseExperience(root),
    tools: parseTools(root),
    education: parseEducation(root),
    interests: parseInterests(root),
    theme: parseTheme(doc),
    ...(sectionIcons ? { sectionIcons } : {}),
  }
}
