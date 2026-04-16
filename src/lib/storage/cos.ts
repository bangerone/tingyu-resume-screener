// ============================================================
// 腾讯云 COS — 简历文件存储
// ============================================================
// 设计原则：
//   - 候选人前端通过 STS 临时密钥直传 COS（不经过我们 server，省带宽 + 不撞 EdgeOne body limit）
//   - server 拿到 file_key 后，用 SDK download 到 buffer 做解析/评分
//   - HR 详情页用 signed URL（getObjectUrl, 5 分钟过期）预览原件
// ============================================================
//
// TODO[D1+]:
//   1. 实现 getStsForCandidate(candidateId) — 返回前端用的临时凭证（仅允许写 resumes/<candidateId>/* 路径）
//   2. 实现 downloadResume(fileKey) — server-side 下载到 Buffer
//   3. 实现 getSignedReadUrl(fileKey) — 给 HR 预览
// ============================================================

import COS from "cos-nodejs-sdk-v5";

let _cos: COS | null = null;

export function getCos(): COS {
  if (_cos) return _cos;
  const SecretId = process.env.COS_SECRET_ID;
  const SecretKey = process.env.COS_SECRET_KEY;
  if (!SecretId || !SecretKey) {
    throw new Error("COS_SECRET_ID / COS_SECRET_KEY env not set");
  }
  _cos = new COS({ SecretId, SecretKey });
  return _cos;
}

export const COS_BUCKET = () => process.env.COS_BUCKET!;
export const COS_REGION = () => process.env.COS_REGION ?? "ap-guangzhou";

/** Build the object key for a candidate's resume upload. */
export function buildResumeKey(candidateId: string, originalName: string) {
  const ext = originalName.split(".").pop()?.toLowerCase() ?? "bin";
  const ts = Date.now();
  return `resumes/${candidateId}/${ts}.${ext}`;
}

/** Download the file as Buffer for parsing on server. */
export async function downloadResume(fileKey: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    getCos().getObject(
      {
        Bucket: COS_BUCKET(),
        Region: COS_REGION(),
        Key: fileKey,
      },
      (err, data) => {
        if (err) reject(err);
        else resolve(data.Body as Buffer);
      },
    );
  });
}

/** Generate a signed read URL (default 5 min) for HR preview. */
export function getSignedReadUrl(fileKey: string, expiresSec = 300): string {
  return getCos().getObjectUrl({
    Bucket: COS_BUCKET(),
    Region: COS_REGION(),
    Key: fileKey,
    Sign: true,
    Expires: expiresSec,
  } as any);
}
