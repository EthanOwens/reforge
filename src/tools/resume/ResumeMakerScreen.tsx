import { useState } from 'react'
import ResumeTool from './ResumeTool'
import { defaultResume } from './defaultResume'
import { newId } from './id'
import { loadSchemasState, saveSchemasState } from './variationsStorage'
import type { Schema, SchemasState, Variation } from './variationsStorage'
import type { AppSettings } from '../../settings/settingsStore'
import './ResumeMakerScreen.css'

type Step = 'schemas' | 'variations' | 'editor'

interface ResumeMakerScreenProps {
  appSettings: AppSettings
  onAppSettingsChange: (next: AppSettings) => void
  onExit: () => void
}

function newVariationFrom(source: Variation, name: string): Variation {
  return {
    id: newId('variation'),
    name,
    jobTitle: source.jobTitle,
    resume: source.resume,
  }
}

function ResumeMakerScreen({ appSettings, onAppSettingsChange, onExit }: ResumeMakerScreenProps) {
  const [step, setStep] = useState<Step>('schemas')
  const [state, setState] = useState<SchemasState>(() => loadSchemasState())
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null)

  const goToSchemas = () => {
    setState(loadSchemasState())
    setSelectedSchemaId(null)
    setStep('schemas')
  }

  const goToVariations = (schemaId: string) => {
    setState(loadSchemasState())
    setSelectedSchemaId(schemaId)
    setStep('variations')
  }

  const selectedSchema = selectedSchemaId
    ? state.schemas.find((schema) => schema.id === selectedSchemaId) ?? null
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
      name: 'My Resume',
      jobTitle: '',
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
    setSelectedSchemaId(schemaId)
    setStep('editor')
  }

  const handleNewVariation = (schema: Schema) => {
    const source = schema.variations[0]
    const variation = newVariationFrom(source, `Copy of ${source.name}`)
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
    setSelectedSchemaId(schema.id)
    setStep('editor')
  }

  if (step === 'editor' && selectedSchema) {
    return (
      <ResumeTool
        appSettings={appSettings}
        onAppSettingsChange={onAppSettingsChange}
        onBack={() => goToVariations(selectedSchema.id)}
      />
    )
  }

  if (step === 'variations' && selectedSchema) {
    const favorites = selectedSchema.variations.filter((variation) => variation.favorite)
    const rest = selectedSchema.variations.filter((variation) => !variation.favorite)

    const renderTile = (variation: Variation) => (
      <div
        key={variation.id}
        className="resume-maker-tile resume-maker-variation-tile"
        role="button"
        tabIndex={0}
        onClick={() => handleSelectVariation(selectedSchema.id, variation.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            handleSelectVariation(selectedSchema.id, variation.id)
          }
        }}
      >
        <span className="resume-maker-tile-title">{variation.name}</span>
        <button
          type="button"
          className={`resume-maker-favorite-btn${variation.favorite ? ' active' : ''}`}
          aria-label={variation.favorite ? 'Unfavorite variation' : 'Favorite variation'}
          onClick={(event) => {
            event.stopPropagation()
            handleToggleFavorite(selectedSchema.id, variation.id)
          }}
        >
          {variation.favorite ? '★' : '☆'}
        </button>
      </div>
    )

    return (
      <div className="resume-maker-screen">
        <button type="button" className="resume-maker-back" onClick={goToSchemas}>
          ← Back to schemas
        </button>
        <h2 className="resume-maker-heading">{selectedSchema.name}</h2>

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
              onClick={() => handleNewVariation(selectedSchema)}
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
      <button type="button" className="resume-maker-back" onClick={onExit}>
        ← Back to Reforge
      </button>
      <h2 className="resume-maker-heading">Resume schemas</h2>
      <div className="resume-maker-tiles">
        {state.schemas.map((schema) => (
          <button
            type="button"
            key={schema.id}
            className="resume-maker-tile"
            onClick={() => goToVariations(schema.id)}
          >
            <span className="resume-maker-tile-title">{schema.name}</span>
          </button>
        ))}
        <button type="button" className="resume-maker-tile resume-maker-tile-new" onClick={handleNewSchema}>
          + New schema
        </button>
      </div>
    </div>
  )
}

export default ResumeMakerScreen
