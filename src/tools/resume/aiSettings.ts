// Persistence for the AI-tailoring settings (API key + model id) used by
// aiTailor.ts. Backed by localStorage, wrapped in try/catch like
// variationsStorage.ts — storage errors should never crash the app, just
// degrade to an empty/default settings object.

const STORAGE_KEY = 'reforge.resume.aiSettings.v1'

export interface AiSettings {
  apiKey: string
  model: string
}

function defaultSettings(): AiSettings {
  return { apiKey: '', model: '' }
}

function isAiSettings(value: unknown): value is AiSettings {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AiSettings>
  return typeof candidate.apiKey === 'string' && typeof candidate.model === 'string'
}

export function loadAiSettings(): AiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultSettings()

    const parsed: unknown = JSON.parse(raw)
    return isAiSettings(parsed) ? parsed : defaultSettings()
  } catch {
    return defaultSettings()
  }
}

export function saveAiSettings(settings: AiSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Non-fatal: the settings just won't persist across reloads.
  }
}
