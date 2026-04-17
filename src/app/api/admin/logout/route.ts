// POST /api/admin/logout — 清 HR cookie
import { NextResponse } from "next/server";
import { logoutHr } from "@/lib/auth/hr";

export const runtime = "nodejs";

export async function POST() {
  logoutHr();
  return NextResponse.json({ ok: true });
}
