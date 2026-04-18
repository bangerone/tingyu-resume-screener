// ============================================================
// POST /api/applications  — 候选人提交投递
// GET  /api/applications  — 当前候选人的投递列表（RSC 用不到，保留给前端 fallback）
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { and, desc, eq, gt, sql } from "drizzle-orm";
import { getCandidateSession } from "@/lib/auth/candidate";
import { isHrAuthenticated } from "@/lib/auth/hr";
import { db } from "@/lib/db/client";
import { applications, candidates, jobs } from "@/lib/db/schema";
import { applicationSubmitSchema } from "@/lib/validators/application";

export const runtime = "nodejs";

const DEDUP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

export async function POST(req: NextRequest) {
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // 业务规则：每账号最多 2 个活跃投递；超出需先撤回已有的
  // 演示环境若显式设了 DEMO_MAX_APPLICATIONS_PER_CANDIDATE，则取二者较小
  const hardCap = 2;
  const envCap = Number(process.env.DEMO_MAX_APPLICATIONS_PER_CANDIDATE ?? 0);
  const cap = envCap > 0 ? Math.min(envCap, hardCap) : hardCap;
  const [row] = await db
    .select({ c: sql<number>`count(*)` })
    .from(applications)
    .where(eq(applications.candidateId, session.sub));
  if (Number(row?.c ?? 0) >= cap) {
    return NextResponse.json(
      {
        error: `每个账号最多同时保留 ${cap} 份投递；如需投递新岗位，请先在「我的投递」撤回一份。`,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const parsed = applicationSubmitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数校验失败" },
      { status: 400 },
    );
  }
  const input = parsed.data;

  // fileKey 非空时，必须在自己目录下；空字符串表示候选人只手填未上传
  if (
    input.resumeFileKey &&
    !input.resumeFileKey.startsWith(`resumes/${session.sub}/`)
  ) {
    return NextResponse.json(
      { error: "简历路径非法" },
      { status: 403 },
    );
  }

  // 岗位必须存在 + open
  const [job] = await db.select().from(jobs).where(eq(jobs.id, input.jobId)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
  }
  if (job.status !== "open") {
    return NextResponse.json(
      { error: "该岗位暂未开放投递" },
      { status: 400 },
    );
  }

  // 30 天内去重
  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const dupes = await db
    .select({ id: applications.id })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, session.sub),
        eq(applications.jobId, input.jobId),
        gt(applications.createdAt, since),
      ),
    )
    .limit(1);
  if (dupes.length > 0) {
    return NextResponse.json(
      { error: "你已投过该岗位（30 天内不可重复投递）", duplicate: true },
      { status: 409 },
    );
  }

  // 更新候选人 name（若之前没填）
  if (input.candidateName) {
    await db
      .update(candidates)
      .set({ name: input.candidateName })
      .where(eq(candidates.id, session.sub));
  }

  const id = randomUUID();
  await db.insert(applications).values({
    id,
    jobId: input.jobId,
    candidateId: session.sub,
    candidateName: input.candidateName,
    candidateEmail: session.email ?? "",
    candidatePhone: input.candidatePhone ?? "",
    resumeFileKey: input.resumeFileKey,
    parsedResume: input.parsedResume,
    status: "received",
  });

  // Fire-and-forget：触发后台评分。不 await，不阻塞响应。
  triggerScore(id);

  return NextResponse.json({ id }, { status: 201 });
}

function triggerScore(applicationId: string) {
  const base = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const token =
    process.env.INTERNAL_SCORE_TOKEN ?? process.env.JWT_SECRET ?? "";
  // 注意：不 await，错误只打日志；score route 内部会处理失败 → status=failed
  fetch(`${base}/api/score/${applicationId}`, {
    method: "POST",
    headers: { "x-internal-score-token": token },
  })
    .then((r) => {
      if (!r.ok) {
        console.warn(
          `[applications] score trigger for ${applicationId} returned ${r.status}`,
        );
      }
    })
    .catch((err) => {
      console.warn(
        `[applications] score trigger for ${applicationId} failed:`,
        err,
      );
    });
}

export async function GET(req: NextRequest) {
  const scope = req.nextUrl.searchParams.get("scope");

  // HR 视图（/admin 侧拉全量）
  if (scope === "admin") {
    if (!(await isHrAuthenticated())) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    const rows = await db
      .select({
        id: applications.id,
        jobId: applications.jobId,
        jobTitle: jobs.title,
        candidateName: applications.candidateName,
        candidateEmail: applications.candidateEmail,
        status: applications.status,
        score: applications.score,
        pushedToFeishuAt: applications.pushedToFeishuAt,
        createdAt: applications.createdAt,
      })
      .from(applications)
      .leftJoin(jobs, eq(applications.jobId, jobs.id))
      .orderBy(desc(applications.createdAt));
    return NextResponse.json({ applications: rows });
  }

  // 候选人视图
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  const rows = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      status: applications.status,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .where(eq(applications.candidateId, session.sub))
    .orderBy(desc(applications.createdAt));

  return NextResponse.json({ applications: rows });
}
