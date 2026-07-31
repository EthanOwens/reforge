// Persistence for the Resume tool's named variations (e.g. one per job
// application). Backed by localStorage so variations survive a page reload;
// wrapped in try/catch throughout since localStorage can throw (private
// browsing, storage disabled, quota exceeded, corrupted/foreign JSON) and
// none of that should crash the app — callers always get a usable state back.

import { defaultResume } from './defaultResume'
import { newId } from './id'
import type { Resume } from './types'

const STORAGE_KEY = 'reforge.resume.variations.v1'

export interface Variation {
  id: string
  name: string
  // The job title being applied for with this variation — a property of the
  // application, not of the resume content itself, so it lives here rather
  // than on `Resume`. Used to build export filenames (see filename.ts).
  jobTitle: string
  resume: Resume
}

export interface VariationsState {
  activeId: string
  variations: Variation[]
}

function defaultState(): VariationsState {
  const variation: Variation = {
    id: newId('variation'),
    name: 'My Resume',
    jobTitle: '',
    resume: defaultResume,
  }
  return { activeId: variation.id, variations: [variation] }
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

function isVariationsState(value: unknown): value is VariationsState {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Partial<VariationsState>
  if (typeof candidate.activeId !== 'string') return false
  if (!Array.isArray(candidate.variations) || candidate.variations.length === 0) return false
  return candidate.variations.every(
    (variation) =>
      variation &&
      typeof variation === 'object' &&
      typeof variation.id === 'string' &&
      typeof variation.name === 'string' &&
      typeof variation.jobTitle === 'string' &&
      isResumeShape(variation.resume),
  )
}

// Backfills `jobTitle` on variations persisted before that field existed, so
// upgrading the schema doesn't wipe out a user's existing variations. Only
// touches the one known-missing field; everything else still goes through
// the full structural check below.
function withJobTitleBackfill(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  const candidate = value as Partial<VariationsState>
  if (!Array.isArray(candidate.variations)) return value
  return {
    ...candidate,
    variations: candidate.variations.map((variation) =>
      variation && typeof variation === 'object' && typeof (variation as Variation).jobTitle !== 'string'
        ? { ...variation, jobTitle: '' }
        : variation,
    ),
  }
}

export function loadVariationsState(): VariationsState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState()

    const parsed: unknown = withJobTitleBackfill(JSON.parse(raw))
    if (!isVariationsState(parsed)) return defaultState()

    // Fall back to the first variation if the active id doesn't resolve
    // (e.g. hand-edited storage) rather than losing all data.
    const activeExists = parsed.variations.some((variation) => variation.id === parsed.activeId)
    return activeExists ? parsed : { ...parsed, activeId: parsed.variations[0].id }
  } catch {
    return defaultState()
  }
}

// Returns true on success, false if the write failed (storage
// disabled/full/unavailable) so callers can surface the failure to the user
// instead of assuming the edit was durably persisted.
export function saveVariationsState(state: VariationsState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}
