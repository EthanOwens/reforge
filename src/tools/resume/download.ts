// Generic client-side "save this text to a file" helper — no backend
// involved. Shared by every export format that produces text-based content
// (HTML, TXT, MD today; PDF/DOCX later subtasks may need their own
// Blob-producing paths, but can still reuse the download-trigger mechanics
// here if useful). Deliberately generic: no hardcoded mime type or
// extension, so callers decide the format.
export function downloadTextFile(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
