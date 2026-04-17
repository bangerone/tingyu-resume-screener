// ============================================================
// AI 输出的 zod 校验 schema
// ------------------------------------------------------------
// 对齐 src/types/index.ts 的 ParsedResume / ScoreResult
// LLM 返回的 JSON 必须通过这里的校验才能落库。
// ============================================================

import { z } from "zod";
import {
  educationItemSchema,
  experienceItemSchema,
  projectItemSchema,
} from "@/lib/validators/application";

// ---------- ParsedResume（Call #1 输出） ----------

export const parsedResumeAiSchema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  // LLM 偶尔返回字符串，这里统一强转数字
  total_years: z
    .union([z.number(), z.string()])
    .optional()
    .transform((v) => {
      if (v === undefined || v === null || v === "") return 0;
      const n = typeof v === "number" ? v : parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    }),
  education: z.array(educationItemSchema).default([]),
  experience: z.array(experienceItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(projectItemSchema).default([]),
  raw_text: z.string().default(""),
});

export type ParsedResumeAi = z.infer<typeof parsedResumeAiSchema>;

// ---------- ScoreResult（Call #2 输出） ----------

export const scoreBreakdownSchema = z.object({
  hard: z
    .array(
      z.object({
        label: z.string().default(""),
        pass: z.boolean(),
        reason: z.string().default(""),
      }),
    )
    .default([]),
  skills: z
    .array(
      z.object({
        name: z.string().default(""),
        required_weight: z.number().default(1),
        matched: z.boolean(),
      }),
    )
    .default([]),
  experience: z
    .object({
      score: z.number().default(0),
      reason: z.string().default(""),
    })
    .default({ score: 0, reason: "" }),
  bonus: z
    .array(
      z.object({
        item: z.string().default(""),
        hit: z.boolean(),
      }),
    )
    .default([]),
  custom: z
    .array(
      z.object({
        name: z.string().default(""),
        score: z.number().default(0),
        reason: z.string().default(""),
      }),
    )
    .default([]),
});

export const scoreResultAiSchema = z.object({
  total: z.number(),
  passed_hard: z.boolean(),
  breakdown: scoreBreakdownSchema,
  highlights: z.array(z.string()).default([]),
  red_flags: z.array(z.string()).default([]),
  reasoning: z.string().default(""),
});

export type ScoreResultAi = z.infer<typeof scoreResultAiSchema>;
