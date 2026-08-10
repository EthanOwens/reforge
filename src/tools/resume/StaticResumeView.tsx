import type { CSSProperties } from 'react'
import type { Resume } from './types'
import { contactIcon } from './contactIcons'
import { SECTION_ICON } from './ResumePreview'
import './ResumePreview.css'

interface StaticResumeViewProps {
  resume: Resume
}

// A read-only render of a Resume, sharing the exact DOM structure and CSS
// classes of ResumePreview so it looks pixel-identical, but with no form
// controls, click handlers, or editing chrome. Used anywhere we need to
// rasterize/snapshot a resume (thumbnails, PDF export) rather than let the
// user edit it in place.
function StaticResumeView({ resume }: StaticResumeViewProps) {
  const themeStyle = {
    '--ink': resume.theme.ink,
    '--accent': resume.theme.accent,
  } as CSSProperties

  return (
    <div className="resume-page-backdrop" style={themeStyle}>
      <div className="resume-page">
        <header className="resume-header">
          <h1>{resume.header.name}</h1>
          <p className="tagline">{resume.header.tagline}</p>
          <p className="summary">{resume.header.summary}</p>
        </header>

        <ul className="contact-bar">
          {resume.contacts.map((contact, index) => {
            const displayedIcon = contact.icon ?? contactIcon(contact.type)
            return (
              <li className="contact-item" key={`${contact.type}-${index}`}>
                <span className="icon-trigger">
                  <span className="contact-icon-btn">{displayedIcon}</span>
                </span>
                <span className="editable-field">{contact.value}</span>
              </li>
            )
          })}
        </ul>

        <div className="body-grid">
          <main className="main-col">
            <section className="block">
              <h2>
                <span className="icon-trigger" data-section="skills">
                  <span className="icon-badge">{resume.sectionIcons?.skills ?? SECTION_ICON.skills}</span>
                </span>
                Skills
              </h2>
              {resume.skills.map((group) => (
                <div className="skill-group editable-group" key={group.id}>
                  <div className="editable-group-head">
                    <h3>{group.title}</h3>
                  </div>
                  <ul>
                    {group.bullets.map((bullet) => (
                      <li key={bullet.id}>{bullet.text}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>

            <section className="block">
              <h2>
                <span className="icon-trigger" data-section="experience">
                  <span className="icon-badge">
                    {resume.sectionIcons?.experience ?? SECTION_ICON.experience}
                  </span>
                </span>
                Experience
              </h2>
              {resume.experience.map((job) => (
                <article className="job editable-group" key={job.id}>
                  <div className="editable-group-head">
                    <h3>{job.title}</h3>
                  </div>
                  <p className="job-meta">
                    <span className="editable-field">{job.organization}</span>
                    <span className="dates">{job.dates}</span>
                  </p>
                  <ul>
                    {job.bullets.map((bullet) => (
                      <li key={bullet.id}>{bullet.text}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </section>
          </main>

          <aside className="side-col">
            <section className="block">
              <h2>
                <span className="icon-trigger" data-section="tools">
                  <span className="icon-badge">{resume.sectionIcons?.tools ?? SECTION_ICON.tools}</span>
                </span>
                Technical Tools
              </h2>
              {resume.tools.map((group) => (
                <div className="tool-group editable-group" key={group.id}>
                  <div className="editable-group-head">
                    <h3>{group.title}</h3>
                  </div>
                  <p>{group.description}</p>
                </div>
              ))}
            </section>

            <section className="block">
              <h2>
                <span className="icon-trigger" data-section="education">
                  <span className="icon-badge">
                    {resume.sectionIcons?.education ?? SECTION_ICON.education}
                  </span>
                </span>
                Education
              </h2>
              <div className="education">
                <p className="edu-degree">{resume.education.degree}</p>
                <p className="edu-school">{resume.education.school}</p>
                <p className="edu-dates">{resume.education.dates}</p>
                <p className="edu-gpa">{resume.education.gpa}</p>
                <p className="edu-thesis">
                  <span className="thesis-label">Thesis: </span>
                  {resume.education.thesis ?? ''}
                </p>
              </div>
            </section>

            <section className="block">
              <h2>
                <span className="icon-trigger" data-section="interests">
                  <span className="icon-badge">
                    {resume.sectionIcons?.interests ?? SECTION_ICON.interests}
                  </span>
                </span>
                Interests
              </h2>
              <ul className="tag-list">
                {resume.interests.map((interest) => (
                  <li className="tag" key={interest.id}>
                    {interest.text}
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default StaticResumeView
