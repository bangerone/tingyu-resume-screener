// ============================================================
// /api/applications/[id] —— HR 侧读取 + 修改 status
// ============================================================
// GET   : HR 获取单条（含 parsed_resume / score）
// PATCH : HR 手动改 status（比如"拒绝"→failed，或重开→scored）
//         只允许改 status，不允许改别的字段（避免误伤数据）
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { applications, jobs } from "@/lib/db/schema";
import { isHrAuthenticated } from "@/lib/auth/hr";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const [row] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, params.id))
    .limit(1);
  if (!row) {
    return NextResponse.json({ error: "投递不存在" }, { status: 404 });
  }
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, row.jobId))
    .limit(1);
  return NextResponse.json({ application: row, job: job ?? null });
}

const patchSchema = z.object({
  status: z.enum(["received", "parsing", "scoring", "scored", "pushed", "failed"]),
});

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数校验失败" },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select({ id: applications.id })
    .from(applications)
    .where(eq(applications.id, params.id))
    .limit(1);
  if (!existing) {
    return NextResponse.json({ error: "投递不存在" }, { status: 404 });
  }

  await db
    .update(applications)
    .set({ status: parsed.data.status })
    .where(eq(applications.id, params.id));
  return NextResponse.json({ ok: true });
}
