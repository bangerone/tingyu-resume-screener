// ============================================================
// /api/dev/ping — 冒烟测试
// ============================================================
// 只在 dev 可用。汇报：
//   - DATABASE_URL 是否配置 + DB 是否能 SELECT 1
//   - 各服务 env 是否齐全（不回显敏感值）
// 生产禁用，防止泄露 env 清单
// ============================================================

import { NextResponse } from "next/server";
import { db } from "@/lib/db/client";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Status = "ok" | "missing" | "error";

function envStatus(keys: string[]): Record<string, Status> {
  const out: Record<string, Status> = {};
  for (const k of keys) out[k] = process.env[k] ? "ok" : "missing";
  return out;
}

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 404 });
  }

  // DB 连通性 + 5 张表是否存在 + 行数
  let dbStatus: { status: Status; message?: string } = { status: "ok" };
  const tableCounts: Record<string, number | string> = {};
  try {
    await db.execute(sql`SELECT 1 AS one`);
    for (const t of [
      "candidates",
      "email_codes",
      "jobs",
      "applications",
      "feishu_logs",
    ]) {
      try {
        const res: any = await db.execute(
          sql.raw(`SELECT COUNT(*) AS c FROM \`${t}\``),
        );
        // mysql2 result shape: [rows, fields]
        const rows = Array.isArray(res) ? res[0] : res?.rows ?? res;
        const row = Array.isArray(rows) ? rows[0] : rows;
        tableCounts[t] = Number(row?.c ?? row?.C ?? 0);
      } catch (e: any) {
        tableCounts[t] = `missing: ${e?.message ?? "unknown"}`;
      }
    }
  } catch (e: any) {
    dbStatus = { status: "error", message: e?.message ?? String(e) };
  }

  return NextResponse.json({
    ok: dbStatus.status === "ok",
    db: dbStatus,
    tables: tableCounts,
    env: {
      core: envStatus(["DATABASE_URL", "JWT_SECRET", "HR_ACCESS_PASSWORD"]),
      cos: envStatus([
        "COS_BUCKET",
        "COS_REGION",
        "COS_SECRET_ID",
        "COS_SECRET_KEY",
      ]),
      email: envStatus(["RESEND_API_KEY", "EMAIL_FROM"]),
      ai: envStatus(["DEEPSEEK_API_KEY", "AI_API_KEY", "OPENAI_API_KEY"]),
      feishu: envStatus(["FEISHU_WEBHOOK_URL"]),
      app: envStatus(["APP_BASE_URL"]),
    },
    note: "email/ai 里任一 env 存在即可; RESEND_API_KEY 缺失时验证码会打印到 server console",
  });
}
