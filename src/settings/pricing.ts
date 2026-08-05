// Hardcoded price-per-million-tokens table for a handful of current
// Anthropic models. Prices are plausible placeholders, not guaranteed
// accurate — meant to be updated as pricing changes. Consumers should treat
// any model not listed here as "cost unknown" rather than assuming $0.
export interface ModelPrice {
  inputPerMillion: number
  outputPerMillion: number
}

export const ANTHROPIC_MODEL_PRICES: Record<string, ModelPrice> = {
  'claude-sonnet-4-5-20250929': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-4-5-20251001': { inputPerMillion: 1, outputPerMillion: 5 },
  'claude-opus-4-1-20250805': { inputPerMillion: 15, outputPerMillion: 75 },
  'claude-sonnet-4-20250514': { inputPerMillion: 3, outputPerMillion: 15 },
  'claude-haiku-4-20250514': { inputPerMillion: 0.8, outputPerMillion: 4 },
}

// Returns the estimated dollar cost for the given token usage under `model`,
// or `null` if `model` isn't in the price table above — i.e. "cost
// unknown" rather than silently reporting $0 for a model we have no
// pricing data for.
export function estimateCostUsd(model: string, inputTokens: number, outputTokens: number): number | null {
  const price = ANTHROPIC_MODEL_PRICES[model]
  if (!price) return null
  return (inputTokens / 1_000_000) * price.inputPerMillion + (outputTokens / 1_000_000) * price.outputPerMillion
}
