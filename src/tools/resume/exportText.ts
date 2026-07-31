// Plain text and Markdown renderers for the resume — used by the "Export"
// toolbar action in ResumeTool.tsx. Both walk the same Resume data model and
// skip empty sections entirely rather than printing an empty heading.

import type { Resume } from './types'

function joinNonEmpty(lines: Array<string | null | undefined>, separator = '\n'): string {
  return lines.filter((line): line is string => Boolean(line && line.trim())).join(separator)
}

// --- Plain text -------------------------------------------------------------

export function resumeToPlainText(resume: Resume): string {
  const sections: string[] = []

  const headerLines = joinNonEmpty([
    resume.header.name,
    resume.header.tagline,
  ])
  if (headerLines) sections.push(headerLines)

  if (resume.header.summary.trim()) sections.push(resume.header.summary.trim())

  const contactLine = resume.contacts
    .map((contact) => contact.value.trim())
    .filter(Boolean)
    .join('  |  ')
  if (contactLine) sections.push(contactLine)

  if (resume.skills.length > 0) {
    const lines = ['PROFESSIONAL SKILLS']
    for (const group of resume.skills) {
      lines.push(group.title)
      for (const bullet of group.bullets) {
        if (bullet.text.trim()) lines.push(`  - ${bullet.text.trim()}`)
      }
    }
    sections.push(lines.join('\n'))
  }

  if (resume.experience.length > 0) {
    const lines = ['WORK EXPERIENCE']
    for (const job of resume.experience) {
      const meta = joinNonEmpty([job.organization, job.dates ? `(${job.dates})` : null], ' ')
      lines.push(meta ? `${job.title} — ${meta}` : job.title)
      for (const bullet of job.bullets) {
        if (bullet.text.trim()) lines.push(`  - ${bullet.text.trim()}`)
      }
    }
    sections.push(lines.join('\n'))
  }

  if (resume.tools.length > 0) {
    const lines = ['TECHNICAL TOOLS']
    for (const group of resume.tools) {
      lines.push(
        group.description.trim() ? `${group.title}: ${group.description.trim()}` : group.title,
      )
    }
    sections.push(lines.join('\n'))
  }

  const { education } = resume
  const hasEducation = [education.degree, education.school, education.dates, education.gpa, education.thesis].some(
    (field) => field && field.trim(),
  )
  if (hasEducation) {
    const lines = ['EDUCATION']
    if (education.degree.trim()) lines.push(education.degree.trim())
    const schoolLine = joinNonEmpty([education.school, education.dates ? `(${education.dates})` : null], ' ')
    if (schoolLine) lines.push(schoolLine)
    if (education.gpa.trim()) lines.push(education.gpa.trim())
    if (education.thesis && education.thesis.trim()) lines.push(`Thesis: ${education.thesis.trim()}`)
    sections.push(lines.join('\n'))
  }

  const interestsLine = resume.interests
    .map((interest) => interest.text.trim())
    .filter(Boolean)
    .join(', ')
  if (interestsLine) sections.push(`INTERESTS\n${interestsLine}`)

  return sections.join('\n\n')
}

// --- Markdown -----------------------------------------------------------------

export function resumeToMarkdown(resume: Resume): string {
  const sections: string[] = []

  if (resume.header.name.trim()) sections.push(`# ${resume.header.name.trim()}`)
  if (resume.header.tagline.trim()) sections.push(`**${resume.header.tagline.trim()}**`)
  if (resume.header.summary.trim()) sections.push(resume.header.summary.trim())

  const contactLine = resume.contacts
    .map((contact) => contact.value.trim())
    .filter(Boolean)
    .join(' | ')
  if (contactLine) sections.push(contactLine)

  if (resume.skills.length > 0) {
    const lines = ['## Professional Skills']
    for (const group of resume.skills) {
      lines.push(`**${group.title}**`)
      for (const bullet of group.bullets) {
        if (bullet.text.trim()) lines.push(`- ${bullet.text.trim()}`)
      }
    }
    sections.push(lines.join('\n'))
  }

  if (resume.experience.length > 0) {
    const lines = ['## Work Experience']
    for (const job of resume.experience) {
      lines.push(job.organization.trim() ? `**${job.title}** — ${job.organization}  ` : `**${job.title}**  `)
      if (job.dates.trim()) lines.push(`_${job.dates.trim()}_`)
      for (const bullet of job.bullets) {
        if (bullet.text.trim()) lines.push(`- ${bullet.text.trim()}`)
      }
    }
    sections.push(lines.join('\n'))
  }

  if (resume.tools.length > 0) {
    const lines = ['## Technical Tools']
    for (const group of resume.tools) {
      lines.push(
        group.description.trim()
          ? `- **${group.title}:** ${group.description.trim()}`
          : `- **${group.title}**`,
      )
    }
    sections.push(lines.join('\n'))
  }

  const { education } = resume
  const hasEducation = [education.degree, education.school, education.dates, education.gpa, education.thesis].some(
    (field) => field && field.trim(),
  )
  if (hasEducation) {
    const lines = ['## Education']
    if (education.degree.trim()) lines.push(`**${education.degree.trim()}**  `)
    const schoolLine = joinNonEmpty([education.school, education.dates ? `(${education.dates})` : null], ' ')
    if (schoolLine) lines.push(`${schoolLine}  `)
    if (education.gpa.trim()) lines.push(`${education.gpa.trim()}  `)
    if (education.thesis && education.thesis.trim()) lines.push(`_Thesis: ${education.thesis.trim()}_`)
    sections.push(lines.join('\n'))
  }

  const interestsLine = resume.interests
    .map((interest) => interest.text.trim())
    .filter(Boolean)
    .join(', ')
  if (interestsLine) sections.push(`## Interests\n\n${interestsLine}`)

  return sections.join('\n\n') + '\n'
}
