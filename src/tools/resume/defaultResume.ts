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
      title: 'Skill Category One',
      bullets: [
        'Example bullet describing a relevant skill or accomplishment',
        'Another example bullet describing a relevant skill',
      ],
    },
    {
      title: 'Skill Category Two',
      bullets: [
        'Example bullet describing a relevant skill or accomplishment',
        'Another example bullet describing a relevant skill',
      ],
    },
  ],
  experience: [
    {
      title: 'Job Title',
      organization: 'Company Name, Location',
      dates: 'Month Year – Present',
      bullets: [
        'Example bullet describing a key responsibility or achievement',
        'Another example bullet quantifying an impact or result',
        'Another example bullet describing a relevant contribution',
      ],
    },
    {
      title: 'Previous Job Title',
      organization: 'Previous Company Name, Location',
      dates: 'Month Year – Month Year',
      bullets: [
        'Example bullet describing a key responsibility or achievement',
        'Another example bullet quantifying an impact or result',
      ],
    },
  ],
  tools: [
    {
      title: 'Tool Category One',
      description: 'Tool, Tool, Tool',
    },
    {
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
  interests: ['Interest One', 'Interest Two', 'Interest Three'],
}
