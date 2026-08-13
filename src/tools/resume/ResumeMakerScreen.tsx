import { useEffect, useState } from 'react'
import ResumeTool from './ResumeTool'
import { defaultResume } from './defaultResume'
import { newId } from './id'
import { buildAutoVariationName } from './filename'
import { loadSchemasState, saveSchemasState } from './variationsStorage'
import type { Schema, SchemasState, Variation } from './variationsStorage'
import { exportVariationAs } from './exportVariation'
import type { QuickExportFormat } from './exportVariation'
import type { AppSettings } from '../../settings/settingsStore'
import ResumeThumbnail from './ResumeThumbnail'
import './ResumeMakerScreen.css'

const QUICK_EXPORT_FORMATS: Array<{ value: QuickExportFormat; label: string }> = [
  { value: 'html', label: 'HTML' },
  { value: 'txt', label: 'Text (.txt)' },
  { value: 'md', label: 'Markdown (.md)' },
  { value: 'docx', label: 'Word (.docx)' },
]

type Step = 'schemas' | 'variations' | 'editor'

interface ResumeMakerScreenProps {
  appSettings: AppSettings
  onAppSettingsChange: (next: AppSettings) => void
  onExit: () => void
  // Lets this screen populate/clear the shell's left nav rail with
  // contextual actions (e.g. Rename/Open/Delete for a highlighted schema).
  onNavContextChange: (node: React.ReactNode) => void
  // DOM node (owned by AppShell) that the deep editor (ResumeTool) portals
  // its Files/AI-tailored sidebar panel into, plus a callback to signal
  // whether that sidebar box should currently be shown at all.
  editorSidebarNode: HTMLElement | null
  onEditorSidebarOpenChange: (open: boolean) => void
}

function newVariationFrom(source: Variation, name: string): Variation {
  return {
    id: newId('variation'),
    name,
    jobTitle: source.jobTitle,
    resume: source.resume,
  }
}

function ResumeMakerScreen({
  appSettings,
  onAppSettingsChange,
  onExit: _onExit,
  onNavContextChange,
  editorSidebarNode,
  onEditorSidebarOpenChange,
}: ResumeMakerScreenProps) {
  const [step, setStep] = useState<Step>('schemas')
  const [state, setState] = useState<SchemasState>(() => loadSchemasState())
  // The schema actually navigated into (driving the 'variations'/'editor'
  // steps) — distinct from `highlightedSchemaId` below, which only tracks
  // which tile is selected/highlighted on the 'schemas' step itself.
  const [openSchemaId, setOpenSchemaId] = useState<string | null>(null)
  const [highlightedSchemaId, setHighlightedSchemaId] = useState<string | null>(null)
  // Tracks which variation tile is highlighted on the 'variations' step —
  // separate from `openSchemaId`/`step`, which drive actual navigation.
  const [highlightedVariationId, setHighlightedVariationId] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<QuickExportFormat>('html')
  const [exportFailed, setExportFailed] = useState(false)

  const goToSchemas = () => {
    setState(loadSchemasState())
    setOpenSchemaId(null)
    setStep('schemas')
  }

  const goToVariations = (schemaId: string) => {
    setState(loadSchemasState())
    setOpenSchemaId(schemaId)
    setHighlightedSchemaId(null)
    setHighlightedVariationId(null)
    setStep('variations')
  }

  const openSchema = openSchemaId
    ? state.schemas.find((schema) => schema.id === openSchemaId) ?? null
    : null

  const updateState = (next: SchemasState) => {
    setState(next)
    saveSchemasState(next)
  }

  const handleNewSchema = () => {
    const name = window.prompt('Name for the new schema?', 'My Resume')
    if (!name || !name.trim()) return

    const variation: Variation = {
      id: newId('variation'),
      // No real user data exists yet for a brand-new schema, so there's nothing
      // meaningful to auto-fill from — always use the default name here.
      name: 'My Resume',
      jobTitle: defaultResume.header.tagline,
      resume: defaultResume,
    }
    const schema: Schema = {
      id: newId('schema'),
      name: name.trim(),
      variations: [variation],
      activeVariationId: variation.id,
    }
    const next: SchemasState = { ...state, schemas: [...state.schemas, schema] }
    updateState(next)
    goToVariations(schema.id)
  }

  const handleToggleFavorite = (schemaId: string, variationId: string) => {
    const next: SchemasState = {
      ...state,
      schemas: state.schemas.map((schema) =>
        schema.id === schemaId
          ? {
              ...schema,
              variations: schema.variations.map((variation) =>
                variation.id === variationId
                  ? { ...variation, favorite: !variation.favorite }
                  : variation,
              ),
            }
          : schema,
      ),
    }
    updateState(next)
  }

  const handleSelectVariation = (schemaId: string, variationId: string) => {
    const next: SchemasState = {
      ...state,
      activeSchemaId: schemaId,
      schemas: state.schemas.map((schema) =>
        schema.id === schemaId ? { ...schema, activeVariationId: variationId } : schema,
      ),
    }
    updateState(next)
    setOpenSchemaId(schemaId)
    setHighlightedVariationId(null)
    setStep('editor')
  }

  const handleNewVariation = (schema: Schema) => {
    const source = schema.variations[0]
    const name = appSettings.autoFillVariationName
      ? buildAutoVariationName({ fullName: source.resume.header.name, jobTitle: source.jobTitle })
      : `Copy of ${source.name}`
    const variation = newVariationFrom(source, name)
    const next: SchemasState = {
      ...state,
      activeSchemaId: schema.id,
      schemas: state.schemas.map((entry) =>
        entry.id === schema.id
          ? { ...entry, variations: [...entry.variations, variation], activeVariationId: variation.id }
          : entry,
      ),
    }
    updateState(next)
    setOpenSchemaId(schema.id)
    setStep('editor')
  }

  const handleRenameSchema = (schema: Schema) => {
    const name = window.prompt('Rename schema', schema.name)
    if (!name || !name.trim()) return

    const next: SchemasState = {
      ...state,
      schemas: state.schemas.map((entry) =>
        entry.id === schema.id ? { ...entry, name: name.trim() } : entry,
      ),
    }
    updateState(next)
  }

  const handleDeleteSchema = (schema: Schema) => {
    if (!window.confirm(`Delete "${schema.name}"? This can't be undone.`)) return

    const remaining = state.schemas.filter((entry) => entry.id !== schema.id)
    const next: SchemasState = {
      ...state,
      schemas: remaining,
      activeSchemaId:
        state.activeSchemaId === schema.id ? (remaining[0]?.id ?? '') : state.activeSchemaId,
    }
    updateState(next)
    setHighlightedSchemaId(null)
  }

  const handleRenameVariation = (variation: Variation) => {
    if (!openSchema) return
    const name = window.prompt('Rename variation', variation.name)
    if (!name || !name.trim()) return

    const next: SchemasState = {
      ...state,
      schemas: state.schemas.map((entry) =>
        entry.id === openSchema.id
          ? {
              ...entry,
              variations: entry.variations.map((entryVariation) =>
                entryVariation.id === variation.id
                  ? { ...entryVariation, name: name.trim() }
                  : entryVariation,
              ),
            }
          : entry,
      ),
    }
    updateState(next)
  }

  const handleDeleteVariation = (schemaId: string, variation: Variation) => {
    const schema = state.schemas.find((entry) => entry.id === schemaId)
    if (!schema) return
    // A schema must always keep at least one variation, matching the same
    // rule enforced inside the deep editor (ResumeTool.tsx's own
    // handleDeleteVariation).
    if (schema.variations.length <= 1) return
    if (!window.confirm(`Delete "${variation.name}"? This can't be undone.`)) return

    const remaining = schema.variations.filter((entry) => entry.id !== variation.id)
    const stillActive = remaining.some((entry) => entry.id === schema.activeVariationId)
    const next: SchemasState = {
      ...state,
      schemas: state.schemas.map((entry) =>
        entry.id === schemaId
          ? {
              ...entry,
              variations: remaining,
              activeVariationId: stillActive ? entry.activeVariationId : remaining[0].id,
            }
          : entry,
      ),
    }
    updateState(next)
    setHighlightedVariationId(null)
  }

  // Keeps the shell's left nav rail in sync with whichever schema is
  // currently highlighted on the 'schemas' step, clearing it whenever
  // nothing's highlighted or the step changes away from 'schemas'.
  useEffect(() => {
    if (step !== 'schemas' || !highlightedSchemaId) {
      onNavContextChange(null)
      return
    }
    const schema = state.schemas.find((entry) => entry.id === highlightedSchemaId)
    if (!schema) {
      onNavContextChange(null)
      return
    }

    onNavContextChange(
      <div className="resume-maker-nav-context">
        <span className="resume-maker-nav-context-title">{schema.name}</span>
        <button type="button" className="app-shell-nav-entry" onClick={() => goToVariations(schema.id)}>
          Open
        </button>
        <button type="button" className="app-shell-nav-entry" onClick={() => handleRenameSchema(schema)}>
          Rename
        </button>
        <button type="button" className="app-shell-nav-entry" onClick={() => handleDeleteSchema(schema)}>
          Delete
        </button>
      </div>,
    )
  }, [step, highlightedSchemaId, state, onNavContextChange])

  // Keeps the shell's left nav rail in sync with the 'variations' step: a
  // persistent Back entry, plus Rename/Open/Delete/Export actions for
  // whichever variation tile is currently highlighted (if any).
  useEffect(() => {
    if (step !== 'variations' || !openSchema) {
      return
    }

    const variation = highlightedVariationId
      ? openSchema.variations.find((entry) => entry.id === highlightedVariationId) ?? null
      : null

    onNavContextChange(
      <div className="resume-maker-nav-context">
        <button type="button" className="app-shell-nav-entry" onClick={goToSchemas}>
          ← Back
        </button>

        {variation && (
          <>
            <span className="resume-maker-nav-context-title">{variation.name}</span>
            <button
              type="button"
              className="app-shell-nav-entry"
              onClick={() => handleSelectVariation(openSchema.id, variation.id)}
            >
              Open
            </button>
            <button
              type="button"
              className="app-shell-nav-entry"
              onClick={() => handleRenameVariation(variation)}
            >
              Rename
            </button>
            <button
              type="button"
              className="app-shell-nav-entry"
              onClick={() => handleDeleteVariation(openSchema.id, variation)}
              disabled={openSchema.variations.length <= 1}
            >
              Delete
            </button>
            <label className="resume-maker-nav-context-export">
              Export as
              <select
                value={exportFormat}
                onChange={(event) => setExportFormat(event.target.value as QuickExportFormat)}
                aria-label="Quick export format"
              >
                {QUICK_EXPORT_FORMATS.map((format) => (
                  <option key={format.value} value={format.value}>
                    {format.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              className="app-shell-nav-entry"
              onClick={() => {
                setExportFailed(false)
                exportVariationAs(variation.resume, variation.jobTitle, exportFormat).catch((error) => {
                  console.error('Failed to export variation', error)
                  setExportFailed(true)
                })
              }}
            >
              Export
            </button>
            {exportFailed && (
              <span className="resume-maker-nav-context-error" role="alert">
                Couldn&apos;t generate that export — please try again.
              </span>
            )}
          </>
        )}
      </div>,
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps -- handleSelectVariation/handleRenameVariation/handleDeleteVariation are recreated each render but always operate on current state/openSchema, which are already deps
  }, [step, openSchema, highlightedVariationId, exportFormat, exportFailed, onNavContextChange])

  // Clear the rail's contextual actions when this screen unmounts (e.g. the
  // user navigates to a different tool, or the shell remounts this screen)
  // so they don't linger stale.
  useEffect(() => {
    return () => onNavContextChange(null)
  }, [onNavContextChange])

  if (step === 'editor' && openSchema) {
    return (
      <ResumeTool
        appSettings={appSettings}
        onAppSettingsChange={onAppSettingsChange}
        onBack={() => goToVariations(openSchema.id)}
        editorSidebarNode={editorSidebarNode}
        onEditorSidebarOpenChange={onEditorSidebarOpenChange}
        onNavContextChange={onNavContextChange}
      />
    )
  }

  if (step === 'variations' && openSchema) {
    const favorites = openSchema.variations.filter((variation) => variation.favorite)
    const rest = openSchema.variations.filter((variation) => !variation.favorite)

    const renderTile = (variation: Variation) => (
      <div
        key={variation.id}
        className={`resume-maker-tile resume-maker-variation-tile${highlightedVariationId === variation.id ? ' selected' : ''}`}
        role="button"
        tabIndex={0}
        onClick={() => {
          setHighlightedVariationId(variation.id)
          setExportFailed(false)
        }}
        onDoubleClick={() => handleSelectVariation(openSchema.id, variation.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            if (highlightedVariationId === variation.id) {
              handleSelectVariation(openSchema.id, variation.id)
            } else {
              setHighlightedVariationId(variation.id)
              setExportFailed(false)
            }
          }
        }}
      >
        <ResumeThumbnail resume={variation.resume} />
        <button
          type="button"
          className={`resume-maker-favorite-btn${variation.favorite ? ' active' : ''}`}
          aria-label={variation.favorite ? 'Unfavorite variation' : 'Favorite variation'}
          onClick={(event) => {
            event.stopPropagation()
            handleToggleFavorite(openSchema.id, variation.id)
          }}
        >
          {variation.favorite ? '★' : '☆'}
        </button>
        <span className="resume-maker-tile-title">{variation.name}</span>
      </div>
    )

    return (
      <div className="resume-maker-screen">
        <h2 className="resume-maker-heading">{openSchema.name}</h2>

        {favorites.length > 0 && (
          <div className="resume-maker-section">
            <h3 className="resume-maker-subheading">Favorites</h3>
            <div className="resume-maker-tiles">{favorites.map(renderTile)}</div>
          </div>
        )}

        <div className="resume-maker-section">
          {favorites.length > 0 && <h3 className="resume-maker-subheading">All variations</h3>}
          <div className="resume-maker-tiles">
            {rest.map(renderTile)}
            <button
              type="button"
              className="resume-maker-tile resume-maker-tile-new"
              onClick={() => handleNewVariation(openSchema)}
            >
              + New variation
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="resume-maker-screen">
      <h2 className="resume-maker-heading">Resume schemas</h2>
      {state.schemas.length === 0 && (
        <p className="resume-maker-empty-state">No schemas yet — create one below.</p>
      )}
      <div className="resume-maker-tiles">
        {state.schemas.map((schema) => {
          const activeVariation =
            schema.variations.find((variation) => variation.id === schema.activeVariationId) ??
            schema.variations[0]

          return (
            <button
              type="button"
              key={schema.id}
              className={`resume-maker-tile${highlightedSchemaId === schema.id ? ' selected' : ''}`}
              onClick={() => setHighlightedSchemaId(schema.id)}
              onDoubleClick={() => goToVariations(schema.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  if (highlightedSchemaId === schema.id) {
                    goToVariations(schema.id)
                  } else {
                    setHighlightedSchemaId(schema.id)
                  }
                }
              }}
            >
              {activeVariation && <ResumeThumbnail resume={activeVariation.resume} />}
              <span className="resume-maker-tile-title">{schema.name}</span>
            </button>
          )
        })}
        <button type="button" className="resume-maker-tile resume-maker-tile-new" onClick={handleNewSchema}>
          + New schema
        </button>
      </div>
    </div>
  )
}

export default ResumeMakerScreen
