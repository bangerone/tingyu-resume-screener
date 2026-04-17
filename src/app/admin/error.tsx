"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin-error]", error);
  }, [error]);

  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100 text-rose-600">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="mt-3 text-base font-semibold text-slate-900">
        工作台加载出错
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        可能是数据库暂时断开或数据异常。请重试，如持续失败请联系管理员。
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-slate-400">
          trace id: {error.digest}
        </p>
      )}
      <div className="mt-5 flex items-center justify-center gap-3">
        <Button onClick={reset}>重试</Button>
        <Link href="/admin">
          <Button variant="outline">回到工作台</Button>
        </Link>
      </div>
    </div>
  );
}
