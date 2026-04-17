// GET /api/resume/sts — D1 占位
// ============================================================
// 原方案：候选人前端用 STS 临时凭证直传 COS。
// demo 简化：改走 server 中转上传（D3 实现 /api/resume/upload，
//   候选人 POST FormData 到 server，server 用 COS SDK 存到 resumes/<candidateId>/*）。
// 本路由在 D1 仅做：候选人 session 守卫 + 返回 501（占位），证明路由通。
// ============================================================

import { NextResponse } from "next/server";
import { getCandidateSession } from "@/lib/auth/candidate";

export const runtime = "nodejs";

export async function GET() {
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  return NextResponse.json(
    {
      error: "not implemented",
      detail:
        "demo 改用 server 中转上传（D3 实现 POST /api/resume/upload），本接口仅保留占位。",
      candidateId: session.sub,
    },
    { status: 501 },
  );
}
