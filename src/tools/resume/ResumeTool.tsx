import { useRef, useState } from 'react'
import ResumePreview from './ResumePreview'
import { downloadBlob, downloadTextFile } from './download'
import { buildResumeFilename } from './filename'
import { buildStandaloneResumeHtml } from './exportHtml'
import { buildResumeDocxBlob } from './exportDocx'
import { resumeToMarkdown, resumeToPlainText } from './exportText'
import { parseResumeDocx } from './importDocx'
import { parseResumeHtml } from './importHtml'
import { parseResumePdf } from './importPdf'
import { newId } from './id'
import type { Resume } from './types'
import { loadVariationsState, saveVariationsState } from './variationsStorage'
import type { VariationsState } from './variationsStorage'
import './ResumeTool.css'

type ExportFormat = 'html' | 'txt' | 'md' | 'pdf' | 'docx'

const EXPORT_FORMATS: Array<{ value: ExportFormat; label: string }> = [
  { value: 'html', label: 'HTML' },
  { value: 'txt', label: 'Text (.txt)' },
  { value: 'md', label: 'Markdown (.md)' },
  { value: 'pdf', label: 'PDF (print dialog)' },
  { value: 'docx', label: 'Word (.docx)' },
]

function renderExportContent(
  format: Exclude<ExportFormat, 'pdf' | 'docx'>,
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

function ResumeTool() {
  const [state, setState] = useState<VariationsState>(() => loadVariationsState())
  const [saveError, setSaveError] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html')
  const [exportError, setExportError] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const updateState = (next: VariationsState) => {
    setState(next)
    const saved = saveVariationsState(next)
    setSaveError(!saved)
  }

  const activeVariation =
    state.variations.find((variation) => variation.id === state.activeId) ?? state.variations[0]

  const handleResumeChange = (nextResume: Resume) => {
    updateState({
      ...state,
      variations: state.variations.map((variation) =>
        variation.id === activeVariation.id ? { ...variation, resume: nextResume } : variation,
      ),
    })
  }

  const handleSelectVariation = (id: string) => {
    updateState({ ...state, activeId: id })
  }

  const handleRename = (name: string) => {
    updateState({
      ...state,
      variations: state.variations.map((variation) =>
        variation.id === activeVariation.id ? { ...variation, name } : variation,
      ),
    })
  }

  const handleJobTitleChange = (jobTitle: string) => {
    updateState({
      ...state,
      variations: state.variations.map((variation) =>
        variation.id === activeVariation.id ? { ...variation, jobTitle } : variation,
      ),
    })
  }

  const handleAddVariation = () => {
    const copy = {
      id: newId('variation'),
      name: `Copy of ${activeVariation.name}`,
      jobTitle: activeVariation.jobTitle,
      resume: activeVariation.resume,
    }
    updateState({
      activeId: copy.id,
      variations: [...state.variations, copy],
    })
  }

  const handleDeleteVariation = () => {
    if (state.variations.length <= 1) return
    if (!window.confirm(`Delete "${activeVariation.name}"? This can't be undone.`)) return

    const remaining = state.variations.filter((variation) => variation.id !== activeVariation.id)
    const stillActive = remaining.some((variation) => variation.id === state.activeId)
    updateState({
      activeId: stillActive ? state.activeId : remaining[0].id,
      variations: remaining,
    })
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset now so selecting the same file again still fires a change event.
    event.target.value = ''
    if (!file) return

    setImportError(null)
    try {
      const lowerName = file.name.toLowerCase()
      const fallbackName = file.name.replace(/\.[^./\\]+$/, '')

      let resume
      if (lowerName.endsWith('.html')) {
        const text = await file.text()
        resume = parseResumeHtml(text)
      } else if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        resume = await parseResumeDocx(arrayBuffer, fallbackName)
      } else if (lowerName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        resume = await parseResumePdf(arrayBuffer, fallbackName)
      } else {
        throw new Error('Unsupported file type. Please choose a .html, .docx, or .pdf file.')
      }

      const imported = {
        id: newId('variation'),
        name: `Imported: ${resume.header.name || file.name}`,
        jobTitle: '',
        resume,
      }
      updateState({
        activeId: imported.id,
        variations: [...state.variations, imported],
      })
    } catch (error) {
      console.error('Failed to import resume file', error)
      setImportError(
        error instanceof Error ? error.message : 'Could not import that file as a resume.',
      )
    }
  }

  const handleExport = async () => {
    setExportError(false)

    if (exportFormat === 'pdf') {
      window.print()
      return
    }

    const filename = buildResumeFilename({
      fullName: activeVariation.resume.header.name,
      jobTitle: activeVariation.jobTitle,
      extension: exportFormat,
    })

    if (exportFormat === 'docx') {
      try {
        const blob = await buildResumeDocxBlob(activeVariation.resume)
        downloadBlob(filename, blob)
      } catch (error) {
        console.error('Failed to generate DOCX export', error)
        setExportError(true)
      }
      return
    }

    const { content, mimeType } = renderExportContent(exportFormat, activeVariation.resume)
    downloadTextFile(filename, content, mimeType)
  }

  return (
    <div className="resume-tool">
      {saveError && (
        <div className="variation-save-warning" role="alert">
          Couldn&apos;t save — your changes may not persist.
          <button
            type="button"
            className="variation-save-warning-dismiss"
            onClick={() => setSaveError(false)}
            aria-label="Dismiss save warning"
          >
            &times;
          </button>
        </div>
      )}
      <div className="variation-toolbar">
        <label className="variation-control">
          Variation
          <select
            value={activeVariation.id}
            onChange={(event) => handleSelectVariation(event.target.value)}
            aria-label="Select resume variation"
          >
            {state.variations.map((variation) => (
              <option key={variation.id} value={variation.id}>
                {variation.name}
              </option>
            ))}
          </select>
        </label>

        <label className="variation-control">
          Name
          <input
            type="text"
            value={activeVariation.name}
            onChange={(event) => handleRename(event.target.value)}
            aria-label="Rename active variation"
          />
        </label>

        <label className="variation-control">
          Job title
          <input
            type="text"
            value={activeVariation.jobTitle}
            onChange={(event) => handleJobTitleChange(event.target.value)}
            aria-label="Job title for active variation"
            placeholder="e.g. Research Engineer"
          />
        </label>

        <button type="button" className="variation-btn" onClick={handleAddVariation}>
          + New variation
        </button>
        <button
          type="button"
          className="variation-btn"
          onClick={handleDeleteVariation}
          disabled={state.variations.length <= 1}
        >
          Delete variation
        </button>

        <label className="variation-control">
          Export as
          <select
            value={exportFormat}
            onChange={(event) => setExportFormat(event.target.value as ExportFormat)}
            aria-label="Export format"
          >
            {EXPORT_FORMATS.map((format) => (
              <option key={format.value} value={format.value}>
                {format.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="variation-btn"
          onClick={() => {
            void handleExport()
          }}
        >
          Export
        </button>

        <input
          ref={importInputRef}
          type="file"
          accept=".html,.docx,.pdf,text/html,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/pdf"
          onChange={(event) => {
            void handleImportFile(event)
          }}
          style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0, 0, 0, 0)', whiteSpace: 'nowrap', border: 0 }}
          aria-label="Import resume file"
        />
        <button type="button" className="variation-btn" onClick={() => importInputRef.current?.click()}>
          Import
        </button>
      </div>

      {exportError && (
        <div className="variation-save-warning" role="alert">
          Couldn&apos;t generate that export — please try again.
          <button
            type="button"
            className="variation-save-warning-dismiss"
            onClick={() => setExportError(false)}
            aria-label="Dismiss export warning"
          >
            &times;
          </button>
        </div>
      )}

      {importError && (
        <div className="variation-save-warning" role="alert">
          {importError}
          <button
            type="button"
            className="variation-save-warning-dismiss"
            onClick={() => setImportError(null)}
            aria-label="Dismiss import warning"
          >
            &times;
          </button>
        </div>
      )}

      <p className="variation-filename-preview">
        {exportFormat === 'pdf' ? (
          <>
            Suggested filename for the print dialog:{' '}
            <code>
              {buildResumeFilename({
                fullName: activeVariation.resume.header.name,
                jobTitle: activeVariation.jobTitle,
                extension: 'pdf',
              })}
            </code>
          </>
        ) : (
          <>
            Filename:{' '}
            <code>
              {buildResumeFilename({
                fullName: activeVariation.resume.header.name,
                jobTitle: activeVariation.jobTitle,
                extension: exportFormat,
              })}
            </code>
          </>
        )}
      </p>

      <ResumePreview resume={activeVariation.resume} onChange={handleResumeChange} />
    </div>
  )
}

export default ResumeTool
