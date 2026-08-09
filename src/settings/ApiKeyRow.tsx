import { useState } from 'react'
import type { ApiKeyEntry } from './settingsStore'
import { detectProvider, getKeyPrefix } from './providerDetection'

interface ApiKeyRowProps {
  entry: ApiKeyEntry
  onSave: (updated: ApiKeyEntry) => void
  onDelete: () => void
}

// Masks a key by showing its identifying provider prefix followed by a
// truncation, e.g. `sk-ant-•••…`, so the masked value still hints at which
// provider it belongs to without exposing the rest of the key.
function maskKey(apiKey: string): string {
  const prefix = getKeyPrefix(apiKey)
  if (prefix) return `${prefix}•••…`
  // Unrecognized key format — no identifying prefix to show; fall back to a
  // short generic mask so it's still clear something is hidden without
  // implying a specific provider.
  return apiKey.length <= 4 ? '•'.repeat(apiKey.length) : `${apiKey.slice(0, 2)}•••…`
}

function formatCost(entry: ApiKeyEntry): { text: string; className: string } {
  const hasUsage = entry.accumulatedTokens.input > 0 || entry.accumulatedTokens.output > 0
  if (typeof entry.accumulatedCostUsd === 'number') {
    return { text: `$${entry.accumulatedCostUsd.toFixed(4)}`, className: 'api-key-cost-known' }
  }
  if (hasUsage) {
    return { text: 'cost unknown', className: 'api-key-cost-unknown' }
  }
  return { text: 'no usage yet', className: 'api-key-cost-none' }
}

function ApiKeyRow({ entry, onSave, onDelete }: ApiKeyRowProps) {
  const [revealed, setRevealed] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftKey, setDraftKey] = useState(entry.apiKey)
  const [draftRevealed, setDraftRevealed] = useState(false)

  const cost = formatCost(entry)

  const startEditing = () => {
    setDraftKey(entry.apiKey)
    setDraftRevealed(false)
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
  }

  const saveEditing = () => {
    const trimmed = draftKey.trim()
    if (trimmed === '') return
    const provider = detectProvider(trimmed)
    const keyChanged = trimmed !== entry.apiKey
    onSave({
      ...entry,
      apiKey: trimmed,
      provider,
      label: `${provider} — API Key`,
      ...(keyChanged
        ? { accumulatedCostUsd: null, accumulatedTokens: { input: 0, output: 0 } }
        : {}),
    })
    setEditing(false)
  }

  const handleDelete = () => {
    if (!window.confirm(`Delete "${entry.label}"? This can't be undone.`)) return
    onDelete()
  }

  if (editing) {
    return (
      <li className="api-key-row">
        <div className="api-key-edit-row">
          <input
            type={draftRevealed ? 'text' : 'password'}
            value={draftKey}
            onChange={(event) => setDraftKey(event.target.value)}
            aria-label={`Edit API key for ${entry.label}`}
            autoComplete="off"
          />
          <button type="button" className="settings-btn" onClick={() => setDraftRevealed((prev) => !prev)}>
            {draftRevealed ? 'Hide' : 'Show'}
          </button>
          <button type="button" className="settings-btn" onClick={saveEditing}>
            Save
          </button>
          <button type="button" className="settings-btn" onClick={cancelEditing}>
            Cancel
          </button>
        </div>
      </li>
    )
  }

  return (
    <li className="api-key-row">
      <div className="api-key-row-main">
        <span className="api-key-label">{entry.label}</span>
        <code className="api-key-masked">{revealed ? entry.apiKey : maskKey(entry.apiKey)}</code>
        <span className={`api-key-cost ${cost.className}`}>{cost.text}</span>
      </div>
      <div className="api-key-row-actions">
        <button type="button" className="settings-btn" onClick={() => setRevealed((prev) => !prev)}>
          {revealed ? 'Hide' : 'Show'}
        </button>
        <button type="button" className="settings-btn" onClick={startEditing}>
          Edit
        </button>
        <button type="button" className="settings-btn" onClick={handleDelete}>
          Delete
        </button>
      </div>
    </li>
  )
}

export default ApiKeyRow
