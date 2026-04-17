// ============================================================
// POST /api/feishu/test —— HR 手动触发飞书推送
// ------------------------------------------------------------
// body: { application_id: string }
//   - 必须 HR 登录
//   - application 必须已评分（score 非空）
//   - 成功 → 200 { ok:true }；失败 → 200 { ok:false, msg }
//     （注意：push 失败不是 HTTP 失败，是业务失败；详情在 feishu_logs）
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { applications, jobs } from "@/lib/db/schema";
import { isHrAuthenticated } from "@/lib/auth/hr";
import { isReadOnlyHr, readOnlyHrResponse } from "@/lib/auth/demo-guard";
import { pushToFeishu } from "@/features/feishu";

export const runtime = "nodejs";
export const maxDuration = 30;

const bodySchema = z.object({
  application_id: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  if (isReadOnlyHr()) return readOnlyHrResponse();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "application_id 必填" }, { status: 400 });
  }

  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, parsed.data.application_id))
    .limit(1);
  if (!app) {
    return NextResponse.json({ error: "投递不存在" }, { status: 404 });
  }
  if (!app.score) {
    return NextResponse.json(
      { error: "该投递还未评分，无法推送" },
      { status: 400 },
    );
  }

  const [job] = await db.select().from(jobs).where(eq(jobs.id, app.jobId)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "岗位已删除" }, { status: 404 });
  }

  const result = await pushToFeishu(app, job, app.score);
  return NextResponse.json(result);
}
