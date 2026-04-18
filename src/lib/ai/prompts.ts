// ============================================================
// Prompt 字面量 — 严格对应 docs/prompt-engineering.md
// ============================================================
// 如需调整措辞，先改 docs/prompt-engineering.md 保持一致。
// ============================================================

import type { Job } from "@/lib/db/schema";
import type { ParsedResume } from "@/types";
import type { SchoolTier } from "./school-tiers";

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
   - 对 kind="education" 的条目，系统已在「educationEvals」里按「博士 > 硕士（含工学硕士/工程硕士/MBA 等学位硕士）> 本科/学士 > 大专 > 高中」的等级规则预判好，你必须直接采用 pass 结果写进 breakdown.hard，不要自己再猜。高等级满足低等级要求（硕士自动满足"本科及以上"）。
   - 对 kind="min_years" 的条目，拿 candidate total_years 跟 value 数值比，>= 则通过。
2. criteria.schoolTiers 是学校档次要求，系统已把候选人是否命中各档次算好放在「tierFlags」里（c9/985/211/shuangyiliu/qs50/qs100 的布尔值）。
   - level="must"：tierFlags[tier] 必须为 true，否则视为硬性未通过，passed_hard=false。
   - level="bonus"：tierFlags[tier] 为 true 则加 5 分（最多加 15）。
   - 在 breakdown.hard 里为每条 level=must 的 schoolTier 输出一条记录（label 用「xxx 档次」），方便 HR 看。
3. skills 中 level=must 的，未掌握每项扣 15 分；level=preferred 的，掌握每项加 weight*2 分（满分制按比例归一）。
4. experience 子分 0-100：经验年限、项目相关性、岗位 title 匹配度综合打。
5. bonus 命中每条加 3 分（最多加 15）。
6. custom 维度按 description 自行判断 0-100。
7. total = round( hard_clamp( 0.4 * skills + 0.3 * experience + 0.15 * bonus + 0.15 * custom_avg ) )
   - 学校 tier bonus 分加到 bonus 子分上。
   - hard_clamp：若 passed_hard=false，min(total, 49)。
8. reasoning 用一句话（不超过 60 字）说明亮点 + 主要缺口。
9. 严禁基于姓名/性别/年龄歧视；学校档次仅在 HR 于 schoolTiers 明确要求时才使用，否则不纳入评估。
10. 输出严格 JSON，不要 markdown，不要解释。`;

export interface EducationEval {
  label: string;
  required: string;
  candidate_highest: string;
  pass: boolean;
}

/** `job` 只取 title / description / criteria 三个字段，避免把无关信息灌进 prompt。 */
export function scoreUserPrompt(
  job: Pick<Job, "title" | "description" | "criteria">,
  parsed: ParsedResume,
  tierFlags: Record<SchoolTier, boolean>,
  educationEvals: EducationEval[],
): string {
  return `[岗位]
title: ${job.title}
description: ${job.description}

[筛选标准]
${JSON.stringify(job.criteria, null, 2)}

[候选人结构化简历]
${JSON.stringify(parsed, null, 2)}

[候选人学校档次 tierFlags]
${JSON.stringify(tierFlags)}

[学历硬性预判 educationEvals]（系统按「博士>硕士>本科>大专」精确比对，breakdown.hard 的学历条目必须直接用下列 pass）
${JSON.stringify(educationEvals)}

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
