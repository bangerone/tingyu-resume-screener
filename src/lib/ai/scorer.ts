// ============================================================
// Call #2 — 岗位匹配评分
// ------------------------------------------------------------
// 输入：ParsedResume + Job (title/description/criteria)
// 输出：ScoreResult（已 zod 校验 + sanity clamp）
// 失败：最多重试 1 次，仍失败则抛 AiScoreError
// ============================================================

import { z } from "zod";
import { getAiClient, AI_MODELS } from "./provider";
import { SCORE_SYSTEM, scoreUserPrompt } from "./prompts";
import { scoreResultAiSchema } from "./schemas";
import { detectSchoolTiers, type SchoolTier } from "./school-tiers";
import type { Job } from "@/lib/db/schema";
import type { ParsedResume, ScoreResult } from "@/types";

export class AiScoreError extends Error {
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message);
    this.name = "AiScoreError";
    this.detail = detail;
  }
}

const REQUEST_TIMEOUT_MS = 60_000;

async function callScoreOnce(
  job: Pick<Job, "title" | "description" | "criteria">,
  parsed: ParsedResume,
  tierFlags: Record<SchoolTier, boolean>,
  retryHint?: string,
): Promise<unknown> {
  const client = getAiClient();
  const system = retryHint
    ? `${SCORE_SYSTEM}\n\n[重试提示] 上次返回不符合 schema：${retryHint}。请严格按 schema 输出 JSON。`
    : SCORE_SYSTEM;

  const res = await client.chat.completions.create(
    {
      model: AI_MODELS.score,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: scoreUserPrompt(job, parsed, tierFlags) },
      ],
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  const raw = res.choices[0]?.message?.content ?? "";
  if (!raw) throw new AiScoreError("LLM 返回空内容");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new AiScoreError(
      "LLM 返回不是合法 JSON",
      e instanceof Error ? e.message : String(e),
    );
  }
}

function summarizeZodError(err: z.ZodError): string {
  return err.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

/** sanity clamp：对齐 prompt-engineering.md §Call #2 后处理。 */
function sanityClamp(r: ScoreResult): ScoreResult {
  let total = Math.round(r.total);
  if (!Number.isFinite(total)) total = 0;
  if (total < 0) total = 0;
  if (total > 100) total = 100;
  if (r.passed_hard === false && total > 49) total = 49;
  return { ...r, total };
}

export async function scoreResume(
  parsed: ParsedResume,
  job: Pick<Job, "title" | "description" | "criteria">,
): Promise<ScoreResult> {
  // 候选人学校 × 档次名单在本地做匹配，不让 LLM 猜 —— 既准又省 token
  const tierFlags = detectSchoolTiers(
    (parsed.education ?? []).map((e) => e.school),
  );

  let lastErr: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    let json: unknown;
    try {
      json = await callScoreOnce(job, parsed, tierFlags, lastErr);
    } catch (e) {
      if (e instanceof AiScoreError) {
        lastErr = e.message + (e.detail ? ` (${e.detail})` : "");
        continue;
      }
      throw e;
    }

    const parsedRes = scoreResultAiSchema.safeParse(json);
    if (parsedRes.success) {
      const raw: ScoreResult = {
        total: parsedRes.data.total,
        passed_hard: parsedRes.data.passed_hard,
        breakdown: parsedRes.data.breakdown,
        highlights: parsedRes.data.highlights,
        red_flags: parsedRes.data.red_flags,
        reasoning: parsedRes.data.reasoning,
      };
      return sanityClamp(raw);
    }
    lastErr = summarizeZodError(parsedRes.error);
  }

  throw new AiScoreError("评分结果两次均不符合 schema", lastErr);
}
