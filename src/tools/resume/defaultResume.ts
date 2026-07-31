import type { Resume } from './types'

// Placeholder/sample resume content, in the spirit of the reference design's
// own placeholder copy. Not a real person's resume.
export const defaultResume: Resume = {
  header: {
    name: 'First Last',
    tagline: 'Professional Title | Area of Specialization',
    summary:
      'Brief 1-2 sentence summary highlighting key strengths, experience, and career focus.',
  },
  contacts: [
    { type: 'email', value: 'you@email.com' },
    { type: 'phone', value: '(555) 123-4567' },
    { type: 'location', value: 'City, State' },
    { type: 'linkedin', value: 'linkedin.com/in/yourname' },
    { type: 'github', value: 'github.com/yourusername' },
  ],
  skills: [
    {
      id: 'skill-1',
      title: 'Skill Category One',
      bullets: [
        { id: 'skill-1-bullet-1', text: 'Example bullet describing a relevant skill or accomplishment' },
        { id: 'skill-1-bullet-2', text: 'Another example bullet describing a relevant skill' },
      ],
    },
    {
      id: 'skill-2',
      title: 'Skill Category Two',
      bullets: [
        { id: 'skill-2-bullet-1', text: 'Example bullet describing a relevant skill or accomplishment' },
        { id: 'skill-2-bullet-2', text: 'Another example bullet describing a relevant skill' },
      ],
    },
  ],
  experience: [
    {
      id: 'job-1',
      title: 'Job Title',
      organization: 'Company Name, Location',
      dates: 'Month Year – Present',
      bullets: [
        { id: 'job-1-bullet-1', text: 'Example bullet describing a key responsibility or achievement' },
        { id: 'job-1-bullet-2', text: 'Another example bullet quantifying an impact or result' },
        { id: 'job-1-bullet-3', text: 'Another example bullet describing a relevant contribution' },
      ],
    },
    {
      id: 'job-2',
      title: 'Previous Job Title',
      organization: 'Previous Company Name, Location',
      dates: 'Month Year – Month Year',
      bullets: [
        { id: 'job-2-bullet-1', text: 'Example bullet describing a key responsibility or achievement' },
        { id: 'job-2-bullet-2', text: 'Another example bullet quantifying an impact or result' },
      ],
    },
  ],
  tools: [
    {
      id: 'tool-1',
      title: 'Tool Category One',
      description: 'Tool, Tool, Tool',
    },
    {
      id: 'tool-2',
      title: 'Tool Category Two',
      description: 'Tool, Tool, Tool',
    },
  ],
  education: {
    degree: 'Degree Name, Field of Study',
    school: 'School Name',
    dates: 'Month Year – Month Year',
    gpa: 'GPA: 3.85',
    thesis: 'Thesis or notable project title',
  },
  interests: [
    { id: 'interest-1', text: 'Interest One' },
    { id: 'interest-2', text: 'Interest Two' },
    { id: 'interest-3', text: 'Interest Three' },
  ],
}
