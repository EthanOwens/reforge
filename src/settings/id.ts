// Generates a unique, stable identifier for settings entities (e.g. saved
// API keys). IDs are only ever compared for equality within this app, so
// any collision-resistant string is sufficient — no need for a dedicated
// uuid library. Equivalent to `src/tools/resume/id.ts`'s `newId`, kept as a
// separate copy since `src/settings/` is a distinct module tree from the
// resume tool.
export function newId(prefix: string): string {
  const unique =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${unique}`
}
