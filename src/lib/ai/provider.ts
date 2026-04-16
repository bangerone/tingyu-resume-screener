// OpenAI-compatible AI provider abstraction.
// TODO[D4]: implement actual chat() / parseResume() / scoreResume() helpers
//
// Why abstract: we may swap deepseek <-> openai <-> anthropic without touching callers.
// All AI calls happen on the SERVER ONLY — never expose AI_API_KEY to the browser.

import OpenAI from "openai";

export function getAiClient() {
  return new OpenAI({
    apiKey: process.env.AI_API_KEY!,
    baseURL: process.env.AI_BASE_URL,
  });
}

export const AI_MODELS = {
  parse: process.env.AI_MODEL_PARSE ?? "deepseek-chat",
  score: process.env.AI_MODEL_SCORE ?? "deepseek-chat",
} as const;
