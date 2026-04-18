// POST /api/auth/candidate/request-code
// body: { email }
// 1. 生成 6 位验证码、hash 存 email_codes（5 分钟有效）
// 2. 发送邮件（dev 无 RESEND_API_KEY 时打印到 server console）
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { issueEmailCode } from "@/lib/auth/candidate";
import { sendCandidateCode } from "@/lib/email/send";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email("邮箱格式不正确").max(255),
});

export async function POST(req: NextRequest) {
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

  const email = parsed.data.email.toLowerCase().trim();
  try {
    const code = await issueEmailCode(email);
    const result = await sendCandidateCode({ to: email, code });
    // demo / dev：没配 RESEND_API_KEY 时，直接把验证码带回前端，
    // 让任何邮箱都能在浏览器里完成登录演示（不再需要看 server log）。
    // 生产环境必须配 RESEND_API_KEY，届时 devPrinted=false，不会泄露。
    if (result.devPrinted) {
      return NextResponse.json({ ok: true, devCode: code });
    }
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "发送失败" },
      { status: 500 },
    );
  }
}
