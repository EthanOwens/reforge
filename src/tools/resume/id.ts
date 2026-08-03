// Generates a unique, stable identifier for newly created resume list items
// (skill groups/bullets, jobs, tool groups, interests). IDs are only ever
// compared for equality within this app (React keys + targeting items for
// edit/remove), so any collision-resistant string is sufficient — no need
// for a dedicated uuid library.
export function newId(prefix: string): string {
  const unique =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`
  return `${prefix}-${unique}`
}
