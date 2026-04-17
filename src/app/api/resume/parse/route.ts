// ============================================================
// POST /api/resume/parse
// ------------------------------------------------------------
// 入参：{ fileKey }
// 出参：{ parsedResume: ParsedResume }
//
// 流程：
//   1. 校验候选人 session
//   2. 校验 fileKey 在候选人自己目录下
//   3. COS download → Buffer
//   4. extractTextFromBuffer
//   5. parseResume (LLM Call #1)
//   6. 返回结构化 JSON，供前端 autofill
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications } from "@/lib/db/schema";
import { getCandidateSession } from "@/lib/auth/candidate";
import { downloadResume } from "@/lib/storage/cos";
import { extractTextFromBuffer } from "@/lib/ai/extract";
import { parseResume, AiParseError } from "@/lib/ai/parser";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  fileKey: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  // D6.5 演示限额：每账号投递数 >= 上限时，parse 也一并拒绝（防绕过）
  const cap = Number(process.env.DEMO_MAX_APPLICATIONS_PER_CANDIDATE ?? 0);
  if (cap > 0) {
    const [row] = await db
      .select({ c: sql<number>`count(*)` })
      .from(applications)
      .where(eq(applications.candidateId, session.sub));
    if (Number(row?.c ?? 0) >= cap) {
      return NextResponse.json(
        { error: `演示限额：每账号最多可投递 ${cap} 次` },
        { status: 429 },
      );
    }
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "参数错误" },
      { status: 400 },
    );
  }

  const { fileKey } = parsed.data;
  if (!fileKey.startsWith(`resumes/${session.sub}/`)) {
    return NextResponse.json(
      { error: "fileKey 与当前候选人不匹配" },
      { status: 403 },
    );
  }

  // 1. 下载
  let buf: Buffer;
  try {
    buf = await downloadResume(fileKey);
  } catch (e) {
    console.error("[resume/parse] COS download failed", e);
    return NextResponse.json(
      { error: "无法读取简历文件，请重新上传" },
      { status: 502 },
    );
  }

  // 2. 抽取文本
  let text: string;
  try {
    text = await extractTextFromBuffer(buf, fileKey);
  } catch (e) {
    const msg =
      e instanceof Error ? e.message : "简历文本抽取失败，请换一份 PDF/DOCX";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // 3. LLM 结构化
  try {
    const parsedResume = await parseResume(text);
    // 回填候选人的登录邮箱（LLM 可能漏填或认错）
    if (!parsedResume.email && session.email) {
      parsedResume.email = session.email;
    }
    return NextResponse.json({ parsedResume });
  } catch (e) {
    if (e instanceof AiParseError) {
      console.error("[resume/parse] AI parse failed", e.message, e.detail);
      return NextResponse.json(
        { error: "AI 解析失败，请稍后重试或手动填写" },
        { status: 502 },
      );
    }
    console.error("[resume/parse] unexpected", e);
    return NextResponse.json(
      { error: "解析异常，请稍后重试" },
      { status: 500 },
    );
  }
}
