"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Undo2 } from "lucide-react";
import { toast } from "@/components/ui/toast";
import { apiJson } from "@/lib/api";

interface Props {
  applicationId: string;
  variant?: "ghost" | "text";
}

export function WithdrawButton({ applicationId, variant = "ghost" }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function doWithdraw() {
    setLoading(true);
    try {
      await apiJson(`/api/applications/${applicationId}`, {
        method: "DELETE",
      });
      toast.success("已撤回投递");
      setConfirming(false);
      router.refresh();
    } catch {
      /* apiJson 内部已 toast */
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <span className="inline-flex items-center gap-2 text-xs">
        <span className="text-slate-600">确认撤回？</span>
        <button
          type="button"
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            void doWithdraw();
          }}
          className="font-medium text-rose-600 hover:underline disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "确认"
          )}
        </button>
        <button
          type="button"
          disabled={loading}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirming(false);
          }}
          className="text-slate-500 hover:underline"
        >
          取消
        </button>
      </span>
    );
  }

  const base =
    variant === "text"
      ? "text-xs font-medium text-slate-500 hover:text-rose-600 hover:underline"
      : "inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600";

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setConfirming(true);
      }}
      className={base}
    >
      <Undo2 className="h-3 w-3" />
      撤回
    </button>
  );
}
