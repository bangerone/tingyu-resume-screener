// ============================================================
// /api/jobs/[id] —— GET / PATCH / DELETE 单个岗位
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { isHrAuthenticated } from "@/lib/auth/hr";
import { jobPatchSchema } from "@/features/jobs/job-schema";

export const runtime = "nodejs";

type Ctx = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Ctx) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const [row] = await db.select().from(jobs).where(eq(jobs.id, params.id));
  if (!row) {
    return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
  }
  return NextResponse.json({ job: row });
}

export async function PATCH(req: NextRequest, { params }: Ctx) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const parsed = jobPatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "参数校验失败", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const [existing] = await db.select().from(jobs).where(eq(jobs.id, params.id));
  if (!existing) {
    return NextResponse.json({ error: "岗位不存在" }, { status: 404 });
  }

  await db.update(jobs).set(parsed.data).where(eq(jobs.id, params.id));
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  await db.delete(jobs).where(eq(jobs.id, params.id));
  return new NextResponse(null, { status: 204 });
}
