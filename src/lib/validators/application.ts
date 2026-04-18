// ============================================================
// Application / ParsedResume zod schemas（提交 API + 前端 form 共用）
// ============================================================

import { z } from "zod";

export const educationItemSchema = z.object({
  school: z.string().default(""),
  degree: z.string().default(""),
  major: z.string().default(""),
  period: z.string().default(""),
});

export const experienceItemSchema = z.object({
  company: z.string().default(""),
  title: z.string().default(""),
  period: z.string().default(""),
  summary: z.string().default(""),
});

export const projectItemSchema = z.object({
  name: z.string().default(""),
  role: z.string().default(""),
  summary: z.string().default(""),
});

export const awardItemSchema = z.object({
  title: z.string().default(""),
  date: z.string().default(""),
  description: z.string().default(""),
});

export const parsedResumeSchema = z.object({
  name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  total_years: z.number().optional(),
  gender: z.string().default(""),
  birth_date: z.string().default(""),
  work_status: z.string().default(""),
  expected_city: z.string().default(""),
  expected_salary: z.string().default(""),
  available_from: z.string().default(""),
  self_intro: z.string().default(""),
  education: z.array(educationItemSchema).default([]),
  experience: z.array(experienceItemSchema).default([]),
  skills: z.array(z.string()).default([]),
  projects: z.array(projectItemSchema).default([]),
  awards: z.array(awardItemSchema).default([]),
  raw_text: z.string().default(""),
});

export const applicationSubmitSchema = z.object({
  jobId: z.string().min(1),
  // 允许简历 fileKey 为空（候选人没简历，只手填）
  resumeFileKey: z.string().default(""),
  candidateName: z.string().min(1, "请填写姓名").max(64),
  candidatePhone: z.string().max(32).default(""),
  parsedResume: parsedResumeSchema,
});

export type ApplicationSubmit = z.infer<typeof applicationSubmitSchema>;
export type ParsedResumeInput = z.infer<typeof parsedResumeSchema>;
