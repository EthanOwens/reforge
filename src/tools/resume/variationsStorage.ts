// Persistence for the Resume tool's named variations (e.g. one per job
// application), grouped into "schemas" (e.g. one per base resume/career
// track). Backed by localStorage so data survives a page reload; wrapped in
// try/catch throughout since localStorage can throw (private browsing,
// storage disabled, quota exceeded, corrupted/foreign JSON) and none of that
// should crash the app — callers always get a usable state back.

import { defaultResume } from './defaultResume'
import { newId } from './id'
import type { Resume } from './types'

const STORAGE_KEY = 'reforge.resume.schemas.v1'
const OLD_VARIATIONS_STORAGE_KEY = 'reforge.resume.variations.v1'

export interface Variation {
  id: string
  name: string
  // The job title being applied for with this variation — a property of the
  // application, not of the resume content itself, so it lives here rather
  // than on `Resume`. Used to build export filenames (see filename.ts).
  jobTitle: string
  resume: Resume
  favorite?: boolean
}

// Before schemas existed, this shape (`{ activeId, variations }`) was the
// top-level persisted state under `OLD_VARIATIONS_STORAGE_KEY`. Kept around
// only for the one-time migration in `loadSchemasState`.
interface LegacyVariationsState {
  activeId: string
  variations: Variation[]
}

export interface Schema {
  id: string
  name: string
  variations: Variation[]
  activeVariationId: string
}

export interface SchemasState {
  schemas: Schema[]
  activeSchemaId: string
}

function defaultVariation(): Variation {
  return {
    id: newId('variation'),
    name: 'My Resume',
    jobTitle: '',
    resume: defaultResume,
  }
}

function schemaFromVariations(name: string, variations: Variation[], activeVariationId: string): Schema {
  return { id: newId('schema'), name, variations, activeVariationId }
}

function defaultState(): SchemasState {
  const variation = defaultVariation()
  const schema = schemaFromVariations('My Resume', [variation], variation.id)
  return { schemas: [schema], activeSchemaId: schema.id }
}

// Structural check — enough to avoid crashing on corrupted/foreign JSON in
// the storage slot without fully validating every nested field of `Resume`.
function isResumeShape(value: unknown): value is Resume {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Resume>
  return (
    typeof candidate.header === 'object' &&
    candidate.header !== null &&
    Array.isArray(candidate.contacts) &&
    Array.isArray(candidate.skills) &&
    Array.isArray(candidate.experience) &&
    Array.isArray(candidate.tools) &&
    Array.isArray(candidate.interests) &&
    typeof candidate.education === 'object' &&
    candidate.education !== null &&
    typeof candidate.theme === 'object' &&
    candidate.theme !== null
  )
}

function isVariationShape(value: unknown): value is Variation {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Variation>
  if (
    typeof candidate.id !== 'string' ||
    typeof candidate.name !== 'string' ||
    typeof candidate.jobTitle !== 'string' ||
    !isResumeShape(candidate.resume)
  ) {
    return false
  }
  // `favorite` is optional — missing/undefined is valid, but if present it
  // must be a boolean.
  return candidate.favorite === undefined || typeof candidate.favorite === 'boolean'
}

function isLegacyVariationsState(value: unknown): value is LegacyVariationsState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<LegacyVariationsState>
  if (typeof candidate.activeId !== 'string') return false
  if (!Array.isArray(candidate.variations) || candidate.variations.length === 0) return false
  return candidate.variations.every(isVariationShape)
}

function isSchemaShape(value: unknown): value is Schema {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<Schema>
  if (typeof candidate.id !== 'string') return false
  if (typeof candidate.name !== 'string') return false
  if (typeof candidate.activeVariationId !== 'string') return false
  if (!Array.isArray(candidate.variations) || candidate.variations.length === 0) return false
  return candidate.variations.every(isVariationShape)
}

function isSchemasState(value: unknown): value is SchemasState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<SchemasState>
  if (typeof candidate.activeSchemaId !== 'string') return false
  if (!Array.isArray(candidate.schemas) || candidate.schemas.length === 0) return false
  return candidate.schemas.every(isSchemaShape)
}

// Backfills `jobTitle` on variations persisted before that field existed, so
// upgrading the schema doesn't wipe out a user's existing variations. Only
// touches the one known-missing field; everything else still goes through
// the full structural check above.
function withJobTitleBackfill<T extends { variations?: unknown }>(value: T): T {
  if (!value || typeof value !== 'object' || !Array.isArray(value.variations)) return value
  return {
    ...value,
    variations: value.variations.map((variation: unknown) =>
      variation && typeof variation === 'object' && typeof (variation as Variation).jobTitle !== 'string'
        ? { ...variation, jobTitle: '' }
        : variation,
    ),
  }
}

function withLegacyBackfill(value: unknown): unknown {
  return withJobTitleBackfill(value as LegacyVariationsState)
}

function withSchemasBackfill(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const candidate = value as Partial<SchemasState>
  if (!Array.isArray(candidate.schemas)) return value
  return {
    ...candidate,
    schemas: candidate.schemas.map((schema) => withJobTitleBackfill(schema as Schema)),
  }
}

// Wraps a legacy flat variations list (persisted before schemas existed)
// into a single default schema.
function schemaFromLegacyState(legacy: LegacyVariationsState): Schema {
  const activeExists = legacy.variations.some((variation) => variation.id === legacy.activeId)
  return schemaFromVariations(
    'My Resume',
    legacy.variations,
    activeExists ? legacy.activeId : legacy.variations[0].id,
  )
}

// Reads the pre-schema storage key and, if it holds valid data, wraps it into
// a single default schema. Returns `null` if there's nothing valid to
// migrate.
function migrateLegacyVariationsState(): SchemasState | null {
  try {
    const raw = localStorage.getItem(OLD_VARIATIONS_STORAGE_KEY)
    if (!raw) return null

    const parsed = withLegacyBackfill(JSON.parse(raw))
    if (!isLegacyVariationsState(parsed)) return null

    const schema = schemaFromLegacyState(parsed)
    return { schemas: [schema], activeSchemaId: schema.id }
  } catch {
    return null
  }
}

export function loadSchemasState(): SchemasState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      // Nothing under the new key yet — check for pre-schema data and
      // migrate it once, persisting immediately so this only ever runs a
      // single time rather than on every load.
      const migrated = migrateLegacyVariationsState()
      const initial = migrated ?? defaultState()
      saveSchemasState(initial)
      return initial
    }

    const parsed: unknown = withSchemasBackfill(JSON.parse(raw))
    if (!isSchemasState(parsed)) return defaultState()

    // Fall back to the first schema if the active id doesn't resolve (e.g.
    // hand-edited storage) rather than losing all data, and likewise for
    // each schema's active variation id.
    const schemas = parsed.schemas.map((schema) => {
      const activeVariationExists = schema.variations.some(
        (variation) => variation.id === schema.activeVariationId,
      )
      return activeVariationExists ? schema : { ...schema, activeVariationId: schema.variations[0].id }
    })
    const activeSchemaExists = schemas.some((schema) => schema.id === parsed.activeSchemaId)
    return {
      schemas,
      activeSchemaId: activeSchemaExists ? parsed.activeSchemaId : schemas[0].id,
    }
  } catch {
    return defaultState()
  }
}

// Returns true on success, false if the write failed (storage
// disabled/full/unavailable) so callers can surface the failure to the user
// instead of assuming the edit was durably persisted.
export function saveSchemasState(state: SchemasState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
