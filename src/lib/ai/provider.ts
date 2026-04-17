// OpenAI-compatible AI provider abstraction.
// TODO[D4]: implement actual chat() / parseResume() / scoreResume() helpers
//
// Why abstract: we may swap deepseek <-> openai <-> anthropic without touching callers.
// All AI calls happen on the SERVER ONLY — never expose keys to the browser.

import OpenAI from "openai";

/**
 * API key lookup order:
 *   1. AI_API_KEY          (generic, docs default)
 *   2. DEEPSEEK_API_KEY    (convenience alias)
 *   3. OPENAI_API_KEY      (convenience alias)
 */
function resolveApiKey(): string {
  const key =
    process.env.AI_API_KEY ||
    process.env.DEEPSEEK_API_KEY ||
    process.env.OPENAI_API_KEY;
  if (!key) {
    throw new Error(
      "No AI API key set. Configure one of: AI_API_KEY / DEEPSEEK_API_KEY / OPENAI_API_KEY in .env.local",
    );
  }
  return key;
}

/** Default base URL = DeepSeek (project-wide default). Override via AI_BASE_URL. */
function resolveBaseUrl(): string {
  return process.env.AI_BASE_URL ?? "https://api.deepseek.com";
}

export function getAiClient() {
  return new OpenAI({
    apiKey: resolveApiKey(),
    baseURL: resolveBaseUrl(),
  });
}

export const AI_MODELS = {
  parse: process.env.AI_MODEL_PARSE ?? "deepseek-chat",
  score: process.env.AI_MODEL_SCORE ?? "deepseek-chat",
} as const;
