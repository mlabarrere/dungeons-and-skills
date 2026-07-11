/* models.mjs — model config resolution. API ids, providers, reasoning support and
   prices live in config/models.json (fallback: models.example.json). NEVER hardcode a
   model id in business logic — resolve through here so models can change (spec §2, §9). */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const HERE = dirname(fileURLToPath(import.meta.url));

export function loadModelConfig(path) {
  const candidates = path ? [path]
    : [join(HERE, "config", "models.json"), join(HERE, "config", "models.example.json")];
  for (const p of candidates) if (existsSync(p)) return { ...JSON.parse(readFileSync(p, "utf8")), _source: p };
  throw new Error("no model config found (config/models.json or models.example.json)");
}

export function resolveModel(cfg, alias) {
  const m = cfg.models[alias];
  if (!m) throw new Error(`unknown model alias "${alias}" (have: ${Object.keys(cfg.models).join(", ")})`);
  const provider = cfg.providers[m.provider];
  if (!provider) throw new Error(`unknown provider "${m.provider}" for model "${alias}"`);
  return { alias, api_id: m.api_id, provider: m.provider, providerCfg: provider,
    reasoning: m.reasoning || ["off"], price: m.price_per_mtok || null };
}

export const supportsReasoning = (model, level) => level === "off" || (model.reasoning || []).includes(level);

export function reasoningBudget(cfg, level) {
  return (cfg.reasoning_budget_tokens && cfg.reasoning_budget_tokens[level]) || 0;
}

/** Estimated USD cost for a call, or null if no price is configured. */
export function estimateCost(model, inputTokens, outputTokens) {
  if (!model.price || model.price.input == null || model.price.output == null) return null;
  return (inputTokens / 1e6) * model.price.input + (outputTokens / 1e6) * model.price.output;
}
