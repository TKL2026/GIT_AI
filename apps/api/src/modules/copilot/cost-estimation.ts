/** Grille tarifaire statique $/million de tokens, utilisée uniquement pour
 * un coût ESTIMÉ à des fins d'observabilité interne — ne reflète ni remises
 * contractuelles ni facturation réelle Anthropic. À maintenir manuellement
 * si les tarifs changent (pas d'appel réseau, pas de service dédié). */
interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
  cacheReadPerMillion: number;
  cacheWritePerMillion: number;
}

const PRICING_BY_MODEL_PREFIX: Array<{ prefix: string; pricing: ModelPricing }> = [
  {
    prefix: "claude-sonnet-5",
    pricing: {
      inputPerMillion: 3,
      outputPerMillion: 15,
      cacheReadPerMillion: 0.3,
      cacheWritePerMillion: 3.75,
    },
  },
  {
    prefix: "claude-haiku-4-5",
    pricing: {
      inputPerMillion: 1,
      outputPerMillion: 5,
      cacheReadPerMillion: 0.1,
      cacheWritePerMillion: 1.25,
    },
  },
];

const FALLBACK_PRICING: ModelPricing = PRICING_BY_MODEL_PREFIX[0].pricing;

export function estimateCostUsd(
  model: string,
  usage: {
    inputTokens: number;
    outputTokens: number;
    cacheCreationInputTokens: number;
    cacheReadInputTokens: number;
  },
): number {
  const entry = PRICING_BY_MODEL_PREFIX.find((e) => model.startsWith(e.prefix));
  const pricing = entry?.pricing ?? FALLBACK_PRICING;
  return (
    (usage.inputTokens / 1_000_000) * pricing.inputPerMillion +
    (usage.outputTokens / 1_000_000) * pricing.outputPerMillion +
    (usage.cacheReadInputTokens / 1_000_000) * pricing.cacheReadPerMillion +
    (usage.cacheCreationInputTokens / 1_000_000) * pricing.cacheWritePerMillion
  );
}
