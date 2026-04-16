// ============================================================
// Candidate Auth — 邮箱验证码 + JWT
// ============================================================
// 流程：
//   1. POST /api/auth/candidate/request-code  { email }
//      → 生成 6 位验证码、hash 存 email_codes、5 分钟过期
//      → 调 lib/email/send.ts 发邮件（dev 控制台打印）
//   2. POST /api/auth/candidate/verify-code   { email, code }
//      → 取最新未消费 + 未过期的 code，比对 hash
//      → 通过 → 创建/复用 candidate row → signSession → set CANDIDATE_COOKIE
//   3. server-side 工具：getCandidateSession() 读 cookie 返回 user
// ============================================================

import { cookies } from "next/headers";
import { createHash, randomInt, randomUUID } from "crypto";
import { and, desc, eq, gt } from "drizzle-orm";
import {
  CANDIDATE_COOKIE,
  COOKIE_OPTIONS,
  signSession,
  verifySession,
  type SessionPayload,
} from "./jwt";
import { db } from "@/lib/db/client";
import { candidates, emailCodes } from "@/lib/db/schema";

const CODE_TTL_MS = 5 * 60 * 1000;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

/** Generate a 6-digit numeric code as string. */
export function generateCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

/** Store a code (hashed) and return the plaintext code for sending. */
export async function issueEmailCode(email: string): Promise<string> {
  const code = generateCode();
  await db.insert(emailCodes).values({
    id: randomUUID(),
    email: email.toLowerCase().trim(),
    codeHash: hashCode(code),
    expiresAt: new Date(Date.now() + CODE_TTL_MS),
  });
  return code;
}

/** Returns true if (email, code) matched a non-consumed, non-expired row. */
export async function consumeEmailCode(
  email: string,
  code: string,
): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const rows = await db
    .select()
    .from(emailCodes)
    .where(
      and(
        eq(emailCodes.email, normalized),
        eq(emailCodes.consumed, false),
        gt(emailCodes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(emailCodes.createdAt))
    .limit(1);
  const row = rows[0];
  if (!row) return false;
  if (row.codeHash !== hashCode(code)) return false;

  await db
    .update(emailCodes)
    .set({ consumed: true })
    .where(eq(emailCodes.id, row.id));
  return true;
}

/** Get-or-create a candidate row, then issue session cookie. */
export async function loginCandidateByEmail(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim();
  const existing = await db
    .select()
    .from(candidates)
    .where(eq(candidates.email, normalized))
    .limit(1);

  let candidateId: string;
  if (existing[0]) {
    candidateId = existing[0].id;
  } else {
    candidateId = randomUUID();
    await db.insert(candidates).values({
      id: candidateId,
      email: normalized,
    });
  }

  const token = await signSession({
    role: "candidate",
    sub: candidateId,
    email: normalized,
  });
  cookies().set(CANDIDATE_COOKIE, token, COOKIE_OPTIONS);
}

export function logoutCandidate() {
  cookies().delete(CANDIDATE_COOKIE);
}

/** Server-side helper for RSC / route handlers. */
export async function getCandidateSession(): Promise<SessionPayload | null> {
  const token = cookies().get(CANDIDATE_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySession(token);
  return payload?.role === "candidate" ? payload : null;
}
