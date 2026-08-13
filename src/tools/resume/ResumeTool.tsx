import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import ResumePreview from './ResumePreview'
import { downloadBlob } from './download'
import { buildAutoVariationName, buildResumeFilename, buildVariationLabel } from './filename'
import { buildResumePdfBlob } from './exportPdf'
import { exportVariationAs } from './exportVariation'
import { parseResumeDocx } from './importDocx'
import { parseResumeHtml } from './importHtml'
import { parseResumePdf } from './importPdf'
import { newId } from './id'
import type { Resume } from './types'
import { loadSchemasState, saveSchemasState } from './variationsStorage'
import type { Schema, SchemasState } from './variationsStorage'
import { applySuggestions, generateResumeSuggestions } from './aiTailor'
import type { ResumeSuggestion } from './aiTailor'
import { estimateCostUsd } from '../../settings/pricing'
import { saveAppSettings } from '../../settings/settingsStore'
import type { AppSettings } from '../../settings/settingsStore'
import './ResumeTool.css'

type ExportFormat = 'html' | 'txt' | 'md' | 'pdf' | 'docx'

const EXPORT_FORMATS: Array<{ value: ExportFormat; label: string }> = [
  { value: 'html', label: 'HTML' },
  { value: 'txt', label: 'Text (.txt)' },
  { value: 'md', label: 'Markdown (.md)' },
  { value: 'pdf', label: 'PDF' },
  { value: 'docx', label: 'Word (.docx)' },
]

function findBulletText(resume: Resume, bulletId: string): string | null {
  for (const group of resume.skills) {
    const bullet = group.bullets.find((item) => item.id === bulletId)
    if (bullet) return bullet.text
  }
  for (const job of resume.experience) {
    const bullet = job.bullets.find((item) => item.id === bulletId)
    if (bullet) return bullet.text
  }
  return null
}

function findParentTitle(resume: Resume, parentType: 'skill' | 'job', parentId: string): string | null {
  if (parentType === 'skill') {
    return resume.skills.find((group) => group.id === parentId)?.title ?? null
  }
  return resume.experience.find((job) => job.id === parentId)?.title ?? null
}

interface ResumeToolProps {
  appSettings: AppSettings
  onAppSettingsChange: (next: AppSettings) => void
  onBack: () => void
  // DOM node (owned by AppShell) that this tool portals its Files/AI-tailored
  // sidebar panel into, plus a callback to signal whether that sidebar box
  // should currently be shown at all (mirrors ResumeMakerScreen's
  // onNavContextChange pattern for the left nav rail).
  editorSidebarNode: HTMLElement | null
  onEditorSidebarOpenChange: (open: boolean) => void
}

type SidebarTab = 'files' | 'aiTailored'

function ResumeTool({
  appSettings,
  onAppSettingsChange,
  onBack,
  editorSidebarNode,
  onEditorSidebarOpenChange,
}: ResumeToolProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('files')
  const [state, setState] = useState<SchemasState>(() => loadSchemasState())
  const [saveError, setSaveError] = useState(false)
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html')
  const [exportError, setExportError] = useState(false)
  const [exportMenuOpen, setExportMenuOpen] = useState(false)
  const exportMenuRef = useRef<HTMLUListElement>(null)
  const exportMenuTriggerRef = useRef<HTMLButtonElement>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)

  const [jobDescription, setJobDescription] = useState('')
  const [suggestions, setSuggestions] = useState<ResumeSuggestion[]>([])
  const [acceptedSuggestionIds, setAcceptedSuggestionIds] = useState<Set<string>>(new Set())
  const [suggestionsLoading, setSuggestionsLoading] = useState(false)
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null)

  const anthropicKey = appSettings.apiKeys.find((entry) => entry.provider === 'Anthropic')

  const updateAppSettings = (next: AppSettings) => {
    onAppSettingsChange(next)
    saveAppSettings(next)
  }

  const handleModelChange = (model: string) => {
    if (!anthropicKey) return
    updateAppSettings({
      ...appSettings,
      apiKeys: appSettings.apiKeys.map((entry) =>
        entry.id === anthropicKey.id ? { ...entry, model } : entry,
      ),
    })
  }

  const updateState = (next: SchemasState) => {
    setState(next)
    const saved = saveSchemasState(next)
    setSaveError(!saved)
  }

  const activeSchema = state.schemas.find((schema) => schema.id === state.activeSchemaId) ?? state.schemas[0]

  const activeVariation =
    activeSchema.variations.find((variation) => variation.id === activeSchema.activeVariationId) ??
    activeSchema.variations[0]

  const updateActiveSchema = (patch: Partial<Schema>) => {
    updateState({
      ...state,
      schemas: state.schemas.map((schema) =>
        schema.id === activeSchema.id ? { ...schema, ...patch } : schema,
      ),
    })
  }

  const handleResumeChange = (nextResume: Resume) => {
    updateActiveSchema({
      variations: activeSchema.variations.map((variation) =>
        variation.id === activeVariation.id
          ? {
              ...variation,
              resume: nextResume,
              ...(appSettings.autoFillVariationName
                ? {
                    name: buildAutoVariationName({
                      fullName: nextResume.header.name,
                      jobTitle: variation.jobTitle,
                    }),
                  }
                : {}),
            }
          : variation,
      ),
    })
  }

  const handleSelectVariation = (id: string) => {
    updateActiveSchema({ activeVariationId: id })
  }

  const handleRename = (name: string) => {
    updateActiveSchema({
      variations: activeSchema.variations.map((variation) =>
        variation.id === activeVariation.id ? { ...variation, name } : variation,
      ),
    })
  }

  const handleJobTitleChange = (jobTitle: string) => {
    updateActiveSchema({
      variations: activeSchema.variations.map((variation) =>
        variation.id === activeVariation.id
          ? {
              ...variation,
              jobTitle,
              ...(appSettings.autoFillVariationName
                ? {
                    name: buildAutoVariationName({
                      fullName: variation.resume.header.name,
                      jobTitle,
                    }),
                  }
                : {}),
            }
          : variation,
      ),
    })
  }

  const handleAddVariation = () => {
    const copy = {
      id: newId('variation'),
      name: appSettings.autoFillVariationName
        ? buildAutoVariationName({
            fullName: activeVariation.resume.header.name,
            jobTitle: activeVariation.jobTitle,
          })
        : `Copy of ${activeVariation.name}`,
      jobTitle: activeVariation.jobTitle,
      resume: activeVariation.resume,
    }
    updateActiveSchema({
      activeVariationId: copy.id,
      variations: [...activeSchema.variations, copy],
    })
  }

  const handleDeleteVariation = () => {
    if (activeSchema.variations.length <= 1) return
    if (!window.confirm(`Delete "${activeVariation.name}"? This can't be undone.`)) return

    const remaining = activeSchema.variations.filter((variation) => variation.id !== activeVariation.id)
    const stillActive = remaining.some((variation) => variation.id === activeSchema.activeVariationId)
    updateActiveSchema({
      activeVariationId: stillActive ? activeSchema.activeVariationId : remaining[0].id,
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

      const aiSettings = anthropicKey ? { apiKey: anthropicKey.apiKey, model: anthropicKey.model } : undefined

      let resume
      if (lowerName.endsWith('.html')) {
        const text = await file.text()
        resume = parseResumeHtml(text)
      } else if (lowerName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        resume = await parseResumeDocx(arrayBuffer, fallbackName, aiSettings)
      } else if (lowerName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer()
        resume = await parseResumePdf(arrayBuffer, fallbackName, aiSettings)
      } else {
        throw new Error('Unsupported file type. Please choose a .html, .docx, or .pdf file.')
      }

      const imported = {
        id: newId('variation'),
        name: `Imported: ${resume.header.name || file.name}`,
        jobTitle: '',
        resume,
      }
      updateActiveSchema({
        activeVariationId: imported.id,
        variations: [...activeSchema.variations, imported],
      })
    } catch (error) {
      console.error('Failed to import resume file', error)
      setImportError(
        error instanceof Error ? error.message : 'Could not import that file as a resume.',
      )
    }
  }

  // Mirrors EmojiPicker's outside-click/Escape-to-close pattern: the
  // trigger's own onClick is the sole thing that opens/closes the menu, so
  // clicks on the trigger must be excluded here to avoid a close-then-
  // reopen race when clicking an already-open trigger a second time.
  useEffect(() => {
    if (!exportMenuOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExportMenuOpen(false)
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (exportMenuRef.current?.contains(target)) return
      if (exportMenuTriggerRef.current?.contains(target)) return
      setExportMenuOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handlePointerDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handlePointerDown)
    }
  }, [exportMenuOpen])

  const handleExport = async (format: ExportFormat) => {
    setExportError(false)

    if (format === 'pdf') {
      try {
        const filename = buildResumeFilename({
          fullName: activeVariation.resume.header.name,
          jobTitle: activeVariation.jobTitle,
          extension: 'pdf',
        })
        const blob = await buildResumePdfBlob(activeVariation.resume)
        downloadBlob(filename, blob)
      } catch (error) {
        console.error('Failed to generate PDF export', error)
        setExportError(true)
      }
      return
    }

    try {
      await exportVariationAs(activeVariation.resume, activeVariation.jobTitle, format)
    } catch (error) {
      console.error('Failed to generate export', error)
      setExportError(true)
    }
  }

  const handleGetSuggestions = async () => {
    if (!anthropicKey) return
    setSuggestionsError(null)
    setSuggestionsLoading(true)
    try {
      const { suggestions: results, usage } = await generateResumeSuggestions(
        activeVariation.resume,
        activeVariation.jobTitle,
        jobDescription,
        { apiKey: anthropicKey.apiKey, model: anthropicKey.model },
      )
      setSuggestions(results)
      setAcceptedSuggestionIds(new Set())

      if (usage) {
        const additionalCost = estimateCostUsd(anthropicKey.model, usage.inputTokens, usage.outputTokens)
        const previousCost = anthropicKey.accumulatedCostUsd
        const nextCost =
          previousCost === null || additionalCost === null ? null : previousCost + additionalCost
        updateAppSettings({
          ...appSettings,
          apiKeys: appSettings.apiKeys.map((entry) =>
            entry.id === anthropicKey.id
              ? {
                  ...entry,
                  accumulatedCostUsd: nextCost,
                  accumulatedTokens: {
                    input: entry.accumulatedTokens.input + usage.inputTokens,
                    output: entry.accumulatedTokens.output + usage.outputTokens,
                  },
                }
              : entry,
          ),
        })
      }
    } catch (error) {
      console.error('Failed to generate AI suggestions', error)
      setSuggestionsError(
        error instanceof Error ? error.message : 'Could not generate suggestions.',
      )
      setSuggestions([])
    } finally {
      setSuggestionsLoading(false)
    }
  }

  const handleToggleSuggestion = (id: string) => {
    setAcceptedSuggestionIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleApplySuggestions = () => {
    const accepted = suggestions.filter((suggestion) => acceptedSuggestionIds.has(suggestion.id))
    if (accepted.length === 0) return

    const tailoredResume = applySuggestions(activeVariation.resume, accepted)
    const tailored = {
      id: newId('variation'),
      name: appSettings.autoFillVariationName
        ? buildAutoVariationName({
            fullName: tailoredResume.header.name,
            jobTitle: activeVariation.jobTitle,
          })
        : buildVariationLabel({
            fullName: tailoredResume.header.name,
            jobTitle: activeVariation.jobTitle,
          }),
      jobTitle: activeVariation.jobTitle,
      resume: tailoredResume,
    }
    updateActiveSchema({
      activeVariationId: tailored.id,
      variations: [...activeSchema.variations, tailored],
    })
    setSuggestions([])
    setAcceptedSuggestionIds(new Set())
  }

  // Seeded to `false` (not the live setting value) so that the very first
  // effect run — which always fires on mount regardless of the dependency
  // array — treats a setting that's already `true` on mount (the default)
  // as an off -> on transition and resyncs names then too.
  const wasAutoFillOnRef = useRef(false)

  useEffect(() => {
    const wasAutoFillOn = wasAutoFillOnRef.current
    wasAutoFillOnRef.current = appSettings.autoFillVariationName

    // Only resync on the off -> on transition, not on every render while
    // it's already on (which would fight with typing in a plain text field
    // in that other mode, and is simply unnecessary work while already on).
    if (!wasAutoFillOn && appSettings.autoFillVariationName) {
      updateActiveSchema({
        variations: activeSchema.variations.map((variation) => ({
          ...variation,
          name: buildAutoVariationName({
            fullName: variation.resume.header.name,
            jobTitle: variation.jobTitle,
          }),
        })),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only respond to the auto-fill toggle transitioning, not every render
  }, [appSettings.autoFillVariationName])

  const canGetSuggestions =
    anthropicKey !== undefined &&
    anthropicKey.apiKey.trim() !== '' &&
    anthropicKey.model.trim() !== '' &&
    jobDescription.trim() !== ''

  // Signals to the shell (via AppShell.tsx/ResumeMakerScreen.tsx) that the
  // right floating sidebar box should be shown while this tool is mounted,
  // and hidden again once it's left. The sidebar's actual JSX is rendered
  // below via a portal as part of this component's normal render (not
  // inside an effect), so it always has fresh handlers/state with no
  // dependency-array bookkeeping needed.
  useEffect(() => {
    onEditorSidebarOpenChange(true)
    return () => onEditorSidebarOpenChange(false)
  }, [onEditorSidebarOpenChange])

  const sidebar = (
    <div className="resume-tool-sidebar">
        <button type="button" className="variation-btn resume-tool-back-btn" onClick={onBack}>
          ← Back to variations
        </button>

        <div className="resume-tool-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'files'}
            className={`resume-tool-tab-btn${activeTab === 'files' ? ' resume-tool-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('files')}
          >
            Files
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'aiTailored'}
            className={`resume-tool-tab-btn${activeTab === 'aiTailored' ? ' resume-tool-tab-btn--active' : ''}`}
            onClick={() => setActiveTab('aiTailored')}
          >
            AI-tailored
          </button>
        </div>

        <div className="resume-tool-tab-panel">
          {activeTab === 'files' && (
            <div className="resume-tool-files-tab">
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

              <label className="variation-control">
                Variation
                <select
                  value={activeVariation.id}
                  onChange={(event) => handleSelectVariation(event.target.value)}
                  aria-label="Select resume variation"
                >
                  {activeSchema.variations.map((variation) => (
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
                  readOnly={appSettings.autoFillVariationName}
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

              <div className="resume-tool-btn-row">
                <button type="button" className="variation-btn" onClick={handleAddVariation}>
                  + New variation
                </button>
                <button
                  type="button"
                  className="variation-btn"
                  onClick={handleDeleteVariation}
                  disabled={activeSchema.variations.length <= 1}
                >
                  Delete variation
                </button>
              </div>

              <div className="export-menu-wrapper">
                <button
                  type="button"
                  ref={exportMenuTriggerRef}
                  className="variation-btn export-menu-trigger"
                  onClick={() => setExportMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={exportMenuOpen}
                >
                  Export as <span className="export-menu-caret">{exportMenuOpen ? '▾' : '▸'}</span>
                </button>
                {exportMenuOpen && (
                  <ul className="export-menu-panel" role="menu" ref={exportMenuRef} aria-label="Export format">
                    {EXPORT_FORMATS.map((format) => (
                      <li key={format.value} role="none">
                        <button
                          type="button"
                          role="menuitem"
                          className="export-menu-item"
                          onClick={() => {
                            setExportFormat(format.value)
                            setExportMenuOpen(false)
                            void handleExport(format.value)
                          }}
                        >
                          {format.label}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="resume-tool-btn-row">
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
                Filename:{' '}
                <code>
                  {buildResumeFilename({
                    fullName: activeVariation.resume.header.name,
                    jobTitle: activeVariation.jobTitle,
                    extension: exportFormat,
                  })}
                </code>
              </p>
            </div>
          )}

          {activeTab === 'aiTailored' && (
            <div className="ai-tailor-panel">
              <h2 className="ai-tailor-heading">AI-tailored suggestions</h2>

              {anthropicKey ? (
                <div className="ai-tailor-settings">
                  <label className="variation-control">
                    Model
                    <input
                      type="text"
                      value={anthropicKey.model}
                      onChange={(event) => handleModelChange(event.target.value)}
                      aria-label="Anthropic model id"
                      placeholder="e.g. claude-sonnet-4-5-20250929"
                    />
                  </label>
                </div>
              ) : (
                <p className="ai-tailor-note" role="alert">
                  No Anthropic API key configured — add one in Settings.
                </p>
              )}
              <p className="ai-tailor-note">
                Your API key is stored only in this browser and is used to call Anthropic&apos;s
                API directly from this page. Pasting a job posting link isn&apos;t supported yet
                (fetching arbitrary URLs from the browser runs into CORS with no backend) — paste
                the job description text instead.
              </p>

              <label className="ai-tailor-job-description">
                Job description
                <textarea
                  value={jobDescription}
                  onChange={(event) => setJobDescription(event.target.value)}
                  rows={6}
                  placeholder="Paste the job description text here"
                  aria-label="Job description"
                />
              </label>

              <button
                type="button"
                className="variation-btn"
                disabled={!canGetSuggestions || suggestionsLoading}
                onClick={() => {
                  void handleGetSuggestions()
                }}
              >
                {suggestionsLoading ? 'Generating…' : 'Get suggestions'}
              </button>

              {suggestionsError && (
                <div className="variation-save-warning" role="alert">
                  {suggestionsError}
                  <button
                    type="button"
                    className="variation-save-warning-dismiss"
                    onClick={() => setSuggestionsError(null)}
                    aria-label="Dismiss suggestions error"
                  >
                    &times;
                  </button>
                </div>
              )}

              {suggestions.length > 0 && (
                <div className="ai-tailor-suggestions">
                  <ul className="ai-tailor-suggestion-list">
                    {suggestions.map((suggestion) => (
                      <li key={suggestion.id} className="ai-tailor-suggestion">
                        <label>
                          <input
                            type="checkbox"
                            checked={acceptedSuggestionIds.has(suggestion.id)}
                            onChange={() => handleToggleSuggestion(suggestion.id)}
                          />
                          {suggestion.kind === 'replaceSummary' && (
                            <span>
                              <strong>Replace summary</strong> with: <em>{suggestion.newText}</em>
                            </span>
                          )}
                          {suggestion.kind === 'replaceTagline' && (
                            <span>
                              <strong>Replace tagline</strong> with: <em>{suggestion.newText}</em>
                            </span>
                          )}
                          {suggestion.kind === 'replaceBullet' && (
                            <span>
                              <strong>Replace bullet</strong>
                              {' — current: '}
                              <em>
                                {findBulletText(activeVariation.resume, suggestion.bulletId) ??
                                  '(bullet not found)'}
                              </em>
                              {' → proposed: '}
                              <em>{suggestion.newText}</em>
                            </span>
                          )}
                          {suggestion.kind === 'addBullet' && (
                            <span>
                              <strong>Add bullet</strong>
                              {' to '}
                              {suggestion.parentType === 'skill' ? 'skill group' : 'job'}
                              {' "'}
                              {findParentTitle(
                                activeVariation.resume,
                                suggestion.parentType,
                                suggestion.parentId,
                              ) ?? '(not found)'}
                              {'": '}
                              <em>{suggestion.newText}</em>
                            </span>
                          )}
                        </label>
                        {suggestion.rationale && (
                          <p className="ai-tailor-rationale">{suggestion.rationale}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="variation-btn"
                    disabled={acceptedSuggestionIds.size === 0}
                    onClick={handleApplySuggestions}
                  >
                    Apply selected
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
    </div>
  )

  return (
    <>
      <div className="resume-tool">
        <div className="resume-tool-body">
          <main className="resume-tool-main">
            <ResumePreview resume={activeVariation.resume} onChange={handleResumeChange} />
          </main>
        </div>
      </div>

      {editorSidebarNode && createPortal(sidebar, editorSidebarNode)}
    </>
  )
}

export default ResumeTool
