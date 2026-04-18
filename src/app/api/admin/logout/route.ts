// POST /api/admin/logout — 清 HR cookie
// 返回 303 跳回首页：HR nav 用 <form action method=post> 直接提交，
// 若返回 JSON 浏览器会把 {"ok":true} 渲染成一张白页。
import { NextResponse, type NextRequest } from "next/server";
import { logoutHr } from "@/lib/auth/hr";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  logoutHr();
  return NextResponse.redirect(new URL("/", req.url), 303);
}
