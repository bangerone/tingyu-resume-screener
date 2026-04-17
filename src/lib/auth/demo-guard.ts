// ============================================================
// demo-guard — D6.5 演示加固
// ============================================================
// 当 env DEMO_READONLY_HR === "true" 时：
//   - HR 写入型 API 入口调 assertHrWritable()，命中返回 403
//   - HR UI 顶部展示「演示模式 · 只读」banner（直接调 isReadOnlyHr）
//
// env 未设置或非 "true" → 全部跳过（本地 dev 无感）。
// ============================================================

import { NextResponse } from "next/server";

export function isReadOnlyHr(): boolean {
  return process.env.DEMO_READONLY_HR === "true";
}

/** 在 HR 写入型 route 入口调用；命中则返回 403 Response，调用方直接 return。 */
export function readOnlyHrResponse(): NextResponse {
  return NextResponse.json(
    { error: "演示模式：只读访问" },
    { status: 403 },
  );
}
