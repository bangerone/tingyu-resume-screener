// ============================================================
// /api/jobs —— GET 列表 / POST 创建
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { isHrAuthenticated } from "@/lib/auth/hr";
import { jobInputSchema } from "@/features/jobs/job-schema";

export const runtime = "nodejs";

export async function GET() {
  // 列表也要求已登录 HR（候选人侧有独立的 /api/jobs-public 设计，这里不混用）
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt));
  return NextResponse.json({ jobs: rows });
}

export async function POST(req: NextRequest) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const parsed = jobInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "参数校验失败", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const id = crypto.randomUUID();
  const input = parsed.data;
  await db.insert(jobs).values({
    id,
    title: input.title,
    department: input.department,
    location: input.location,
    description: input.description,
    criteria: input.criteria,
    pushThreshold: input.pushThreshold,
    status: input.status,
  });

  return NextResponse.json({ id }, { status: 201 });
}
