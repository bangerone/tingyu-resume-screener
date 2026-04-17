// POST /api/admin/login — HR 共享密码登录
import { NextRequest, NextResponse } from "next/server";
import { loginHr } from "@/lib/auth/hr";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }
  const password = typeof body?.password === "string" ? body.password : "";
  if (!password) {
    return NextResponse.json({ error: "password required" }, { status: 400 });
  }

  const ok = await loginHr(password);
  if (!ok) {
    return NextResponse.json({ error: "密码错误" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}
