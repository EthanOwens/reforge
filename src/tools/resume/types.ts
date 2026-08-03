// Data model for the Resume tool. This is the single source of truth all
// later subtasks (rendering, editing, variations, export/import) read/write.
// Every field is plain text — formatting/rich-text is a rendering concern,
// not part of the data model.

export type ContactType =
  | 'email'
  | 'phone'
  | 'location'
  | 'linkedin'
  | 'github'
  | 'other'

export interface ContactItem {
  type: ContactType
  value: string
}

// A single piece of editable text with a stable identity, independent of its
// content. Used anywhere a list of freeform text entries can be individually
// added/removed/edited (skill bullets, job bullets, interest tags), since
// content-based keys break under duplicate text or in-place edits.
export interface TextItem {
  id: string
  text: string
}

export interface SkillGroup {
  id: string
  title: string
  bullets: TextItem[]
}

export interface Job {
  id: string
  title: string
  organization: string
  dates: string
  bullets: TextItem[]
}

export interface ToolGroup {
  id: string
  title: string
  description: string
}

export interface Education {
  degree: string
  school: string
  dates: string
  gpa: string
  thesis?: string
}

// The resume's two user-customizable brand colors, applied as CSS custom
// properties (--ink, --accent) on the rendered resume. Hex color strings.
export interface ResumeTheme {
  ink: string
  accent: string
}

export interface Resume {
  header: {
    name: string
    tagline: string
    summary: string
  }
  contacts: ContactItem[]
  skills: SkillGroup[]
  experience: Job[]
  tools: ToolGroup[]
  education: Education
  interests: TextItem[]
  theme: ResumeTheme
}
