import { useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, RefObject } from 'react'
import type { Education, Job, Resume, ResumeTheme, SectionIcons, SkillGroup, ToolGroup } from './types'
import { contactIcon } from './contactIcons'
import { newId } from './id'
import EmojiPicker from './emojiPicker/EmojiPicker'
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

type SectionKey = keyof typeof SECTION_ICON

interface ResumePreviewProps {
  resume: Resume
  onChange: (next: Resume) => void
  rootRef?: RefObject<HTMLDivElement | null>
}

function ResumePreview({ resume, onChange, rootRef }: ResumePreviewProps) {
  // Tracks which single icon picker (if any) is currently open, identified
  // by a string key: `section:<name>` for the five section-header icons, or
  // `contact:<index>` for a contact-bar icon. Only one can be open at a time.
  const [openIconPicker, setOpenIconPicker] = useState<string | null>(null)

  const updateHeader = (patch: Partial<Resume['header']>) => {
    onChange({ ...resume, header: { ...resume.header, ...patch } })
  }

  const updateTheme = (patch: Partial<ResumeTheme>) => {
    onChange({ ...resume, theme: { ...resume.theme, ...patch } })
  }

  const updateContact = (index: number, value: string) => {
    onChange({
      ...resume,
      contacts: resume.contacts.map((contact, i) =>
        i === index ? { ...contact, value } : contact,
      ),
    })
  }

  const setContactIcon = (index: number, icon: string | undefined) => {
    onChange({
      ...resume,
      contacts: resume.contacts.map((contact, i) => (i === index ? { ...contact, icon } : contact)),
    })
    setOpenIconPicker(null)
  }

  const setSectionIcon = (section: SectionKey, icon: string | undefined) => {
    const nextSectionIcons: SectionIcons = { ...resume.sectionIcons, [section]: icon }
    onChange({ ...resume, sectionIcons: nextSectionIcons })
    setOpenIconPicker(null)
  }

  // --- Skills -------------------------------------------------------------

  const updateSkillGroup = (groupId: string, patch: Partial<Pick<SkillGroup, 'title'>>) => {
    onChange({
      ...resume,
      skills: resume.skills.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    })
  }

  const addSkillGroup = () => {
    onChange({
      ...resume,
      skills: [
        ...resume.skills,
        { id: newId('skill'), title: 'New Skill Category', bullets: [] },
      ],
    })
  }

  const removeSkillGroup = (groupId: string) => {
    onChange({ ...resume, skills: resume.skills.filter((group) => group.id !== groupId) })
  }

  const addSkillBullet = (groupId: string) => {
    onChange({
      ...resume,
      skills: resume.skills.map((group) =>
        group.id === groupId
          ? { ...group, bullets: [...group.bullets, { id: newId('bullet'), text: '' }] }
          : group,
      ),
    })
  }

  const updateSkillBullet = (groupId: string, bulletId: string, text: string) => {
    onChange({
      ...resume,
      skills: resume.skills.map((group) =>
        group.id === groupId
          ? {
              ...group,
              bullets: group.bullets.map((bullet) =>
                bullet.id === bulletId ? { ...bullet, text } : bullet,
              ),
            }
          : group,
      ),
    })
  }

  const removeSkillBullet = (groupId: string, bulletId: string) => {
    onChange({
      ...resume,
      skills: resume.skills.map((group) =>
        group.id === groupId
          ? { ...group, bullets: group.bullets.filter((bullet) => bullet.id !== bulletId) }
          : group,
      ),
    })
  }

  // --- Experience -----------------------------------------------------------

  const updateJob = (
    jobId: string,
    patch: Partial<Pick<Job, 'title' | 'organization' | 'dates'>>,
  ) => {
    onChange({
      ...resume,
      experience: resume.experience.map((job) => (job.id === jobId ? { ...job, ...patch } : job)),
    })
  }

  const addJob = () => {
    onChange({
      ...resume,
      experience: [
        ...resume.experience,
        {
          id: newId('job'),
          title: 'New Job Title',
          organization: 'Company Name, Location',
          dates: 'Month Year – Present',
          bullets: [],
        },
      ],
    })
  }

  const removeJob = (jobId: string) => {
    onChange({ ...resume, experience: resume.experience.filter((job) => job.id !== jobId) })
  }

  const addJobBullet = (jobId: string) => {
    onChange({
      ...resume,
      experience: resume.experience.map((job) =>
        job.id === jobId
          ? { ...job, bullets: [...job.bullets, { id: newId('bullet'), text: '' }] }
          : job,
      ),
    })
  }

  const updateJobBullet = (jobId: string, bulletId: string, text: string) => {
    onChange({
      ...resume,
      experience: resume.experience.map((job) =>
        job.id === jobId
          ? {
              ...job,
              bullets: job.bullets.map((bullet) =>
                bullet.id === bulletId ? { ...bullet, text } : bullet,
              ),
            }
          : job,
      ),
    })
  }

  const removeJobBullet = (jobId: string, bulletId: string) => {
    onChange({
      ...resume,
      experience: resume.experience.map((job) =>
        job.id === jobId
          ? { ...job, bullets: job.bullets.filter((bullet) => bullet.id !== bulletId) }
          : job,
      ),
    })
  }

  // --- Tools ----------------------------------------------------------------

  const updateToolGroup = (
    groupId: string,
    patch: Partial<Pick<ToolGroup, 'title' | 'description'>>,
  ) => {
    onChange({
      ...resume,
      tools: resume.tools.map((group) => (group.id === groupId ? { ...group, ...patch } : group)),
    })
  }

  const addToolGroup = () => {
    onChange({
      ...resume,
      tools: [...resume.tools, { id: newId('tool'), title: 'New Tool Category', description: '' }],
    })
  }

  const removeToolGroup = (groupId: string) => {
    onChange({ ...resume, tools: resume.tools.filter((group) => group.id !== groupId) })
  }

  // --- Education --------------------------------------------------------------

  const updateEducation = (patch: Partial<Education>) => {
    onChange({ ...resume, education: { ...resume.education, ...patch } })
  }

  // --- Interests --------------------------------------------------------------

  const updateInterest = (interestId: string, text: string) => {
    onChange({
      ...resume,
      interests: resume.interests.map((interest) =>
        interest.id === interestId ? { ...interest, text } : interest,
      ),
    })
  }

  const addInterest = () => {
    onChange({ ...resume, interests: [...resume.interests, { id: newId('interest'), text: '' }] })
  }

  const removeInterest = (interestId: string) => {
    onChange({
      ...resume,
      interests: resume.interests.filter((interest) => interest.id !== interestId),
    })
  }

  const themeStyle = {
    '--ink': resume.theme.ink,
    '--accent': resume.theme.accent,
  } as CSSProperties

  return (
    <div className="resume-page-backdrop" style={themeStyle} ref={rootRef}>
      <ThemeControls theme={resume.theme} onChange={updateTheme} />
      <div className="resume-page">
        <header className="resume-header">
          <h1>
            <EditableInput
              value={resume.header.name}
              onChange={(name) => updateHeader({ name })}
              ariaLabel="Name"
            />
          </h1>
          <p className="tagline">
            <EditableInput
              value={resume.header.tagline}
              onChange={(tagline) => updateHeader({ tagline })}
              ariaLabel="Tagline"
            />
          </p>
          <p className="summary">
            <AutoTextarea
              value={resume.header.summary}
              onChange={(summary) => updateHeader({ summary })}
              ariaLabel="Summary"
            />
          </p>
        </header>

        <ul className="contact-bar">
          {resume.contacts.map((contact, index) => {
            const pickerKey = `contact:${index}`
            const displayedIcon = contact.icon ?? contactIcon(contact.type)
            return (
              <li className="contact-item" key={`${contact.type}-${index}`}>
                <ContactIconTrigger
                  contactType={contact.type}
                  value={displayedIcon}
                  isOpen={openIconPicker === pickerKey}
                  onToggle={() =>
                    setOpenIconPicker((current) => (current === pickerKey ? null : pickerKey))
                  }
                  onSelect={(emoji) => setContactIcon(index, emoji)}
                  onReset={() => setContactIcon(index, undefined)}
                  onClose={() => setOpenIconPicker(null)}
                />
                <EditableInput
                  value={contact.value}
                  onChange={(value) => updateContact(index, value)}
                  ariaLabel={`${contact.type} contact value`}
                />
              </li>
            )
          })}
        </ul>

        <div className="body-grid">
          <main className="main-col">
            <section className="block">
              <h2>
                <SectionIconTrigger
                  section="skills"
                  label="Change skills section icon"
                  value={resume.sectionIcons?.skills ?? SECTION_ICON.skills}
                  isOpen={openIconPicker === 'section:skills'}
                  onToggle={() =>
                    setOpenIconPicker((current) => (current === 'section:skills' ? null : 'section:skills'))
                  }
                  onSelect={(emoji) => setSectionIcon('skills', emoji)}
                  onReset={() => setSectionIcon('skills', undefined)}
                  onClose={() => setOpenIconPicker(null)}
                />
                Skills
              </h2>
              {resume.skills.map((group) => (
                <SkillGroupView
                  key={group.id}
                  group={group}
                  onChangeTitle={(title) => updateSkillGroup(group.id, { title })}
                  onRemoveGroup={() => removeSkillGroup(group.id)}
                  onAddBullet={() => addSkillBullet(group.id)}
                  onChangeBullet={(bulletId, text) => updateSkillBullet(group.id, bulletId, text)}
                  onRemoveBullet={(bulletId) => removeSkillBullet(group.id, bulletId)}
                />
              ))}
              <AddButton label="Add skill category" onClick={addSkillGroup} />
            </section>

            <section className="block">
              <h2>
                <SectionIconTrigger
                  section="experience"
                  label="Change experience section icon"
                  value={resume.sectionIcons?.experience ?? SECTION_ICON.experience}
                  isOpen={openIconPicker === 'section:experience'}
                  onToggle={() =>
                    setOpenIconPicker((current) =>
                      current === 'section:experience' ? null : 'section:experience',
                    )
                  }
                  onSelect={(emoji) => setSectionIcon('experience', emoji)}
                  onReset={() => setSectionIcon('experience', undefined)}
                  onClose={() => setOpenIconPicker(null)}
                />
                Experience
              </h2>
              {resume.experience.map((job) => (
                <JobView
                  key={job.id}
                  job={job}
                  onChangeField={(patch) => updateJob(job.id, patch)}
                  onRemoveJob={() => removeJob(job.id)}
                  onAddBullet={() => addJobBullet(job.id)}
                  onChangeBullet={(bulletId, text) => updateJobBullet(job.id, bulletId, text)}
                  onRemoveBullet={(bulletId) => removeJobBullet(job.id, bulletId)}
                />
              ))}
              <AddButton label="Add job" onClick={addJob} />
            </section>
          </main>

          <aside className="side-col">
            <section className="block">
              <h2>
                <SectionIconTrigger
                  section="tools"
                  label="Change technical tools section icon"
                  value={resume.sectionIcons?.tools ?? SECTION_ICON.tools}
                  isOpen={openIconPicker === 'section:tools'}
                  onToggle={() =>
                    setOpenIconPicker((current) => (current === 'section:tools' ? null : 'section:tools'))
                  }
                  onSelect={(emoji) => setSectionIcon('tools', emoji)}
                  onReset={() => setSectionIcon('tools', undefined)}
                  onClose={() => setOpenIconPicker(null)}
                />
                Technical Tools
              </h2>
              {resume.tools.map((group) => (
                <ToolGroupView
                  key={group.id}
                  group={group}
                  onChangeTitle={(title) => updateToolGroup(group.id, { title })}
                  onChangeDescription={(description) => updateToolGroup(group.id, { description })}
                  onRemove={() => removeToolGroup(group.id)}
                />
              ))}
              <AddButton label="Add tool category" onClick={addToolGroup} />
            </section>

            <section className="block">
              <h2>
                <SectionIconTrigger
                  section="education"
                  label="Change education section icon"
                  value={resume.sectionIcons?.education ?? SECTION_ICON.education}
                  isOpen={openIconPicker === 'section:education'}
                  onToggle={() =>
                    setOpenIconPicker((current) =>
                      current === 'section:education' ? null : 'section:education',
                    )
                  }
                  onSelect={(emoji) => setSectionIcon('education', emoji)}
                  onReset={() => setSectionIcon('education', undefined)}
                  onClose={() => setOpenIconPicker(null)}
                />
                Education
              </h2>
              <EducationView education={resume.education} onChange={updateEducation} />
            </section>

            <section className="block">
              <h2>
                <SectionIconTrigger
                  section="interests"
                  label="Change interests section icon"
                  value={resume.sectionIcons?.interests ?? SECTION_ICON.interests}
                  isOpen={openIconPicker === 'section:interests'}
                  onToggle={() =>
                    setOpenIconPicker((current) =>
                      current === 'section:interests' ? null : 'section:interests',
                    )
                  }
                  onSelect={(emoji) => setSectionIcon('interests', emoji)}
                  onReset={() => setSectionIcon('interests', undefined)}
                  onClose={() => setOpenIconPicker(null)}
                />
                Interests
              </h2>
              <ul className="tag-list">
                {resume.interests.map((interest) => (
                  <li className="tag" key={interest.id}>
                    <EditableInput
                      value={interest.text}
                      onChange={(text) => updateInterest(interest.id, text)}
                      ariaLabel="Interest"
                    />
                    <RemoveButton onClick={() => removeInterest(interest.id)} label="Remove interest" />
                  </li>
                ))}
              </ul>
              <AddButton label="Add interest" onClick={addInterest} />
            </section>
          </aside>
        </div>
      </div>
    </div>
  )
}

// --- Icon triggers -----------------------------------------------------------
// Wraps a section-header icon-badge in a clickable button that opens a small
// emoji picker popover, letting the user override that section's default
// glyph (SECTION_ICON.<section>). `section` selects which slot of
// `resume.sectionIcons` is affected; it's otherwise only used to key the
// wrapping element.

interface SectionIconTriggerProps {
  section: SectionKey
  value: string
  isOpen: boolean
  onToggle: () => void
  onSelect: (emoji: string) => void
  onReset: () => void
  onClose: () => void
  label: string
}

function SectionIconTrigger({
  section,
  value,
  isOpen,
  onToggle,
  onSelect,
  onReset,
  onClose,
  label,
}: SectionIconTriggerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <span className="icon-trigger" data-section={section}>
      <button
        type="button"
        ref={triggerRef}
        className="icon-badge icon-badge-btn"
        onClick={onToggle}
        aria-label={label}
      >
        {value}
      </button>
      <EmojiPicker
        isOpen={isOpen}
        currentValue={value}
        onSelect={onSelect}
        onReset={onReset}
        onClose={onClose}
        label={label}
        triggerRef={triggerRef}
      />
    </span>
  )
}

// --- Contact icon trigger ------------------------------------------------
// Same pattern as `SectionIconTrigger`, but for the contact-bar icons.
// Extracted into its own component (rather than inlined in a `.map()`) so
// each contact gets a genuinely per-instance trigger ref.

interface ContactIconTriggerProps {
  contactType: string
  value: string
  isOpen: boolean
  onToggle: () => void
  onSelect: (emoji: string) => void
  onReset: () => void
  onClose: () => void
}

function ContactIconTrigger({
  contactType,
  value,
  isOpen,
  onToggle,
  onSelect,
  onReset,
  onClose,
}: ContactIconTriggerProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const label = `Change ${contactType} icon`

  return (
    <span className="icon-trigger">
      <button
        type="button"
        ref={triggerRef}
        className="contact-icon-btn"
        onClick={onToggle}
        aria-label={label}
      >
        {value}
      </button>
      <EmojiPicker
        isOpen={isOpen}
        currentValue={value}
        onSelect={onSelect}
        onReset={onReset}
        onClose={onClose}
        label={label}
        triggerRef={triggerRef}
      />
    </span>
  )
}

// --- Theme controls ---------------------------------------------------------
// Editing chrome, not resume content: lets the user pick the two brand colors
// used throughout the resume. Hidden from print/PDF output via the
// `@media print { .theme-controls { display: none } }` rule in
// ResumePreview.css — being a DOM sibling of `.resume-page` alone would not
// keep it out of a printed/exported page.

interface ThemeControlsProps {
  theme: ResumeTheme
  onChange: (patch: Partial<ResumeTheme>) => void
}

function ThemeControls({ theme, onChange }: ThemeControlsProps) {
  return (
    <div className="theme-controls">
      <label className="theme-control">
        Ink color
        <input
          type="color"
          value={theme.ink}
          onChange={(event) => onChange({ ink: event.target.value })}
          aria-label="Ink color"
        />
      </label>
      <label className="theme-control">
        Accent color
        <input
          type="color"
          value={theme.accent}
          onChange={(event) => onChange({ accent: event.target.value })}
          aria-label="Accent color"
        />
      </label>
    </div>
  )
}

// --- Editable field primitives -------------------------------------------

interface EditableInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  ariaLabel?: string
}

function EditableInput({ value, onChange, placeholder, ariaLabel }: EditableInputProps) {
  return (
    <input
      type="text"
      className="editable-field"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
    />
  )
}

function AutoTextarea({ value, onChange, placeholder, ariaLabel }: EditableInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <textarea
      ref={ref}
      className="editable-field editable-textarea"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      aria-label={ariaLabel}
      rows={1}
    />
  )
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="add-btn" onClick={onClick}>
      + {label}
    </button>
  )
}

function RemoveButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="remove-btn" onClick={onClick} aria-label={label} title={label}>
      ×
    </button>
  )
}

// --- Section sub-components -------------------------------------------------

interface SkillGroupViewProps {
  group: SkillGroup
  onChangeTitle: (title: string) => void
  onRemoveGroup: () => void
  onAddBullet: () => void
  onChangeBullet: (bulletId: string, text: string) => void
  onRemoveBullet: (bulletId: string) => void
}

function SkillGroupView({
  group,
  onChangeTitle,
  onRemoveGroup,
  onAddBullet,
  onChangeBullet,
  onRemoveBullet,
}: SkillGroupViewProps) {
  return (
    <div className="skill-group editable-group">
      <div className="editable-group-head">
        <h3>
          <EditableInput value={group.title} onChange={onChangeTitle} ariaLabel="Skill category title" />
        </h3>
        <RemoveButton onClick={onRemoveGroup} label="Remove skill category" />
      </div>
      <ul>
        {group.bullets.map((bullet) => (
          <li key={bullet.id}>
            <div className="editable-list-item">
              <AutoTextarea
                value={bullet.text}
                onChange={(text) => onChangeBullet(bullet.id, text)}
                ariaLabel="Skill bullet"
                placeholder="Describe a relevant skill or accomplishment"
              />
              <RemoveButton onClick={() => onRemoveBullet(bullet.id)} label="Remove bullet" />
            </div>
          </li>
        ))}
      </ul>
      <AddButton label="Add bullet" onClick={onAddBullet} />
    </div>
  )
}

interface JobViewProps {
  job: Job
  onChangeField: (patch: Partial<Pick<Job, 'title' | 'organization' | 'dates'>>) => void
  onRemoveJob: () => void
  onAddBullet: () => void
  onChangeBullet: (bulletId: string, text: string) => void
  onRemoveBullet: (bulletId: string) => void
}

function JobView({
  job,
  onChangeField,
  onRemoveJob,
  onAddBullet,
  onChangeBullet,
  onRemoveBullet,
}: JobViewProps) {
  return (
    <article className="job editable-group">
      <div className="editable-group-head">
        <h3>
          <EditableInput
            value={job.title}
            onChange={(title) => onChangeField({ title })}
            ariaLabel="Job title"
          />
        </h3>
        <RemoveButton onClick={onRemoveJob} label="Remove job" />
      </div>
      <p className="job-meta">
        <EditableInput
          value={job.organization}
          onChange={(organization) => onChangeField({ organization })}
          ariaLabel="Organization"
        />
        <span className="dates">
          <EditableInput
            value={job.dates}
            onChange={(dates) => onChangeField({ dates })}
            ariaLabel="Dates"
          />
        </span>
      </p>
      <ul>
        {job.bullets.map((bullet) => (
          <li key={bullet.id}>
            <div className="editable-list-item">
              <AutoTextarea
                value={bullet.text}
                onChange={(text) => onChangeBullet(bullet.id, text)}
                ariaLabel="Job bullet"
                placeholder="Describe a responsibility or achievement"
              />
              <RemoveButton onClick={() => onRemoveBullet(bullet.id)} label="Remove bullet" />
            </div>
          </li>
        ))}
      </ul>
      <AddButton label="Add bullet" onClick={onAddBullet} />
    </article>
  )
}

interface ToolGroupViewProps {
  group: ToolGroup
  onChangeTitle: (title: string) => void
  onChangeDescription: (description: string) => void
  onRemove: () => void
}

function ToolGroupView({ group, onChangeTitle, onChangeDescription, onRemove }: ToolGroupViewProps) {
  return (
    <div className="tool-group editable-group">
      <div className="editable-group-head">
        <h3>
          <EditableInput value={group.title} onChange={onChangeTitle} ariaLabel="Tool category title" />
        </h3>
        <RemoveButton onClick={onRemove} label="Remove tool category" />
      </div>
      <p>
        <EditableInput
          value={group.description}
          onChange={onChangeDescription}
          ariaLabel="Tools"
          placeholder="Tool, Tool, Tool"
        />
      </p>
    </div>
  )
}

interface EducationViewProps {
  education: Education
  onChange: (patch: Partial<Education>) => void
}

function EducationView({ education, onChange }: EducationViewProps) {
  return (
    <div className="education">
      <p className="edu-degree">
        <EditableInput
          value={education.degree}
          onChange={(degree) => onChange({ degree })}
          ariaLabel="Degree"
        />
      </p>
      <p className="edu-school">
        <EditableInput
          value={education.school}
          onChange={(school) => onChange({ school })}
          ariaLabel="School"
        />
      </p>
      <p className="edu-dates">
        <EditableInput
          value={education.dates}
          onChange={(dates) => onChange({ dates })}
          ariaLabel="Education dates"
        />
      </p>
      <p className="edu-gpa">
        <EditableInput value={education.gpa} onChange={(gpa) => onChange({ gpa })} ariaLabel="GPA" />
      </p>
      <p className="edu-thesis">
        <span className="thesis-label">Thesis: </span>
        <EditableInput
          value={education.thesis ?? ''}
          onChange={(thesis) => onChange({ thesis })}
          ariaLabel="Thesis"
          placeholder="Thesis or notable project title"
        />
      </p>
    </div>
  )
}

export default ResumePreview
