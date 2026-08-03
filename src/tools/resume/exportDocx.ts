// Word (.docx) renderer for the resume — used by the "Export" toolbar action
// in ResumeTool.tsx. Mirrors the section ordering/skip-if-empty logic used by
// exportText.ts, but doesn't attempt to replicate the on-screen two-column
// layout or theme colors: a clean, linearly-ordered document with sensible
// heading levels and bold/italic emphasis is the bar here, not pixel parity.

import { Document, HeadingLevel, Packer, Paragraph, TextRun } from 'docx'
import type { Resume } from './types'

// Splits text on embedded newlines (possible from the on-screen textareas)
// into multiple TextRuns joined by explicit line breaks, since a raw LF
// inside a single <w:t> element isn't a valid OOXML line-break mechanism.
function textRuns(text: string): TextRun[] {
  return text.split('\n').flatMap((line, i) => (i === 0 ? [new TextRun({ text: line })] : [new TextRun({ text: line, break: 1 })]))
}

function bulletParagraph(text: string): Paragraph {
  return new Paragraph({
    children: textRuns(text),
    bullet: { level: 0 },
  })
}

function hasEducationContent(education: Resume['education']): boolean {
  return [education.degree, education.school, education.dates, education.gpa, education.thesis].some(
    (field) => field && field.trim(),
  )
}

export async function buildResumeDocxBlob(resume: Resume): Promise<Blob> {
  const children: Paragraph[] = []

  // --- Header: name, tagline, summary ---------------------------------
  if (resume.header.name.trim()) {
    children.push(
      new Paragraph({
        heading: HeadingLevel.TITLE,
        children: [new TextRun({ text: resume.header.name.trim() })],
      }),
    )
  }

  if (resume.header.tagline.trim()) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: resume.header.tagline.trim(), bold: true, size: 24 })],
      }),
    )
  }

  if (resume.header.summary.trim()) {
    children.push(new Paragraph({ children: textRuns(resume.header.summary.trim()) }))
  }

  // --- Contact line -----------------------------------------------------
  const contactLine = resume.contacts
    .map((contact) => contact.value.trim())
    .filter(Boolean)
    .join(' | ')
  if (contactLine) {
    children.push(new Paragraph({ text: contactLine }))
  }

  // --- Professional Skills ----------------------------------------------
  if (resume.skills.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: 'Professional Skills' }))
    for (const group of resume.skills) {
      children.push(new Paragraph({ children: [new TextRun({ text: group.title, bold: true })] }))
      for (const bullet of group.bullets) {
        if (bullet.text.trim()) children.push(bulletParagraph(bullet.text.trim()))
      }
    }
  }

  // --- Work Experience ----------------------------------------------------
  if (resume.experience.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: 'Work Experience' }))
    for (const job of resume.experience) {
      const meta = [job.organization.trim(), job.dates.trim() ? `(${job.dates.trim()})` : '']
        .filter(Boolean)
        .join(' ')
      const runs = [new TextRun({ text: job.title, bold: true })]
      if (meta) runs.push(new TextRun({ text: ` — ${meta}` }))
      children.push(new Paragraph({ children: runs }))
      for (const bullet of job.bullets) {
        if (bullet.text.trim()) children.push(bulletParagraph(bullet.text.trim()))
      }
    }
  }

  // --- Technical Tools ----------------------------------------------------
  if (resume.tools.length > 0) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: 'Technical Tools' }))
    for (const group of resume.tools) {
      const text = group.description.trim()
        ? `${group.title}: ${group.description.trim()}`
        : group.title
      children.push(new Paragraph({ text }))
    }
  }

  // --- Education ------------------------------------------------------------
  const { education } = resume
  if (hasEducationContent(education)) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: 'Education' }))
    if (education.degree.trim()) {
      children.push(new Paragraph({ children: [new TextRun({ text: education.degree.trim(), bold: true })] }))
    }
    const schoolLine = [education.school.trim(), education.dates.trim() ? `(${education.dates.trim()})` : '']
      .filter(Boolean)
      .join(' ')
    if (schoolLine) children.push(new Paragraph({ text: schoolLine }))
    if (education.gpa.trim()) children.push(new Paragraph({ text: education.gpa.trim() }))
    if (education.thesis && education.thesis.trim()) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Thesis: ${education.thesis.trim()}`, italics: true })],
        }),
      )
    }
  }

  // --- Interests ------------------------------------------------------------
  const interestsLine = resume.interests
    .map((interest) => interest.text.trim())
    .filter(Boolean)
    .join(', ')
  if (interestsLine) {
    children.push(new Paragraph({ heading: HeadingLevel.HEADING_1, text: 'Interests' }))
    children.push(new Paragraph({ text: interestsLine }))
  }

  const doc = new Document({
    sections: [{ children }],
  })

  return Packer.toBlob(doc)
}
