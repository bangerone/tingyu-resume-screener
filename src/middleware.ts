// ============================================================
// middleware — /admin/* 路由守卫
// ============================================================
// 未登录访问 /admin/* → 302 到 /admin/login
// /admin/login 本身放行
//
// 注意：middleware 跑在 Edge runtime，用 jose 做 HS256 校验（jose 兼容 Edge）。
// 不导入 lib/db/* 或 lib/auth/hr.ts（那些用 next/headers + mysql2，只能 Node runtime）
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const HR_COOKIE = "tingyu_hr";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    // middleware 拿不到 secret 只能拒绝，安全起见视为未登录
    return new TextEncoder().encode("__invalid__".padEnd(32, "_"));
  }
  return new TextEncoder().encode(secret);
}

async function isHrAuthed(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload.role === "hr";
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  // 放行 /admin/login（以及可能的子路径）
  if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(HR_COOKIE)?.value;
  if (await isHrAuthed(token)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  // 匹配所有 /admin 和 /admin/* 路径；API 路由单独守
  matcher: ["/admin", "/admin/:path*"],
};
