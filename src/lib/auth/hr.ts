// ============================================================
// HR Auth — 单一共享密码
// ============================================================
// 流程：
//   1. POST /api/admin/login { password }
//   2. 后端比对 process.env.HR_ACCESS_PASSWORD
//   3. 通过 → signSession({ role: "hr", sub: "hr-shared" }) → set HR_COOKIE
//   4. middleware 守卫 /admin/* — 缺 cookie 或 verify 失败 → 跳 /admin/login
// ============================================================

import { cookies } from "next/headers";
import {
  HR_COOKIE,
  COOKIE_OPTIONS,
  signSession,
  verifySession,
} from "./jwt";

export async function loginHr(password: string): Promise<boolean> {
  const expected = process.env.HR_ACCESS_PASSWORD;
  if (!expected) {
    throw new Error("HR_ACCESS_PASSWORD env not set");
  }
  if (password !== expected) return false;

  const token = await signSession({ role: "hr", sub: "hr-shared" });
  cookies().set(HR_COOKIE, token, COOKIE_OPTIONS);
  return true;
}

export function logoutHr() {
  cookies().delete(HR_COOKIE);
}

/** Server-side helper. Returns true if request has a valid HR session. */
export async function isHrAuthenticated(): Promise<boolean> {
  const token = cookies().get(HR_COOKIE)?.value;
  if (!token) return false;
  const payload = await verifySession(token);
  return payload?.role === "hr";
}
