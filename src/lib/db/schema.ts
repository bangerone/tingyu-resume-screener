// ============================================================
// Drizzle schema — TiDB Cloud (MySQL 协议)
// ============================================================
// 这是数据模型的 single source of truth。
// 修改后跑：
//   npm run db:generate   生成 migration SQL
//   npm run db:push       推送到 TiDB（dev 阶段直接 push）
// ============================================================

import {
  mysqlTable,
  varchar,
  text,
  json,
  int,
  boolean,
  timestamp,
  mysqlEnum,
  index,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";
import type {
  ScreeningCriteria,
  ParsedResume,
  ScoreResult,
} from "@/types";

// uuid 生成统一在应用层（用 crypto.randomUUID()），DB 不加默认

// ---------- candidates ----------
// 候选人账号（邮箱验证码 + JWT 后建立）
export const candidates = mysqlTable(
  "candidates",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: varchar("name", { length: 64 }).notNull().default(""),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("candidates_email_idx").on(t.email),
  }),
);

// ---------- email verification codes ----------
// 候选人登录用的 6 位验证码，5 分钟有效，一次性
export const emailCodes = mysqlTable(
  "email_codes",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    codeHash: varchar("code_hash", { length: 128 }).notNull(),
    consumed: boolean("consumed").notNull().default(false),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    emailIdx: index("email_codes_email_idx").on(t.email),
    expiresIdx: index("email_codes_expires_idx").on(t.expiresAt),
  }),
);

// ---------- jobs ----------
export const jobs = mysqlTable(
  "jobs",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    title: varchar("title", { length: 128 }).notNull(),
    department: varchar("department", { length: 64 }).notNull().default(""),
    location: varchar("location", { length: 64 }).notNull().default(""),
    description: text("description").notNull(),
    criteria: json("criteria").$type<ScreeningCriteria>().notNull(),
    pushThreshold: int("push_threshold").notNull().default(80),
    status: mysqlEnum("status", ["draft", "open", "closed"])
      .notNull()
      .default("draft"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`),
  },
  (t) => ({
    statusIdx: index("jobs_status_idx").on(t.status),
  }),
);

// ---------- applications ----------
export const applications = mysqlTable(
  "applications",
  {
    id: varchar("id", { length: 36 }).primaryKey(),
    jobId: varchar("job_id", { length: 36 }).notNull(),
    candidateId: varchar("candidate_id", { length: 36 }).notNull(),
    candidateName: varchar("candidate_name", { length: 64 }).notNull(),
    candidateEmail: varchar("candidate_email", { length: 255 }).notNull(),
    candidatePhone: varchar("candidate_phone", { length: 32 })
      .notNull()
      .default(""),
    // COS object key, e.g. "resumes/<candidate-id>/<ts>.pdf"
    resumeFileKey: varchar("resume_file_key", { length: 512 }).notNull(),
    parsedResume: json("parsed_resume").$type<ParsedResume>(),
    score: json("score").$type<ScoreResult>(),
    status: mysqlEnum("status", [
      "received",
      "parsing",
      "scoring",
      "scored",
      "pushed",
      "failed",
    ])
      .notNull()
      .default("received"),
    pushedToFeishuAt: timestamp("pushed_to_feishu_at"),
    failReason: text("fail_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    jobIdx: index("applications_job_idx").on(t.jobId),
    candidateIdx: index("applications_candidate_idx").on(t.candidateId),
    statusIdx: index("applications_status_idx").on(t.status),
  }),
);

// ---------- feishu push logs ----------
export const feishuLogs = mysqlTable("feishu_logs", {
  id: varchar("id", { length: 36 }).primaryKey(),
  applicationId: varchar("application_id", { length: 36 }).notNull(),
  jobId: varchar("job_id", { length: 36 }).notNull(),
  ok: boolean("ok").notNull(),
  response: text("response").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- inferred types (use in app code) ----------
export type Candidate = typeof candidates.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type FeishuLog = typeof feishuLogs.$inferSelect;
