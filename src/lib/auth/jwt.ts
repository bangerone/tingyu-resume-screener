// ============================================================
// JWT 签发与校验（统一供 HR 和候选人使用）
// ============================================================
// 用 jose 库实现 HS256，cookie 内放 token，httpOnly + sameSite=lax。
// ============================================================

import { SignJWT, jwtVerify } from "jose";

const TTL_SECONDS = Number(process.env.JWT_TTL_SECONDS ?? 60 * 60 * 24 * 7);

function getSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "JWT_SECRET missing or too short (>=32 chars). " +
        'Generate one: `openssl rand -base64 32`',
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionRole = "hr" | "candidate";

export interface SessionPayload {
  /** "hr" | "candidate" */
  role: SessionRole;
  /** for candidate: candidate.id; for hr: a constant "hr-shared" */
  sub: string;
  /** for candidate sessions */
  email?: string;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_SECONDS}s`)
    .setSubject(payload.sub)
    .sign(getSecretKey());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (payload.role !== "hr" && payload.role !== "candidate") return null;
    return {
      role: payload.role as SessionRole,
      sub: payload.sub as string,
      email: payload.email as string | undefined,
    };
  } catch {
    return null;
  }
}

// Cookie 名约定
export const HR_COOKIE = "tingyu_hr";
export const CANDIDATE_COOKIE = "tingyu_session";

export const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: TTL_SECONDS,
};
