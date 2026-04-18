// ============================================================
// Domain types — value objects for jsonb columns.
// Row types live in src/lib/db/schema.ts (Drizzle inferred).
// 这里只放 *json 字段* 的形状（criteria / parsed_resume / score 等），
// 因为 schema 用 .$type<T>() 引用这些类型。
// ============================================================

// ---------- Job & screening criteria ----------

export type JobStatus = "draft" | "open" | "closed";

/** Hard requirement = candidate is rejected if not satisfied. */
export interface HardRequirement {
  /** "education" | "min_years" | "location" | "custom" */
  kind: "education" | "min_years" | "location" | "custom";
  /** human-readable, also embedded in the prompt */
  label: string;
  /** structured value (e.g. "本科" / 3 / "上海") */
  value: string | number;
}

/** Skill weight: 1 (nice) ~ 5 (must). */
export interface SkillRequirement {
  name: string;
  weight: 1 | 2 | 3 | 4 | 5;
  /** "must" → counted as hard, blocks candidate; "preferred" → soft */
  level: "must" | "preferred";
}

export interface ScreeningCriteria {
  hard: HardRequirement[];
  skills: SkillRequirement[];
  /** free-text bonus: e.g. "有大厂经验加分" */
  bonus: string[];
  /** custom weighted dimensions HR cares about */
  custom: { name: string; weight: number; description: string }[];
}

// 注意：完整的 Job / Application / Candidate row 类型从 db/schema.ts 推断：
//   import type { Job, Application, Candidate } from "@/lib/db/schema";
// 本文件只保留 jsonb 列的内嵌结构定义。

// ---------- Application & parsed resume ----------

export type ApplicationStatus =
  | "received" // just submitted, parse pending
  | "parsing" // resume → structured json
  | "scoring" // structured json → score
  | "scored" // done
  | "pushed" // pushed to feishu
  | "failed"; // parse/score error

export interface ParsedResume {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  total_years?: number;
  /** 候选人自填补充字段（可选，LLM 不强制要求） */
  gender?: string;
  birth_date?: string;
  work_status?: string;
  expected_city?: string;
  expected_salary?: string;
  available_from?: string;
  self_intro?: string;
  education: { school: string; degree: string; major: string; period: string }[];
  experience: {
    company: string;
    title: string;
    period: string;
    summary: string;
  }[];
  skills: string[];
  projects: { name: string; role: string; summary: string }[];
  raw_text: string;
}

export interface ScoreBreakdown {
  hard: { label: string; pass: boolean; reason: string }[];
  skills: { name: string; required_weight: number; matched: boolean }[];
  experience: { score: number; reason: string }; // 0-100
  bonus: { item: string; hit: boolean }[];
  custom: { name: string; score: number; reason: string }[];
}

export interface ScoreResult {
  total: number; // 0-100
  passed_hard: boolean; // false → rejected, total clamped to <50
  breakdown: ScoreBreakdown;
  highlights: string[];
  red_flags: string[];
  reasoning: string; // 1-2 sentence summary, shown in HR list
}

// Application / FeishuLog row 类型从 db/schema.ts 推断。
