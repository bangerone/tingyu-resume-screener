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

export const screeningCriteriaSchema = z.object({
  hard: z.array(hardRequirementSchema).default([]),
  skills: z.array(skillRequirementSchema).default([]),
  bonus: z.array(z.string().min(1)).default([]),
  custom: z.array(customDimensionSchema).default([]),
});

export const jobStatusSchema = z.enum(["draft", "open", "closed"]);

export const jobInputSchema = z.object({
  title: z.string().min(1, "岗位标题必填").max(128),
  department: z.string().max(64).default(""),
  location: z.string().max(64).default(""),
  description: z.string().min(1, "岗位描述必填"),
  criteria: screeningCriteriaSchema,
  pushThreshold: z.number().int().min(0).max(100).default(80),
  status: jobStatusSchema.default("draft"),
});

export const jobPatchSchema = jobInputSchema.partial();

export type JobInput = z.infer<typeof jobInputSchema>;
export type JobPatch = z.infer<typeof jobPatchSchema>;

export const emptyCriteria = {
  hard: [],
  skills: [],
  bonus: [],
  custom: [],
};

export const emptyJobInput: JobInput = {
  title: "",
  department: "",
  location: "",
  description: "",
  criteria: emptyCriteria,
  pushThreshold: 80,
  status: "draft",
};
