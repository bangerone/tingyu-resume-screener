// ============================================================
// Job 创建/编辑的 zod schema —— 前后端共享
// ============================================================
// 前端：react-hook-form + zodResolver 做表单校验
// 后端：/api/jobs 写入前再校验一遍，防恶意 payload
// ============================================================

import { z } from "zod";

export const hardRequirementSchema = z.object({
  kind: z.enum(["education", "min_years", "location", "custom"]),
  label: z.string().min(1, "请填写说明"),
  value: z.union([z.string().min(1, "请填写值"), z.number()]),
});

export const skillRequirementSchema = z.object({
  name: z.string().min(1, "请填写技能名"),
  weight: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
  ]),
  level: z.enum(["must", "preferred"]),
});

export const customDimensionSchema = z.object({
  name: z.string().min(1, "请填写维度名"),
  weight: z.number().int().min(1).max(5),
  description: z.string().default(""),
});

const toLower = (v: unknown) => (typeof v === "string" ? v.toLowerCase() : v);
export const schoolTierSchema = z.object({
  tier: z.preprocess(
    toLower,
    z.enum(["c9", "985", "211", "shuangyiliu", "qs50", "qs100"]),
  ),
  level: z.preprocess(toLower, z.enum(["must", "bonus"])),
});

export const screeningCriteriaSchema = z.object({
  hard: z.array(hardRequirementSchema).default([]),
  skills: z.array(skillRequirementSchema).default([]),
  bonus: z.array(z.string().min(1)).default([]),
  custom: z.array(customDimensionSchema).default([]),
  schoolTiers: z.array(schoolTierSchema).default([]),
});

export const jobStatusSchema = z.enum(["draft", "open", "closed"]);
export const hiringTypeSchema = z.enum(["campus", "social"]);

export const jobInputSchema = z.object({
  title: z.string().min(1, "岗位标题必填").max(128),
  department: z.string().max(64).default(""),
  location: z.string().max(64).default(""),
  description: z.string().min(1, "岗位描述必填"),
  criteria: screeningCriteriaSchema,
  pushThreshold: z.number().int().min(0).max(100).default(80),
  status: jobStatusSchema.default("draft"),
  hiringType: hiringTypeSchema.default("social"),
});

export const jobPatchSchema = jobInputSchema.partial();

export type JobInput = z.infer<typeof jobInputSchema>;
export type JobPatch = z.infer<typeof jobPatchSchema>;

export const emptyCriteria = {
  hard: [],
  skills: [],
  bonus: [],
  custom: [],
  schoolTiers: [],
};

export const emptyJobInput: JobInput = {
  title: "",
  department: "",
  location: "",
  description: "",
  criteria: emptyCriteria,
  pushThreshold: 80,
  status: "draft",
  hiringType: "social",
};

export const HIRING_TYPE_LABEL: Record<"campus" | "social", string> = {
  campus: "校招",
  social: "社招",
};
