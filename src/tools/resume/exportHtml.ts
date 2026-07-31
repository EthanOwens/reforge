// Builds a complete, self-contained, still-editable HTML export of a resume.
// The file has no JavaScript: all visual styling is baked into an embedded
// <style> block (with the resume's actual theme colors baked in as literal
// values), and every text-bearing element is `contenteditable="true"` so the
// file can be opened directly in a browser and edited in place, then saved
// again ("Save Page As") or printed to PDF from there.
//
// The markup intentionally mirrors ResumePreview.tsx's structure/class names
// (`.resume-page`, `.body-grid`, `.main-col`/`.side-col`, `.skill-group`,
// `.job`, `.tool-group`, etc.) and tags each repeatable block with a
// `data-*` id, since a later subtask re-imports this exact HTML format back
// into the app.

import { contactIcon } from './contactIcons'
import type { ContactItem, Education, Job, Resume, SkillGroup, ToolGroup } from './types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// Escapes text and turns embedded newlines into <br> so multi-line fields
// (the summary, in particular, since it's edited via a textarea) survive the
// round trip into static HTML.
function textToHtml(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br>')
}

function editableSpan(value: string, className?: string): string {
  const classAttr = className ? ` class="${className}"` : ''
  return `<span${classAttr} contenteditable="true">${textToHtml(value)}</span>`
}

function renderContact(contact: ContactItem): string {
  return `      <li class="contact-item" data-contact-type="${escapeHtml(contact.type)}">
        <span aria-hidden="true">${escapeHtml(contactIcon(contact.type))}</span>
        ${editableSpan(contact.value)}
      </li>`
}

function renderSkillGroup(group: SkillGroup): string {
  const bullets = group.bullets
    .map((bullet) => `          <li contenteditable="true" data-bullet-id="${escapeHtml(bullet.id)}">${textToHtml(bullet.text)}</li>`)
    .join('\n')
  return `        <div class="skill-group" data-skill-group-id="${escapeHtml(group.id)}">
          <h3 contenteditable="true">${textToHtml(group.title)}</h3>
          <ul>
${bullets}
          </ul>
        </div>`
}

function renderJob(job: Job): string {
  const bullets = job.bullets
    .map((bullet) => `          <li contenteditable="true" data-bullet-id="${escapeHtml(bullet.id)}">${textToHtml(bullet.text)}</li>`)
    .join('\n')
  return `        <article class="job" data-job-id="${escapeHtml(job.id)}">
          <h3 contenteditable="true">${textToHtml(job.title)}</h3>
          <p class="job-meta">
            ${editableSpan(job.organization)}
            <span class="dates" contenteditable="true">${textToHtml(job.dates)}</span>
          </p>
          <ul>
${bullets}
          </ul>
        </article>`
}

function renderToolGroup(group: ToolGroup): string {
  return `        <div class="tool-group" data-tool-group-id="${escapeHtml(group.id)}">
          <h3 contenteditable="true">${textToHtml(group.title)}</h3>
          <p contenteditable="true">${textToHtml(group.description)}</p>
        </div>`
}

function renderEducation(education: Education): string {
  const thesis = education.thesis
    ? `          <p class="edu-thesis"><span class="thesis-label">Thesis: </span>${editableSpan(education.thesis)}</p>\n`
    : ''
  return `        <div class="education">
          <p class="edu-degree" contenteditable="true">${textToHtml(education.degree)}</p>
          <p class="edu-school" contenteditable="true">${textToHtml(education.school)}</p>
          <p class="edu-dates" contenteditable="true">${textToHtml(education.dates)}</p>
          <p class="edu-gpa" contenteditable="true">${textToHtml(education.gpa)}</p>
${thesis}        </div>`
}

const EMBEDDED_STYLE_TEMPLATE = `
    :root {
      --ink: __INK__;
      --accent: __ACCENT__;
      --paper: #ffffff;
      --page-bg: #e9ebef;
      --text: #2b2f36;
      --text-muted: #6b7280;
      --border: #e3e5e9;
      --ink-tint: #f3f5f7;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      background: var(--page-bg);
      font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
    }

    .resume-page {
      max-width: 900px;
      margin: 24px auto 60px;
      background: var(--paper);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: 0 12px 34px rgba(20, 24, 32, 0.14);
      color: var(--text);
    }

    .resume-header {
      background: var(--ink);
      color: #fff;
      padding: 38px 44px 30px;
    }

    .resume-header h1 {
      margin: 0;
      font-size: 34px;
      font-weight: 700;
      letter-spacing: 0.3px;
    }

    .resume-header .tagline {
      margin: 6px 0 16px;
      font-size: 14.5px;
      font-weight: 600;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: var(--accent);
    }

    .resume-header .summary {
      margin: 0;
      max-width: 62ch;
      font-size: 13.5px;
      line-height: 1.6;
      color: #d7dbe1;
    }

    .contact-bar {
      background: var(--accent);
      color: #fff;
      display: flex;
      flex-wrap: wrap;
      gap: 22px;
      padding: 12px 44px;
      font-size: 12.5px;
      font-weight: 600;
      list-style: none;
      margin: 0;
    }

    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      white-space: nowrap;
    }

    .body-grid {
      display: grid;
      grid-template-columns: 1.62fr 1fr;
    }

    .main-col {
      padding: 32px 30px 40px 44px;
    }

    .side-col {
      padding: 32px 34px 40px 26px;
      background: var(--ink-tint);
      border-left: 1px solid var(--border);
    }

    .block {
      margin-bottom: 30px;
    }

    .block:last-child {
      margin-bottom: 0;
    }

    .block > h2 {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 0 16px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: var(--ink);
    }

    .main-col .block > h2 .icon-badge {
      background: var(--accent);
    }

    .side-col .block > h2 .icon-badge {
      background: var(--ink);
    }

    .icon-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      flex: none;
      font-size: 12px;
      line-height: 1;
      color: #fff;
    }

    .skill-group {
      margin-bottom: 14px;
    }

    .skill-group:last-child {
      margin-bottom: 0;
    }

    .skill-group h3 {
      margin: 0 0 4px;
      font-size: 13.5px;
      font-weight: 700;
      color: var(--text);
    }

    .skill-group ul {
      margin: 0;
      padding-left: 18px;
    }

    .skill-group li {
      font-size: 12.8px;
      line-height: 1.55;
      color: var(--text);
      margin-bottom: 2px;
    }

    .job {
      margin-bottom: 22px;
    }

    .job:last-child {
      margin-bottom: 0;
    }

    .job h3 {
      margin: 0;
      font-size: 14.5px;
      font-weight: 700;
    }

    .job .job-meta {
      margin: 2px 0 8px;
      font-size: 12.3px;
      font-weight: 600;
      color: var(--accent);
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: baseline;
    }

    .job .job-meta .dates {
      color: var(--text-muted);
      font-weight: 600;
    }

    .job ul {
      margin: 0;
      padding-left: 18px;
    }

    .job li {
      font-size: 12.8px;
      line-height: 1.6;
      margin-bottom: 3px;
    }

    .side-col ul {
      margin: 0;
      padding-left: 16px;
    }

    .side-col li {
      font-size: 12.6px;
      line-height: 1.7;
    }

    .tool-group {
      margin-bottom: 14px;
    }

    .tool-group:last-child {
      margin-bottom: 0;
    }

    .tool-group h3 {
      margin: 0 0 2px;
      font-size: 13px;
      font-weight: 700;
      color: var(--text);
    }

    .tool-group p {
      margin: 0;
      font-size: 12.2px;
      line-height: 1.5;
      color: var(--text-muted);
    }

    .edu-degree {
      font-size: 13.2px;
      font-weight: 700;
      margin: 0 0 2px;
    }

    .edu-school {
      font-size: 12.4px;
      color: var(--text-muted);
      margin: 0 0 2px;
    }

    .edu-dates {
      font-size: 11.6px;
      color: var(--text-muted);
      margin: 0 0 6px;
    }

    .edu-gpa {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      margin: 0 0 6px;
    }

    .edu-thesis {
      font-size: 11.4px;
      line-height: 1.55;
      color: var(--text-muted);
      margin: 0;
      font-style: italic;
    }

    .edu-thesis .thesis-label {
      font-style: normal;
      font-weight: 700;
      color: var(--text);
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      font-size: 11.6px;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 14px;
      background: #fff;
      border: 1px solid var(--border);
      color: var(--text);
    }

    [contenteditable='true'] {
      border-radius: 4px;
      outline: none;
    }

    [contenteditable='true']:hover {
      background: rgba(127, 127, 127, 0.12);
    }

    [contenteditable='true']:focus {
      background: rgba(127, 127, 127, 0.18);
      box-shadow: 0 0 0 1px var(--accent);
    }

    @media screen and (max-width: 720px) {
      .body-grid {
        grid-template-columns: 1fr;
      }

      .side-col {
        border-left: none;
        border-top: 1px solid var(--border);
      }
    }
`

// Guards against untrusted/malformed theme values (e.g. a hand-edited
// localStorage entry or a future import path) breaking out of the embedded
// <style> block. Falls back to the app's default theme colors when a value
// isn't a plausible hex color.
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{3,8}$/
const DEFAULT_INK = '#1e2a38'
const DEFAULT_ACCENT = '#e07a3f'

function sanitizeThemeColor(value: string, fallback: string): string {
  return HEX_COLOR_PATTERN.test(value) ? value : fallback
}

function buildStyle(resume: Resume): string {
  const ink = sanitizeThemeColor(resume.theme.ink, DEFAULT_INK)
  const accent = sanitizeThemeColor(resume.theme.accent, DEFAULT_ACCENT)
  return EMBEDDED_STYLE_TEMPLATE.replace('__INK__', ink).replace('__ACCENT__', accent)
}

export function buildStandaloneResumeHtml(resume: Resume): string {
  const contacts = resume.contacts.map(renderContact).join('\n')
  const skillGroups = resume.skills.map(renderSkillGroup).join('\n')
  const jobs = resume.experience.map(renderJob).join('\n')
  const toolGroups = resume.tools.map(renderToolGroup).join('\n')
  const interests = resume.interests
    .map(
      (interest) =>
        `          <li class="tag" data-interest-id="${escapeHtml(interest.id)}">${editableSpan(interest.text)}</li>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(resume.header.name)} Resume</title>
  <style>${buildStyle(resume)}</style>
</head>
<body>
  <div class="resume-page" data-reforge-resume="1">
    <header class="resume-header">
      <h1 contenteditable="true">${textToHtml(resume.header.name)}</h1>
      <p class="tagline" contenteditable="true">${textToHtml(resume.header.tagline)}</p>
      <p class="summary" contenteditable="true">${textToHtml(resume.header.summary)}</p>
    </header>

    <ul class="contact-bar">
${contacts}
    </ul>

    <div class="body-grid">
      <main class="main-col">
        <section class="block" data-section="skills">
          <h2><span class="icon-badge" aria-hidden="true">★</span>Skills</h2>
${skillGroups}
        </section>

        <section class="block" data-section="experience">
          <h2><span class="icon-badge" aria-hidden="true">&#128188;</span>Experience</h2>
${jobs}
        </section>
      </main>

      <aside class="side-col">
        <section class="block" data-section="tools">
          <h2><span class="icon-badge" aria-hidden="true">&#128295;</span>Technical Tools</h2>
${toolGroups}
        </section>

        <section class="block" data-section="education">
          <h2><span class="icon-badge" aria-hidden="true">&#127891;</span>Education</h2>
${renderEducation(resume.education)}
        </section>

        <section class="block" data-section="interests">
          <h2><span class="icon-badge" aria-hidden="true">&#9829;</span>Interests</h2>
          <ul class="tag-list">
${interests}
          </ul>
        </section>
      </aside>
    </div>
  </div>
</body>
</html>
`
}
