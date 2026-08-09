// Persistence for app-wide settings (as opposed to per-tool state like the
// resume tool's variations). Backed by localStorage so settings survive a
// page reload; wrapped in try/catch throughout since localStorage can throw
// (private browsing, storage disabled, quota exceeded, corrupted/foreign
// JSON) and none of that should crash the app — callers always get a usable
// settings object back. Follows the same pattern as
// `src/tools/resume/variationsStorage.ts`.

const STORAGE_KEY = 'reforge.appSettings.v1'

export interface ApiKeyEntry {
  id: string
  provider: string // e.g. "Anthropic", "OpenAI", "Unknown"
  label: string // e.g. "Anthropic — API Key"
  apiKey: string
  model: string // model id used for generation with this key, e.g. "claude-sonnet-4-5-20250929"
  accumulatedCostUsd: number | null // null = "cost unknown" (unpriced usage occurred)
  accumulatedTokens: { input: number; output: number }
}

export type AppTheme = 'light' | 'dark' | 'off-white' | 'system'

const APP_THEMES: AppTheme[] = ['light', 'dark', 'off-white', 'system']

export interface AppSettings {
  autoFillVariationName: boolean
  apiKeys: ApiKeyEntry[]
  appTheme: AppTheme
}

export function defaultAppSettings(): AppSettings {
  return { autoFillVariationName: true, apiKeys: [], appTheme: 'system' }
}

function isApiKeyEntry(value: unknown): value is ApiKeyEntry {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<ApiKeyEntry>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.provider === 'string' &&
    typeof candidate.label === 'string' &&
    typeof candidate.apiKey === 'string' &&
    typeof candidate.model === 'string' &&
    (candidate.accumulatedCostUsd === null || typeof candidate.accumulatedCostUsd === 'number') &&
    typeof candidate.accumulatedTokens === 'object' &&
    candidate.accumulatedTokens !== null &&
    typeof candidate.accumulatedTokens.input === 'number' &&
    typeof candidate.accumulatedTokens.output === 'number'
  )
}

function isAppSettings(value: unknown): value is AppSettings {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<AppSettings>
  if (typeof candidate.autoFillVariationName !== 'boolean') return false
  if (!Array.isArray(candidate.apiKeys)) return false
  if (typeof candidate.appTheme !== 'string' || !APP_THEMES.includes(candidate.appTheme as AppTheme)) return false
  return candidate.apiKeys.every(isApiKeyEntry)
}

// Backfills `model` on API key entries persisted before that field existed,
// so upgrading the schema doesn't wipe out a user's existing settings. Only
// touches the one known-missing field; everything else still goes through
// the full structural check below.
function withModelBackfill(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const candidate = value as Partial<AppSettings>
  if (!Array.isArray(candidate.apiKeys)) return value
  return {
    ...candidate,
    apiKeys: candidate.apiKeys.map((entry) =>
      entry && typeof entry === 'object' && typeof (entry as ApiKeyEntry).model !== 'string'
        ? { ...entry, model: '' }
        : entry,
    ),
  }
}

// Backfills `appTheme` on settings persisted before that field existed, so
// upgrading the schema doesn't wipe out a user's existing settings. Only
// touches the one known-missing/invalid field; everything else still goes
// through the full structural check below.
function withAppThemeBackfill(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const candidate = value as Partial<AppSettings>
  if (typeof candidate.appTheme === 'string' && APP_THEMES.includes(candidate.appTheme as AppTheme)) return value
  return { ...candidate, appTheme: 'system' }
}

export function loadAppSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultAppSettings()

    const parsed: unknown = withAppThemeBackfill(withModelBackfill(JSON.parse(raw)))
    if (!isAppSettings(parsed)) return defaultAppSettings()

    return parsed
  } catch {
    return defaultAppSettings()
  }
}

// Returns true on success, false if the write failed (storage
// disabled/full/unavailable) so callers can surface the failure to the user
// instead of assuming the edit was durably persisted.
export function saveAppSettings(settings: AppSettings): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    return true
  } catch {
    return false
  }
}
