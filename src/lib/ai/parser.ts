// ============================================================
// Call #1 — 简历结构化
// ------------------------------------------------------------
// 输入：简历纯文本
// 输出：ParsedResume（已 zod 校验）
// 失败：最多重试 1 次，仍失败则抛 AiParseError（调用方写入 status=failed）
// ============================================================

import { z } from "zod";
import { getAiClient, AI_MODELS } from "./provider";
import { PARSE_SYSTEM, parseUserPrompt } from "./prompts";
import { parsedResumeAiSchema } from "./schemas";
import { truncateForPrompt } from "./extract";
import type { ParsedResume } from "@/types";

export class AiParseError extends Error {
  detail?: string;
  constructor(message: string, detail?: string) {
    super(message);
    this.name = "AiParseError";
    this.detail = detail;
  }
}

const REQUEST_TIMEOUT_MS = 60_000;

async function callParseOnce(
  resumeTextTruncated: string,
  retryHint?: string,
): Promise<unknown> {
  const client = getAiClient();
  const system = retryHint
    ? `${PARSE_SYSTEM}\n\n[重试提示] 上次返回不符合 schema：${retryHint}。请严格按 schema 输出 JSON。`
    : PARSE_SYSTEM;

  const res = await client.chat.completions.create(
    {
      model: AI_MODELS.parse,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: parseUserPrompt(resumeTextTruncated) },
      ],
    },
    { timeout: REQUEST_TIMEOUT_MS },
  );

  const raw = res.choices[0]?.message?.content ?? "";
  if (!raw) throw new AiParseError("LLM 返回空内容");
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new AiParseError(
      "LLM 返回不是合法 JSON",
      e instanceof Error ? e.message : String(e),
    );
  }
}

/** 把 zod 错误整成 1-2 行让下一轮 prompt 能看懂。 */
function summarizeZodError(err: z.ZodError): string {
  return err.issues
    .slice(0, 5)
    .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
    .join("; ");
}

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const truncated = truncateForPrompt(resumeText);

  let lastErr: string | undefined;
  for (let attempt = 0; attempt < 2; attempt++) {
    let json: unknown;
    try {
      json = await callParseOnce(truncated, lastErr);
    } catch (e) {
      if (e instanceof AiParseError) {
        lastErr = e.message + (e.detail ? ` (${e.detail})` : "");
        continue;
      }
      throw e;
    }

    const parsed = parsedResumeAiSchema.safeParse(json);
    if (parsed.success) {
      // total_years 强制存在（schema transform 已兜底为 0）
      const out: ParsedResume = {
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone,
        location: parsed.data.location,
        total_years: parsed.data.total_years,
        education: parsed.data.education,
        experience: parsed.data.experience,
        skills: parsed.data.skills,
        projects: parsed.data.projects,
        raw_text: parsed.data.raw_text,
      };
      return out;
    }
    lastErr = summarizeZodError(parsed.error);
  }

  throw new AiParseError("解析结果两次均不符合 schema", lastErr);
}
