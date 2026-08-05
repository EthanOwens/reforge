// Detects which AI provider issued a given API key, based on the key's
// prefix. Kept as a simple, easy-to-extend chain of checks — order matters
// where prefixes overlap (e.g. Anthropic's `sk-ant-` is a more specific
// prefix than OpenAI's plain `sk-`, so it must be checked first).
export function detectProvider(apiKey: string): string {
  const trimmed = apiKey.trim()
  if (trimmed.startsWith('sk-ant-')) return 'Anthropic'
  if (trimmed.startsWith('sk-')) return 'OpenAI'
  return 'Unknown'
}
