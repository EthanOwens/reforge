// Shared filename convention for every resume export/save action (HTML, TXT,
// MD, PDF, DOCX, and eventually AI-tailored exports), so they all agree on
// one naming scheme:
//
//   <firstName> <lastName> <fileType> - <jobTitle>.<fileFormat>
//
// e.g. "Ethan Owens Resume - Research Engineer.pdf"

// Characters that are invalid in filenames on common filesystems (Windows in
// particular reserves all of these): forward slash, backslash, colon,
// asterisk, question mark, double quote, angle brackets, and pipe.
const INVALID_FILENAME_CHARS = /[/\\:*?"<>|]/g

function sanitize(part: string): string {
  return part.replace(INVALID_FILENAME_CHARS, '').replace(/\s+/g, ' ').trim()
}

// Splits a full name into first/last for the filename convention. First word
// is the first name; every remaining word (joined back with spaces) is the
// last name. A single-word name is used as the first name only, with no
// last-name segment.
function splitName(fullName: string): { firstName: string; lastName: string } {
  const words = String(fullName ?? '').trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return { firstName: '', lastName: '' }
  const [firstName, ...rest] = words
  return { firstName, lastName: rest.join(' ') }
}

export function buildResumeFilename(options: {
  fullName: string
  jobTitle: string
  fileType?: string
  extension: string
}): string {
  const { fullName, jobTitle, fileType = 'Resume', extension } = options

  const { firstName, lastName } = splitName(fullName)
  const namePart = sanitize([firstName, lastName].filter(Boolean).join(' '))
  const cleanFileType = sanitize(fileType) || 'Resume'
  const cleanJobTitle = sanitize(jobTitle)

  // With no usable name, fall back to just the file type (e.g. "Resume")
  // instead of producing a filename that starts with a stray space, like
  // " Resume - Title.pdf".
  const nameAndType = namePart ? `${namePart} ${cleanFileType}` : cleanFileType
  const base = cleanJobTitle ? `${nameAndType} - ${cleanJobTitle}` : nameAndType

  const cleanExtension = sanitize(extension).replace(/^\.+/, '')

  return `${base}.${cleanExtension}`
}
