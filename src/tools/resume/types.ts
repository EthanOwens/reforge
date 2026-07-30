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

export interface SkillGroup {
  title: string
  bullets: string[]
}

export interface Job {
  title: string
  organization: string
  dates: string
  bullets: string[]
}

export interface ToolGroup {
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
  interests: string[]
}
