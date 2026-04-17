"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // 让 dev / prod 都能在 console 看到原始报错，便于排查
    console.error("[root-error]", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600">
          <AlertTriangle className="h-7 w-7" />
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">页面加载出错</h1>
        <p className="mt-2 text-sm text-slate-500">
          发生了意料之外的错误，已记录到后台。你可以重试，或回到首页。
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-slate-400">
            trace id: {error.digest}
          </p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button onClick={reset}>重试</Button>
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
