// ============================================================
// POST /api/resume/upload
// ------------------------------------------------------------
// 候选人前端 FormData 上传简历 → server 用 COS SDK putObject →
// 返回 { fileKey } 给前端，后续 /api/resume/parse 会用这个 key。
//
// 说明：按 D1 占位的注释，demo 阶段走「server 中转」，不走 STS 直传。
// 如果 COS env 未配置，返回 500（任务卡允许 D3 暂时 mock 为本地路径，
// 但本项目 .env.local 已备好 COS 凭证，保持真上传）。
// ============================================================

import { NextResponse, type NextRequest } from "next/server";
import { getCandidateSession } from "@/lib/auth/candidate";
import {
  buildResumeKey,
  getCos,
  COS_BUCKET,
  COS_REGION,
} from "@/lib/storage/cos";

export const runtime = "nodejs";
export const maxDuration = 30;

const MAX_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXT = ["pdf", "doc", "docx"];

export async function POST(req: NextRequest) {
  const session = await getCandidateSession();
  if (!session) {
    return NextResponse.json({ error: "请先登录" }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "请求体不是合法 multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "缺少 file 字段" }, { status: 400 });
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "文件为空" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "文件超过 10MB" },
      { status: 413 },
    );
  }

  const name = file.name || "resume.pdf";
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_EXT.includes(ext)) {
    return NextResponse.json(
      { error: "仅支持 pdf / doc / docx 格式" },
      { status: 400 },
    );
  }

  const fileKey = buildResumeKey(session.sub, name);
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    await new Promise<void>((resolve, reject) => {
      getCos().putObject(
        {
          Bucket: COS_BUCKET(),
          Region: COS_REGION(),
          Key: fileKey,
          Body: buffer,
          ContentType: file.type || "application/octet-stream",
        },
        (err) => {
          if (err) reject(err);
          else resolve();
        },
      );
    });
  } catch (e: any) {
    // eslint-disable-next-line no-console
    console.error("[resume/upload] COS putObject failed", e);
    return NextResponse.json(
      { error: e?.message ?? "上传到存储失败" },
      { status: 500 },
    );
  }

  return NextResponse.json({
    fileKey,
    size: file.size,
    name,
  });
}
