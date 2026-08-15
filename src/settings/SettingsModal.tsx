import { useEffect, useState } from 'react'
import type { ChangeEvent } from 'react'
import type { AppSettings, ApiKeyEntry, AppTheme, LayoutMode } from './settingsStore'
import { saveAppSettings } from './settingsStore'
import { detectProvider } from './providerDetection'
import { newId } from './id'
import ApiKeyRow from './ApiKeyRow'
import './SettingsModal.css'

type SettingsTab = 'general' | 'modelApi'

const FLOATING_BOX_SCALE_MIN = 0.6
const FLOATING_BOX_SCALE_MAX = 1

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

interface SettingsModalProps {
  settings: AppSettings
  onChange: (next: AppSettings) => void
  onClose: () => void
}

function SettingsModal({ settings, onChange, onClose }: SettingsModalProps) {
  const [tab, setTab] = useState<SettingsTab>('general')
  const [newKeyValue, setNewKeyValue] = useState('')
  const [newKeyRevealed, setNewKeyRevealed] = useState(false)
  const [saveError, setSaveError] = useState(false)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const updateSettings = (next: AppSettings) => {
    onChange(next)
    const saved = saveAppSettings(next)
    setSaveError(!saved)
  }

  const handleToggleAutoFill = () => {
    updateSettings({ ...settings, autoFillVariationName: !settings.autoFillVariationName })
  }

  const handleChangeAppTheme = (event: ChangeEvent<HTMLSelectElement>) => {
    updateSettings({ ...settings, appTheme: event.target.value as AppTheme })
  }

  const handleChangeFloatingBoxScale = (event: ChangeEvent<HTMLInputElement>) => {
    const parsed = parseFloat(event.target.value)
    updateSettings({ ...settings, floatingBoxScale: parsed })
  }

  const handleChangeLayoutMode = (mode: LayoutMode) => {
    updateSettings({ ...settings, layoutMode: mode })
  }

  const handleAddKey = () => {
    const trimmed = newKeyValue.trim()
    if (trimmed === '') return
    const provider = detectProvider(trimmed)
    const entry: ApiKeyEntry = {
      id: newId('apikey'),
      provider,
      label: `${provider} — API Key`,
      apiKey: trimmed,
      model: '',
      accumulatedCostUsd: null,
      accumulatedTokens: { input: 0, output: 0 },
    }
    updateSettings({ ...settings, apiKeys: [...settings.apiKeys, entry] })
    setNewKeyValue('')
    setNewKeyRevealed(false)
  }

  const handleSaveKey = (updated: ApiKeyEntry) => {
    updateSettings({
      ...settings,
      apiKeys: settings.apiKeys.map((entry) => (entry.id === updated.id ? updated : entry)),
    })
  }

  const handleDeleteKey = (id: string) => {
    updateSettings({ ...settings, apiKeys: settings.apiKeys.filter((entry) => entry.id !== id) })
  }

  return (
    <div
      className="settings-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="settings-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-modal-header">
          <h2 className="settings-modal-title">Settings</h2>
          <button type="button" className="settings-modal-close" onClick={onClose} aria-label="Close settings">
            &times;
          </button>
        </div>

        {saveError && (
          <div className="settings-save-warning" role="alert">
            Couldn&apos;t save — your changes may not persist.
            <button
              type="button"
              className="settings-save-warning-dismiss"
              onClick={() => setSaveError(false)}
              aria-label="Dismiss save warning"
            >
              &times;
            </button>
          </div>
        )}

        <div className="settings-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'general'}
            className={`settings-modal-tab${tab === 'general' ? ' active' : ''}`}
            onClick={() => setTab('general')}
          >
            General
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'modelApi'}
            className={`settings-modal-tab${tab === 'modelApi' ? ' active' : ''}`}
            onClick={() => setTab('modelApi')}
          >
            Model API
          </button>
        </div>

        <div className="settings-modal-body">
          {tab === 'general' && (
            <div className="settings-general-tab">
              <label className="settings-checkbox-row">
                <input
                  type="checkbox"
                  checked={settings.autoFillVariationName}
                  onChange={handleToggleAutoFill}
                />
                Auto-fill variation name
              </label>

              <label className="settings-select-row">
                Style
                <select value={settings.appTheme} onChange={handleChangeAppTheme}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="parchment">Parchment</option>
                  <option value="gruvbox-dark">Gruvbox Dark</option>
                  <option value="system">System</option>
                </select>
              </label>

              <label className="settings-slider-row">
                <span>
                  Floating box size:{' '}
                  {Math.round(
                    clamp(settings.floatingBoxScale, FLOATING_BOX_SCALE_MIN, FLOATING_BOX_SCALE_MAX) * 100
                  )}
                  %
                </span>
                <input
                  type="range"
                  min={FLOATING_BOX_SCALE_MIN}
                  max={FLOATING_BOX_SCALE_MAX}
                  step="0.05"
                  value={clamp(settings.floatingBoxScale, FLOATING_BOX_SCALE_MIN, FLOATING_BOX_SCALE_MAX)}
                  onChange={handleChangeFloatingBoxScale}
                  aria-label="Floating box size"
                />
              </label>

              <fieldset className="settings-radio-group">
                <legend>Layout</legend>
                <label>
                  <input
                    type="radio"
                    name="layoutMode"
                    value="spread"
                    checked={settings.layoutMode === 'spread'}
                    onChange={() => handleChangeLayoutMode('spread')}
                  />
                  Spread
                </label>
                <label>
                  <input
                    type="radio"
                    name="layoutMode"
                    value="compact"
                    checked={settings.layoutMode === 'compact'}
                    onChange={() => handleChangeLayoutMode('compact')}
                  />
                  Compact
                </label>
              </fieldset>
            </div>
          )}

          {tab === 'modelApi' && (
            <div className="settings-model-api-tab">
              {settings.apiKeys.length === 0 ? (
                <p className="settings-empty-note">No API keys saved yet.</p>
              ) : (
                <ul className="api-key-list">
                  {settings.apiKeys.map((entry) => (
                    <ApiKeyRow
                      key={entry.id}
                      entry={entry}
                      onSave={handleSaveKey}
                      onDelete={() => handleDeleteKey(entry.id)}
                    />
                  ))}
                </ul>
              )}

              <div className="settings-add-provider">
                <h3 className="settings-add-provider-heading">Add provider</h3>
                <div className="settings-add-provider-row">
                  <input
                    type={newKeyRevealed ? 'text' : 'password'}
                    value={newKeyValue}
                    onChange={(event) => setNewKeyValue(event.target.value)}
                    placeholder="Paste API key"
                    aria-label="New API key"
                    autoComplete="off"
                  />
                  <button
                    type="button"
                    className="settings-btn"
                    onClick={() => setNewKeyRevealed((prev) => !prev)}
                  >
                    {newKeyRevealed ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    className="settings-btn"
                    onClick={handleAddKey}
                    disabled={newKeyValue.trim() === ''}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal
