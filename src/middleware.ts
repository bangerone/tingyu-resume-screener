// ============================================================
// middleware — 访问码门禁 + /admin/* HR 守卫
// ============================================================
// 两层守卫（都在 Edge runtime）：
//
// 1) 访问码门禁（D6.5 演示加固）
//    - env DEMO_ACCESS_CODE 非空时启用；否则完全跳过
//    - 放行：/welcome · /api/** · /_next/** · /favicon.ico
//    - 其他路径：缺 cookie `demo-access=1` → 302 到 /welcome?next=<当前 URL>
//    - /welcome?k=<code> 命中 env → 种 cookie（httpOnly, 30 天）+ 跳 next
//      next 必须以 "/" 开头、非 "//"、不含 "://"，否则降级为 "/"（防 open redirect）
//
// 2) /admin/* HR 守卫（保持原逻辑）
//    - 无合法 JWT → 跳 /admin/login
//    - /admin/login 放行
//
// 注意：middleware 只能用 jose（Edge 兼容），不能 import lib/db/* 或 next/headers。
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const HR_COOKIE = "tingyu_hr";
const DEMO_COOKIE = "demo-access";

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
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

function safeNext(raw: string | null | undefined): string {
  if (!raw) return "/";
  if (!raw.startsWith("/")) return "/";
  if (raw.startsWith("//")) return "/";
  if (raw.includes("://")) return "/";
  return raw;
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // 放行：API / Next 内部 / favicon
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const demoCode = process.env.DEMO_ACCESS_CODE;
  const demoGateEnabled = !!demoCode;

  // /welcome：如带合法 k → 种 cookie + 跳 next；否则页面自己渲染（显示表单或错误）
  if (pathname === "/welcome") {
    if (demoGateEnabled) {
      const k = searchParams.get("k");
      if (k && k === demoCode) {
        const target = req.nextUrl.clone();
        target.pathname = safeNext(searchParams.get("next"));
        target.search = "";
        const res = NextResponse.redirect(target);
        res.cookies.set(DEMO_COOKIE, "1", {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
          maxAge: 30 * 24 * 60 * 60,
        });
        return res;
      }
    }
    return NextResponse.next();
  }

  // 门禁：未持 cookie → 跳 /welcome?next=<当前路径 + query>
  if (demoGateEnabled) {
    const hasGate = req.cookies.get(DEMO_COOKIE)?.value === "1";
    if (!hasGate) {
      const target = req.nextUrl.clone();
      target.pathname = "/welcome";
      target.search = "";
      target.searchParams.set(
        "next",
        pathname + (req.nextUrl.search || ""),
      );
      return NextResponse.redirect(target);
    }
  }

  // /admin/* HR 守卫
  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (pathname === "/admin/login" || pathname.startsWith("/admin/login/")) {
      return NextResponse.next();
    }
    const token = req.cookies.get(HR_COOKIE)?.value;
    if (await isHrAuthed(token)) {
      return NextResponse.next();
    }
    const target = req.nextUrl.clone();
    target.pathname = "/admin/login";
    target.search = "";
    return NextResponse.redirect(target);
  }

  return NextResponse.next();
}

export const config = {
  // 跑在所有路径上，但排除 Next 静态资源（favicon 在 fn 内也 guard 了一次）
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
