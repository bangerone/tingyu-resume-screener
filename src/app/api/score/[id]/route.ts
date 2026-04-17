// ============================================================
// POST /api/score/[id]
// ------------------------------------------------------------
// 后台异步评分：
//   1. 读 application + 关联 job
//   2. 若无 parsed_resume → status=failed, fail_reason=missing_parsed
//   3. status=scoring
//   4. scoreResume (LLM Call #2)
//   5. 写回 score + status=scored
//   6. （D5 接入飞书推送；D4 只 console.log 占位）
//
// 触发来源：
//   - /api/applications POST 成功后 fire-and-forget
//   - HR 手动 POST（重试）—— 允许覆盖更新
//
// 鉴权：
//   - 内部 fire-and-forget 用 INTERNAL_SCORE_TOKEN header 放行
//   - HR 带着 admin cookie 来也放行
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, jobs } from "@/lib/db/schema";
import { isHrAuthenticated } from "@/lib/auth/hr";
import { isReadOnlyHr, readOnlyHrResponse } from "@/lib/auth/demo-guard";
import { scoreResume, AiScoreError } from "@/lib/ai/scorer";
import { pushToFeishu } from "@/features/feishu";

export const runtime = "nodejs";
export const maxDuration = 90;

const INTERNAL_HEADER = "x-internal-score-token";

function resolveInternalToken(): string {
  return process.env.INTERNAL_SCORE_TOKEN ?? process.env.JWT_SECRET ?? "";
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = params.id;
  if (!id) {
    return NextResponse.json({ error: "missing id" }, { status: 400 });
  }

  // 鉴权：内部 token 或 HR session
  const internalToken = req.headers.get(INTERNAL_HEADER);
  const expected = resolveInternalToken();
  const isInternal =
    !!internalToken && !!expected && internalToken === expected;
  const hrOk = isInternal ? true : await isHrAuthenticated();
  if (!isInternal && !hrOk) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // HR 手动重试被演示模式拦截；内部 fire-and-forget 照旧放行，保证投递链路不断
  if (!isInternal && isReadOnlyHr()) return readOnlyHrResponse();

  // 1. 取 application
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);
  if (!app) {
    return NextResponse.json({ error: "application not found" }, { status: 404 });
  }

  if (!app.parsedResume) {
    await db
      .update(applications)
      .set({ status: "failed", failReason: "missing_parsed_resume" })
      .where(eq(applications.id, id));
    return NextResponse.json(
      { error: "application missing parsed_resume" },
      { status: 400 },
    );
  }

  // 2. 取 job
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, app.jobId))
    .limit(1);
  if (!job) {
    await db
      .update(applications)
      .set({ status: "failed", failReason: "job_not_found" })
      .where(eq(applications.id, id));
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }

  // 3. 标记 scoring
  await db
    .update(applications)
    .set({ status: "scoring", failReason: null })
    .where(eq(applications.id, id));

  // 4. 评分
  try {
    const score = await scoreResume(app.parsedResume, job);
    await db
      .update(applications)
      .set({ score, status: "scored", failReason: null })
      .where(eq(applications.id, id));

    // D5：若 score.passed_hard && score.total >= job.push_threshold → 飞书推送
    const willPush =
      score.passed_hard && score.total >= (job.pushThreshold ?? 80);
    let pushed: { ok: boolean; msg: string } | null = null;
    if (willPush) {
      try {
        // 重新读 application（拿到最新 score 字段之外的字段；其实主要是 candidate* 字段，
        // 它们在 insert 时就有了，这里直接用内存里的 app 就够，但为清晰起见重读一次）
        pushed = await pushToFeishu(app, job, score);
      } catch (e) {
        // pushToFeishu 内部已经 catch 了，这里是兜底：绝不让 push 异常掉 score
        console.error("[score] feishu push unexpected error", id, e);
        pushed = {
          ok: false,
          msg: e instanceof Error ? e.message : "push failed",
        };
      }
    }

    return NextResponse.json({ ok: true, score, pushed });
  } catch (e) {
    const reason =
      e instanceof AiScoreError
        ? `${e.message}${e.detail ? ` | ${e.detail}` : ""}`
        : e instanceof Error
          ? e.message
          : "unknown";
    console.error("[score] failed", id, reason);
    await db
      .update(applications)
      .set({ status: "failed", failReason: `score: ${reason}`.slice(0, 1000) })
      .where(eq(applications.id, id));
    return NextResponse.json({ error: reason }, { status: 502 });
  }
}
