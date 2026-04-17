// GET /api/auth/candidate/me — 返回当前候选人的基本信息（未登录返回 null）
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getCandidateSession } from "@/lib/auth/candidate";
import { db } from "@/lib/db/client";
import { candidates } from "@/lib/db/schema";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  const [row] = await db
    .select()
    .from(candidates)
    .where(eq(candidates.id, session.sub))
    .limit(1);
  if (!row) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: { id: row.id, email: row.email, name: row.name },
  });
}
