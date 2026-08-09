import { downloadBlob, downloadTextFile } from './download'
import { buildResumeFilename } from './filename'
import { buildStandaloneResumeHtml } from './exportHtml'
import { buildResumeDocxBlob } from './exportDocx'
import { resumeToMarkdown, resumeToPlainText } from './exportText'
import type { Resume } from './types'

export type QuickExportFormat = 'html' | 'txt' | 'md' | 'docx'

function renderQuickExportContent(
  format: Exclude<QuickExportFormat, 'docx'>,
  resume: Resume,
): { content: string; mimeType: string } {
  switch (format) {
    case 'html':
      return { content: buildStandaloneResumeHtml(resume), mimeType: 'text/html' }
    case 'txt':
      return { content: resumeToPlainText(resume), mimeType: 'text/plain' }
    case 'md':
      return { content: resumeToMarkdown(resume), mimeType: 'text/markdown' }
  }
}

// Handles export formats that are pure functions of the `Resume` data (no
// rendered DOM node required), so they can be triggered from contexts where
// no live preview exists (e.g. the variations-browsing rail) as well as from
// inside the full editor. PDF export needs a rendered DOM element to
// screenshot and stays special-cased in ResumeTool.tsx.
export async function exportVariationAs(
  resume: Resume,
  jobTitle: string,
  format: QuickExportFormat,
): Promise<void> {
  const filename = buildResumeFilename({
    fullName: resume.header.name,
    jobTitle,
    extension: format,
  })

  if (format === 'docx') {
    const blob = await buildResumeDocxBlob(resume)
    downloadBlob(filename, blob)
    return
  }

  const { content, mimeType } = renderQuickExportContent(format, resume)
  downloadTextFile(filename, content, mimeType)
}
