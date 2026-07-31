import { useState } from 'react'
import ResumePreview from './ResumePreview'
import { buildResumeFilename } from './filename'
import { newId } from './id'
import type { Resume } from './types'
import { loadVariationsState, saveVariationsState } from './variationsStorage'
import type { VariationsState } from './variationsStorage'
import './ResumeTool.css'

function ResumeTool() {
  const [state, setState] = useState<VariationsState>(() => loadVariationsState())
  const [saveError, setSaveError] = useState(false)

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
      </div>

      <p className="variation-filename-preview">
        Suggested filename (preview only):{' '}
        <code>
          {buildResumeFilename({
            fullName: activeVariation.resume.header.name,
            jobTitle: activeVariation.jobTitle,
            extension: 'pdf',
          })}
        </code>
      </p>

      <ResumePreview resume={activeVariation.resume} onChange={handleResumeChange} />
    </div>
  )
}

export default ResumeTool
