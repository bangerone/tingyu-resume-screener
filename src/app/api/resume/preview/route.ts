// ============================================================
// GET /api/resume/preview?key=resumes/<id>/<file>
// ------------------------------------------------------------
// HR 预览简历原件：从 COS 读出字节流，强制 Content-Disposition: inline
// 转发给 iframe/object。避开 COS 的 response-content-disposition 覆盖
// 在某些浏览器 + Chrome "Download PDFs" 设置下不稳定的坑。
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import { isHrAuthenticated } from "@/lib/auth/hr";
import { downloadResume } from "@/lib/storage/cos";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MIME: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  doc: "application/msword",
};

export async function GET(req: NextRequest) {
  if (!(await isHrAuthenticated())) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }
  const key = req.nextUrl.searchParams.get("key");
  if (!key || !key.startsWith("resumes/")) {
    return NextResponse.json({ error: "缺少或非法的 key" }, { status: 400 });
  }
  try {
    const buf = await downloadResume(key);
    const ext = key.split(".").pop()?.toLowerCase() ?? "";
    const mime = MIME[ext] ?? "application/octet-stream";
    // Blob 是最兼容的 BodyInit —— 既不踩 Buffer/Uint8Array 在 NextResponse 类型里的坑，
    // 也能直接设 MIME（不过 header 另外再设一遍）。
    const body = new Blob([buf], { type: mime });
    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": mime,
        "content-disposition": "inline",
        "cache-control": "private, max-age=60",
      },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
