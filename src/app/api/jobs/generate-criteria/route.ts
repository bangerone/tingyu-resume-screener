// ============================================================
// POST /api/jobs/generate-criteria  —— JD → ScreeningCriteria
// ============================================================
// HR 专属。贴 JD 纯文本，返回 LLM 生成的 criteria 草稿。
// 前端 JobForm 用 useFieldArray append 合并进当前表单。
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { isHrAuthenticated } from "@/lib/auth/hr";
import { bumpAndCheck } from "@/lib/rate-limit";
import {
  generateCriteriaFromJD,
  CriteriaGenError,
} from "@/lib/ai/criteria-generator";

export const runtime = "nodejs";
export const maxDuration = 60;

const bodySchema = z.object({
  jd: z.string().min(20, "JD 内容太短，至少 20 个字"),
});

export async function POST(req: NextRequest) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  // D6.5 全局每日 10 次上限（保留 LLM 体验但防账单被薅）
  const rl = bumpAndCheck("generate-criteria|daily", 10, 24 * 60 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "演示限额：AI 生成已达今日上限" },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "请求体不是合法 JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数校验失败" },
      { status: 400 },
    );
  }

  try {
    const criteria = await generateCriteriaFromJD(parsed.data.jd);
    return NextResponse.json({ criteria });
  } catch (e) {
    if (e instanceof CriteriaGenError) {
      return NextResponse.json(
        { error: e.message, detail: e.detail },
        { status: 502 },
      );
    }
    const msg = e instanceof Error ? e.message : "AI 生成失败";
    console.error("[generate-criteria]", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
