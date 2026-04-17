// ============================================================
// POST /api/dev/test-scorer  (dev-only)
// ------------------------------------------------------------
// 输入：{ fixture: "strong" | "hard-fail" | "partial", jobId: string }
// 输出：ScoreResult（不落库）
// 用于 D4 验收：喂 fixture 给 scorer，检查产出区间
//
// 仅在 NODE_ENV !== "production" 时可用。
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { scoreResume } from "@/lib/ai/scorer";
import type { ParsedResume } from "@/types";

import fxStrong from "@/lib/ai/__fixtures__/parsed-strong.json";
import fxHardFail from "@/lib/ai/__fixtures__/parsed-hard-fail.json";
import fxPartial from "@/lib/ai/__fixtures__/parsed-partial.json";

export const runtime = "nodejs";
export const maxDuration = 90;

const FIXTURES: Record<string, ParsedResume> = {
  strong: fxStrong as ParsedResume,
  "hard-fail": fxHardFail as ParsedResume,
  partial: fxPartial as ParsedResume,
};

const BodySchema = z.object({
  fixture: z.enum(["strong", "hard-fail", "partial"]),
  jobId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled in production" }, { status: 403 });
  }

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

  const { fixture, jobId } = parsed.data;
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job) {
    return NextResponse.json({ error: "job not found" }, { status: 404 });
  }

  const parsedResume = FIXTURES[fixture];
  const score = await scoreResume(parsedResume, job);
  return NextResponse.json({ fixture, jobId, score });
}
