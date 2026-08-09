// Detects which AI provider issued a given API key, based on the key's
// prefix. Kept as a simple, easy-to-extend list of prefixes — order matters
// where prefixes overlap (e.g. Anthropic's `sk-ant-` is a more specific
// prefix than OpenAI's plain `sk-`, so it must be checked first).
export const KNOWN_KEY_PREFIXES: Array<{ prefix: string; provider: string }> = [
  { prefix: 'sk-ant-', provider: 'Anthropic' },
  { prefix: 'sk-', provider: 'OpenAI' },
]

export function detectProvider(apiKey: string): string {
  const trimmed = apiKey.trim()
  const match = KNOWN_KEY_PREFIXES.find(({ prefix }) => trimmed.startsWith(prefix))
  return match?.provider ?? 'Unknown'
}

// Returns the known provider prefix a key starts with (e.g. `sk-ant-`), or
// `null` if the key doesn't match any recognized provider format.
export function getKeyPrefix(apiKey: string): string | null {
  const trimmed = apiKey.trim()
  const match = KNOWN_KEY_PREFIXES.find(({ prefix }) => trimmed.startsWith(prefix))
  return match?.prefix ?? null
}
