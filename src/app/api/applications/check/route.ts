// GET /api/applications/check?job_id=xxx
// 返回当前候选人对该岗位 30 天内是否已投递过
import { NextResponse, type NextRequest } from "next/server";
import { and, eq, gt } from "drizzle-orm";
import { getCandidateSession } from "@/lib/auth/candidate";
import { db } from "@/lib/db/client";
import { applications } from "@/lib/db/schema";

export const runtime = "nodejs";

const DEDUP_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(req: NextRequest) {
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }
  const jobId = req.nextUrl.searchParams.get("job_id");
  if (!jobId) {
    return NextResponse.json({ error: "缺少 job_id" }, { status: 400 });
  }

  const since = new Date(Date.now() - DEDUP_WINDOW_MS);
  const rows = await db
    .select({ id: applications.id, createdAt: applications.createdAt })
    .from(applications)
    .where(
      and(
        eq(applications.candidateId, session.sub),
        eq(applications.jobId, jobId),
        gt(applications.createdAt, since),
      ),
    )
    .limit(1);

  return NextResponse.json({
    applied: rows.length > 0,
    applicationId: rows[0]?.id ?? null,
  });
}
