// ============================================================
// pushToFeishu —— 组装 card + 推送 + 写 feishu_logs + 更新 application
// ============================================================
// 设计：
//   - secret 可选：设了就带 timestamp+sign，没设就直推（关键词/IP 白名单模式）
//   - HTTP 非 2xx 或响应 code !== 0 → ok=false；但不抛异常给上游，避免破坏 score 流
//   - 成功 → application.status='pushed', pushed_to_feishu_at=now()
//   - 失败 → application 保持原状态（通常是 scored）；只写 feishu_logs(ok=false)
// ============================================================

import { randomUUID } from "crypto";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, feishuLogs, type Application, type Job } from "@/lib/db/schema";
import type { ScoreResult } from "@/types";
import { feishuSign } from "./sign";
import { buildCandidateCard } from "./build-card";

export interface PushResult {
  ok: boolean;
  msg: string;
}

function baseUrl(): string {
  return process.env.APP_BASE_URL ?? "http://localhost:3000";
}

export async function pushToFeishu(
  application: Pick<
    Application,
    "id" | "candidateName" | "candidateEmail" | "candidatePhone"
  >,
  job: Pick<Job, "id" | "title" | "department" | "location">,
  score: ScoreResult,
): Promise<PushResult> {
  const webhook = process.env.FEISHU_WEBHOOK_URL;
  if (!webhook) {
    const msg = "FEISHU_WEBHOOK_URL env not set";
    await writeLog(application.id, job.id, false, msg);
    return { ok: false, msg };
  }

  const detailUrl = `${baseUrl()}/admin/applications/${application.id}`;
  const card = buildCandidateCard({ application, job, score, detailUrl });

  const body: Record<string, unknown> = { ...card };
  const secret = process.env.FEISHU_WEBHOOK_SECRET;
  if (secret) {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    body.timestamp = timestamp;
    body.sign = feishuSign(timestamp, secret);
  }

  let ok = false;
  let respText = "";
  try {
    const resp = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    respText = await resp.text();
    if (resp.ok) {
      // 飞书成功响应形如 {"StatusCode":0,"StatusMessage":"success","code":0,...}
      try {
        const json = JSON.parse(respText) as { code?: number; StatusCode?: number };
        const code = typeof json.code === "number" ? json.code : json.StatusCode;
        ok = code === 0;
      } catch {
        ok = false;
      }
    }
  } catch (e) {
    respText = e instanceof Error ? `fetch error: ${e.message}` : "fetch error";
    ok = false;
  }

  await writeLog(application.id, job.id, ok, respText);

  if (ok) {
    await db
      .update(applications)
      .set({ status: "pushed", pushedToFeishuAt: new Date() })
      .where(eq(applications.id, application.id));
    return { ok: true, msg: "pushed" };
  }

  return { ok: false, msg: respText.slice(0, 500) || "push failed" };
}

async function writeLog(
  applicationId: string,
  jobId: string,
  ok: boolean,
  response: string,
) {
  try {
    await db.insert(feishuLogs).values({
      id: randomUUID(),
      applicationId,
      jobId,
      ok,
      response: response.slice(0, 65000),
    });
  } catch (e) {
    console.error("[feishu] write log failed", e);
  }
}
