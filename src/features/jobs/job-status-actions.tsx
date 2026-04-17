"use client";

// ============================================================
// JobStatusActions —— 列表页每行的一键操作
// ============================================================
// - 在招 ↔ 下架（PATCH status）
// - 发布（draft → open）
// - 删除（二次确认 window.confirm）
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { apiJson } from "@/lib/api";
import { toast } from "@/components/ui/toast";
import type { JobStatus } from "@/types";

interface Props {
  jobId: string;
  status: JobStatus;
}

export function JobStatusActions({ jobId, status }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "toggle" | "delete">(null);

  async function patchStatus(next: JobStatus, successMsg: string) {
    setBusy("toggle");
    try {
      await apiJson(`/api/jobs/${jobId}`, {
        method: "PATCH",
        body: { status: next },
      });
      toast.success(successMsg);
      startTransition(() => router.refresh());
    } catch {
      // toast handled
    } finally {
      setBusy(null);
    }
  }

  async function onDelete() {
    if (!window.confirm("确认删除该岗位？此操作不可恢复。")) return;
    setBusy("delete");
    try {
      await apiJson(`/api/jobs/${jobId}`, { method: "DELETE" });
      toast.success("已删除");
      startTransition(() => router.refresh());
    } catch {
      // toast handled
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      {status === "draft" && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => patchStatus("open", "已发布")}
        >
          发布
        </Button>
      )}
      {status === "open" && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => patchStatus("closed", "已下架")}
        >
          下架
        </Button>
      )}
      {status === "closed" && (
        <Button
          size="sm"
          variant="outline"
          disabled={busy !== null}
          onClick={() => patchStatus("open", "已重新发布")}
        >
          重新发布
        </Button>
      )}
      <Button
        size="sm"
        variant="ghost"
        disabled={busy !== null}
        onClick={onDelete}
        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      >
        删除
      </Button>
    </div>
  );
}
