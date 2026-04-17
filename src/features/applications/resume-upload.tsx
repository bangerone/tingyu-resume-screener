"use client";

// ============================================================
// ResumeUpload — 点选 / 拖拽上传简历
//   POST /api/resume/upload (FormData) → { fileKey }
// 成功后 onUploaded(fileKey, fileName)
// ============================================================

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface Props {
  onUploaded: (fileKey: string, fileName: string) => void;
}

const MAX_MB = 10;
const ACCEPT = ".pdf,.doc,.docx";

export function ResumeUpload({ onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [fileName, setFileName] = useState<string | null>(null);

  async function handleFile(file: File) {
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`文件超过 ${MAX_MB}MB`);
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["pdf", "doc", "docx"].includes(ext)) {
      toast.error("仅支持 pdf / doc / docx");
      return;
    }

    setFileName(file.name);
    setUploading(true);
    setProgress(8);

    try {
      const fd = new FormData();
      fd.append("file", file);
      // 粗略的"进度"（XHR 才有真正上传 progress；fetch 不直接给，这里只做假进度条做视觉反馈）
      const fakeTimer = setInterval(() => {
        setProgress((p) => Math.min(p + 7, 85));
      }, 250);
      const res = await fetch("/api/resume/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      clearInterval(fakeTimer);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? `上传失败 (${res.status})`);
      }
      setProgress(100);
      const data = (await res.json()) as { fileKey: string; name: string };
      toast.success("简历已上传");
      onUploaded(data.fileKey, data.name ?? file.name);
    } catch (e: any) {
      toast.error(e?.message ?? "上传失败");
      setFileName(null);
      setProgress(0);
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "cursor-pointer rounded-xl border-2 border-dashed bg-white p-10 text-center transition",
          dragOver
            ? "border-brand-500 bg-brand-50/40"
            : "border-slate-300 hover:border-brand-400",
          uploading && "pointer-events-none opacity-70",
        )}
      >
        <div className="text-4xl">📄</div>
        <div className="mt-3 text-base font-medium text-slate-900">
          {fileName ? fileName : "点击或拖拽文件到此处上传"}
        </div>
        <div className="mt-1 text-xs text-slate-500">
          支持 PDF / DOCX，最大 {MAX_MB}MB
        </div>

        {uploading ? (
          <div className="mx-auto mt-4 h-2 w-48 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <Button type="button" variant="outline" className="mt-4" size="sm">
            选择文件
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}
