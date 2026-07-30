import type { Education, Job, Resume, SkillGroup, ToolGroup } from './types'
import { contactIcon } from './contactIcons'
import './ResumePreview.css'

// Placeholder glyphs for section headings — visual fidelity of the icons
// isn't important for this subtask, only layout/colors/typography.
const SECTION_ICON = {
  skills: '★',
  experience: '\u{1F4BC}', // briefcase
  tools: '\u{1F527}', // wrench
  education: '\u{1F393}', // graduation cap
  interests: '\u{2665}', // heart
} as const

interface ResumePreviewProps {
  resume: Resume
}

function ResumePreview({ resume }: ResumePreviewProps) {
  return (
    <div className="resume-page-backdrop">
      <div className="resume-page">
        <header className="resume-header">
          <h1>{resume.header.name}</h1>
          <p className="tagline">{resume.header.tagline}</p>
          <p className="summary">{resume.header.summary}</p>
        </header>

        <ul className="contact-bar">
          {resume.contacts.map((contact, index) => (
            <li className="contact-item" key={`${contact.type}-${index}`}>
              <span aria-hidden="true">{contactIcon(contact.type)}</span>
              <span>{contact.value}</span>
            </li>
          ))}
        </ul>

        <div className="body-grid">
          <main className="main-col">
            <section className="block">
              <h2>
                <span className="icon-badge" aria-hidden="true">
                  {SECTION_ICON.skills}
                </span>
                Skills
              </h2>
              {resume.skills.map((group, index) => (
                <SkillGroupView key={`${group.title}-${index}`} group={group} />
              ))}
            </section>

            <section className="block">
              <h2>
                <span className="icon-badge" aria-hidden="true">
                  {SECTION_ICON.experience}
                </span>
                Experience
              </h2>
              {resume.experience.map((job, index) => (
                <JobView key={`${job.title}-${job.organization}-${index}`} job={job} />
              ))}
            </section>
          </main>

          <aside className="side-col">
            <section className="block">
              <h2>
                <span className="icon-badge" aria-hidden="true">
                  {SECTION_ICON.tools}
                </span>
                Technical Tools
              </h2>
              {resume.tools.map((group, index) => (
                <ToolGroupView key={`${group.title}-${index}`} group={group} />
              ))}
            </section>

            <section className="block">
              <h2>
                <span className="icon-badge" aria-hidden="true">
                  {SECTION_ICON.education}
                </span>
                Education
              </h2>
              <EducationView education={resume.education} />
            </section>

            <section className="block">
              <h2>
                <span className="icon-badge" aria-hidden="true">
                  {SECTION_ICON.interests}
                </span>
                Interests
              </h2>
              <ul className="tag-list">
                {resume.interests.map((interest, index) => (
                  <li className="tag" key={`${interest}-${index}`}>
                    {interest}
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

function SkillGroupView({ group }: { group: SkillGroup }) {
  return (
    <div className="skill-group">
      <h3>{group.title}</h3>
      <ul>
        {group.bullets.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>
    </div>
  )
}

function JobView({ job }: { job: Job }) {
  return (
    <article className="job">
      <h3>{job.title}</h3>
      <p className="job-meta">
        <span>{job.organization}</span>
        <span className="dates">{job.dates}</span>
      </p>
      <ul>
        {job.bullets.map((bullet, index) => (
          <li key={index}>{bullet}</li>
        ))}
      </ul>
    </article>
  )
}

function ToolGroupView({ group }: { group: ToolGroup }) {
  return (
    <div className="tool-group">
      <h3>{group.title}</h3>
      <p>{group.description}</p>
    </div>
  )
}

function EducationView({ education }: { education: Education }) {
  return (
    <div className="education">
      <p className="edu-degree">{education.degree}</p>
      <p className="edu-school">{education.school}</p>
      <p className="edu-dates">{education.dates}</p>
      <p className="edu-gpa">{education.gpa}</p>
      {education.thesis && (
        <p className="edu-thesis">
          <span className="thesis-label">Thesis: </span>
          {education.thesis}
        </p>
      )}
    </div>
  )
}

export default ResumePreview
