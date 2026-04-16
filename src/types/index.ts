// ============================================================
// Domain types — single source of truth.
// Mirrors docs/data-model.sql. Update both when schema changes.
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

export interface Job {
  id: string;
  title: string;
  department: string;
  location: string;
  description: string; // markdown
  criteria: ScreeningCriteria;
  /** AI score >= threshold → push to feishu */
  push_threshold: number; // 0-100, default 80
  status: JobStatus;
  created_at: string;
  updated_at: string;
}

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

export interface Application {
  id: string;
  job_id: string;
  /** Supabase auth.users.id — nullable only for legacy/migrated rows */
  candidate_user_id: string | null;
  candidate_name: string;
  candidate_email: string;
  candidate_phone: string;
  resume_file_path: string; // supabase storage key
  /** Autofill is done BEFORE application row is created (see user-journeys.md
   *  Step ⑤). So parsed_resume is always set by submit-time. */
  parsed_resume: ParsedResume | null;
  score: ScoreResult | null;
  status: ApplicationStatus;
  pushed_to_feishu_at: string | null;
  created_at: string;
}

// ---------- Feishu ----------

export interface FeishuPushLog {
  id: string;
  application_id: string;
  job_id: string;
  ok: boolean;
  response: string;
  created_at: string;
}
