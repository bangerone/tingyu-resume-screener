// ============================================================
// Prompt 字面量 — 严格对应 docs/prompt-engineering.md
// ============================================================
// 如需调整措辞，先改 docs/prompt-engineering.md 保持一致。
// ============================================================

import type { Job } from "@/lib/db/schema";
import type { ParsedResume } from "@/types";

// ---------- Call #1 — 简历结构化 ----------

export const PARSE_SYSTEM = `你是一名资深 HR 信息抽取专家。任务：把简历纯文本转成结构化 JSON。
要求：
1. 严格按给定 schema 输出，不要多任何字段。
2. 找不到的字段填空字符串或空数组，不要编造。
3. total_years = 所有工作经历去重合并后的总年限（数字，保留 1 位小数）。
4. 项目和实习都算 experience。
5. raw_text 直接复制原文（截断到 4000 字以内）。`;

export function parseUserPrompt(resumeTextTruncated: string): string {
  return `JSON Schema:
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "location": "string",
  "total_years": number,
  "education": [{ "school":"string","degree":"string","major":"string","period":"string" }],
  "experience": [{ "company":"string","title":"string","period":"string","summary":"string" }],
  "skills": ["string"],
  "projects": [{ "name":"string","role":"string","summary":"string" }],
  "raw_text": "string"
}

简历原文：
<<<<
${resumeTextTruncated}
>>>>`;
}

// ---------- Call #2 — 岗位匹配评分 ----------

export const SCORE_SYSTEM = `你是一名严格、公平的招聘评估官。基于「岗位筛选标准」对「候选人结构化简历」打分。
打分原则：
1. 先判断硬性要求 (criteria.hard) 是否全部满足。任一未满足 → passed_hard=false，且 total 不超过 50。
2. skills 中 level=must 的，未掌握每项扣 15 分；level=preferred 的，掌握每项加 weight*2 分（满分制按比例归一）。
3. experience 子分 0-100：经验年限、项目相关性、岗位 title 匹配度综合打。
4. bonus 命中每条加 3 分（最多加 15）。
5. custom 维度按 description 自行判断 0-100。
6. total = round( hard_clamp( 0.4 * skills + 0.3 * experience + 0.15 * bonus + 0.15 * custom_avg ) )
   - hard_clamp：若 passed_hard=false，min(total, 49)。
7. reasoning 用一句话（不超过 60 字）说明亮点 + 主要缺口。
8. 严禁基于姓名/性别/年龄/院校歧视，仅基于 criteria 描述的能力判断。
9. 输出严格 JSON，不要 markdown，不要解释。`;

/** `job` 只取 title / description / criteria 三个字段，避免把无关信息灌进 prompt。 */
export function scoreUserPrompt(
  job: Pick<Job, "title" | "description" | "criteria">,
  parsed: ParsedResume,
): string {
  return `[岗位]
title: ${job.title}
description: ${job.description}

[筛选标准]
${JSON.stringify(job.criteria, null, 2)}

[候选人结构化简历]
${JSON.stringify(parsed, null, 2)}

[Output JSON Schema]
{
  "total": number 0-100,
  "passed_hard": boolean,
  "breakdown": {
    "hard": [{"label":"string","pass":boolean,"reason":"string"}],
    "skills": [{"name":"string","required_weight":number,"matched":boolean}],
    "experience": {"score":number,"reason":"string"},
    "bonus": [{"item":"string","hit":boolean}],
    "custom": [{"name":"string","score":number,"reason":"string"}]
  },
  "highlights": ["string"],
  "red_flags": ["string"],
  "reasoning": "string"
}`;
}
