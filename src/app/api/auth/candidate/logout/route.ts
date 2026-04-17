// POST /api/auth/candidate/logout — 清候选人 cookie
import { NextResponse } from "next/server";
import { logoutCandidate } from "@/lib/auth/candidate";

export const runtime = "nodejs";

export async function POST() {
  logoutCandidate();
  return NextResponse.json({ ok: true });
}
