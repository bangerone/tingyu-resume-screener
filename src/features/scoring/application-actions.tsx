"use client";

// ============================================================
// ApplicationActions —— 详情页「重新评分 / 推送飞书 / 拒绝」
// ============================================================

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { apiJson } from "@/lib/api";
import type { ApplicationStatus } from "@/types";

interface Props {
  applicationId: string;
  status: ApplicationStatus;
  hasScore: boolean;
}

export function ApplicationActions({ applicationId, status, hasScore }: Props) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [busy, setBusy] = useState<null | "score" | "push" | "reject">(null);

  async function rescore() {
    setBusy("score");
    try {
      await apiJson(`/api/score/${applicationId}`, { method: "POST" });
      toast.success("评分完成");
      startTransition(() => router.refresh());
    } catch {
      // apiJson 内部已经 toast
    } finally {
      setBusy(null);
    }
  }

  async function pushFeishu() {
    setBusy("push");
    try {
      const res = await apiJson<{ ok: boolean; msg: string }>(
        "/api/feishu/test",
        {
          method: "POST",
          body: { application_id: applicationId },
          showErrorToast: false,
        },
      );
      if (res.ok) {
        toast.success("已推送到飞书");
        startTransition(() => router.refresh());
      } else {
        toast.error(`推送失败：${res.msg}`);
        startTransition(() => router.refresh()); // 刷新看 feishu_logs
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "推送失败";
      toast.error(msg);
    } finally {
      setBusy(null);
    }
  }

  async function reject() {
    if (!window.confirm("确认将该候选人标记为失败（拒绝）？")) return;
    setBusy("reject");
    try {
      await apiJson(`/api/applications/${applicationId}`, {
        method: "PATCH",
        body: { status: "failed" },
      });
      toast.success("已拒绝");
      startTransition(() => router.refresh());
    } catch {
      // toast handled
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        disabled={busy !== null}
        onClick={rescore}
      >
        {busy === "score" ? "评分中…" : "重新评分"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={busy !== null || !hasScore}
        onClick={pushFeishu}
        title={hasScore ? "" : "需先完成评分"}
      >
        {busy === "push" ? "推送中…" : status === "pushed" ? "重新推送飞书" : "推送飞书"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={busy !== null || status === "failed"}
        onClick={reject}
        className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
      >
        {busy === "reject" ? "处理中…" : "拒绝"}
      </Button>
    </div>
  );
}
