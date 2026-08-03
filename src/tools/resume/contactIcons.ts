import type { ContactType } from './types'

// Lightweight placeholder glyphs for contact-bar icons. Visual fidelity of
// the icons themselves isn't important for this subtask — only the layout,
// colors, and typography are.
const CONTACT_ICON: Record<ContactType, string> = {
  email: '✉', // envelope
  phone: '☎', // phone
  location: '\u{1F4CD}', // pin
  linkedin: 'in',
  github: 'gh',
  other: '•', // bullet
}

export function contactIcon(type: ContactType): string {
  return CONTACT_ICON[type]
}
