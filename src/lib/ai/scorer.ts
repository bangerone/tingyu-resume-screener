// ============================================================
// Call #2 — 岗位匹配评分
// ------------------------------------------------------------
// 输入：ParsedResume + Job (title/description/criteria)
// 输出：ScoreResult（已 zod 校验 + sanity clamp）
// 失败：最多重试 1 次，仍失败则抛 AiScoreError
// ============================================================

import { z } from "zod";
import { getAiClient, AI_MODELS } from "./provider";
import {
  SCORE_SYSTEM,
  scoreUserPrompt,
  type EducationEval,
} from "./prompts";
import { scoreResultAiSchema } from "./schemas";
import { detectSchoolTiers, type SchoolTier } from "./school-tiers";
import type { Job } from "@/lib/db/schema";
import type { ParsedResume, ScoreResult, ScreeningCriteria } from "@/types";

export class AiScoreError extends Error {
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message);
    this.name = "AiScoreError";
    this.detail = detail;
  }
}

const REQUEST_TIMEOUT_MS = 60_000;

/** 学历等级：博士 4 > 硕士 3 > 本科 2 > 大专 1；未识别 0。 */
function degreeRank(s: string | undefined | null): number {
  const d = (s ?? "").toLowerCase();
  if (/博士|ph\.?d|doctor/.test(d)) return 4;
  if (/硕士|master|msc|m\.?a|m\.?s|mba|mpa/.test(d)) return 3;
  if (/本科|学士|bachelor|b\.?s|b\.?a|undergrad/.test(d)) return 2;
  if (/大专|专科|associate|diploma/.test(d)) return 1;
  return 0;
}

/** 取候选人教育经历里的最高学历；返回原始字符串 + 等级值。 */
function highestDegree(parsed: ParsedResume): {
  label: string;
  rank: number;
} {
  let label = "";
  let rank = 0;
  for (const e of parsed.education ?? []) {
    const r = degreeRank(e.degree);
    if (r > rank) {
      rank = r;
      label = e.degree;
    }
  }
  return { label, rank };
}

function buildEducationEvals(
  criteria: ScreeningCriteria,
  parsed: ParsedResume,
): EducationEval[] {
  const edu = (criteria.hard ?? []).filter((h) => h.kind === "education");
  if (edu.length === 0) return [];
  const { label: highestLabel, rank: highestRank } = highestDegree(parsed);
  return edu.map((h) => {
    const req = degreeRank(String(h.value));
    // required 识别不了（自定义写法）时，不做预判，pass=false 让 LLM 自己看；
    // 实务中 required 总会落在四档之内，req=0 基本不会出现
    const pass = req > 0 ? highestRank >= req : false;
    return {
      label: h.label,
      required: String(h.value),
      candidate_highest: highestLabel || "未识别",
      pass,
    };
  });
}

async function callScoreOnce(
  job: Pick<Job, "title" | "description" | "criteria">,
  parsed: ParsedResume,
  tierFlags: Record<SchoolTier, boolean>,
  educationEvals: EducationEval[],
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
        {
          role: "user",
          content: scoreUserPrompt(job, parsed, tierFlags, educationEvals),
        },
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
  // 学历等级硬比对也在本地做，防止 LLM 误判"硕士"不满足"本科及以上"
  const educationEvals = buildEducationEvals(job.criteria, parsed);

  let lastErr: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    let json: unknown;
    try {
      json = await callScoreOnce(
        job,
        parsed,
        tierFlags,
        educationEvals,
        lastErr,
      );
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
