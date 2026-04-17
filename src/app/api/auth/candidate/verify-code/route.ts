// POST /api/auth/candidate/verify-code
// body: { email, code }
// 成功 → 标记 code 已消费 + upsert candidate + set JWT cookie
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  consumeEmailCode,
  loginCandidateByEmail,
} from "@/lib/auth/candidate";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email().max(255),
  code: z.string().regex(/^\d{6}$/, "验证码应为 6 位数字"),
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

  const { email, code } = parsed.data;
  const matched = await consumeEmailCode(email, code);
  if (!matched) {
    return NextResponse.json(
      { error: "验证码错误或已过期" },
      { status: 401 },
    );
  }

  await loginCandidateByEmail(email);
  return NextResponse.json({ ok: true });
}
