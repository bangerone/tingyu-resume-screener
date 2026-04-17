// ============================================================
// 简历文本抽取
// ------------------------------------------------------------
// PDF  → pdf-parse
// docx → mammoth.extractRawText
// 其他 → throw Unsupported
//
// 纯 server 模块，不要在 client 里引用。
// ============================================================

import mammoth from "mammoth";

export type ResumeMime =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/msword"
  | string;

export class UnsupportedResumeFormatError extends Error {
  constructor(mime: string) {
    super(`不支持的简历格式: ${mime}（仅支持 PDF / DOCX）`);
    this.name = "UnsupportedResumeFormatError";
  }
}

export class EmptyResumeTextError extends Error {
  constructor() {
    super("简历内容为空或无法抽取文本");
    this.name = "EmptyResumeTextError";
  }
}

function detectKindByKey(fileKey: string): "pdf" | "docx" | "unknown" {
  const ext = fileKey.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "pdf") return "pdf";
  if (ext === "docx") return "docx";
  return "unknown";
}

function detectKindByMime(mime: string): "pdf" | "docx" | "unknown" {
  if (mime === "application/pdf") return "pdf";
  if (
    mime ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword"
  ) {
    return "docx";
  }
  return "unknown";
}

/**
 * 从二进制内容抽取纯文本。
 * `hint` 可以是 MIME 或 fileKey（用扩展名兜底判别）。
 */
export async function extractTextFromBuffer(
  buf: Buffer,
  hint: string,
): Promise<string> {
  let kind = detectKindByMime(hint);
  if (kind === "unknown") kind = detectKindByKey(hint);

  if (kind === "pdf") {
    // pdf-parse 的默认 index.js 会在 import 时运行 demo（读本地文件），
    // 所以这里直接引用 lib 子模块避免副作用。
    const pdfParse = (await import("pdf-parse/lib/pdf-parse.js"))
      .default as (input: Buffer) => Promise<{ text: string }>;
    const result = await pdfParse(buf);
    const text = (result.text ?? "").trim();
    if (!text) throw new EmptyResumeTextError();
    return text;
  }

  if (kind === "docx") {
    const result = await mammoth.extractRawText({ buffer: buf });
    const text = (result.value ?? "").trim();
    if (!text) throw new EmptyResumeTextError();
    return text;
  }

  throw new UnsupportedResumeFormatError(hint);
}

/** LLM 输入前的截断（prompt-engineering.md §Call #1 = 12000 字符）。 */
export function truncateForPrompt(text: string, max = 12000): string {
  if (text.length <= max) return text;
  return text.slice(0, max);
}
