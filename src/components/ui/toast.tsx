"use client";

// ============================================================
// 极简 toast — pub/sub + 挂载式 Toaster，不上依赖
// 使用：
//   import { toast, Toaster } from "@/components/ui/toast";
//   toast.error("出错了");      // 从任意 client 代码调用
//   toast.success("已保存");
//   <Toaster />                 // 在 admin/layout.tsx 挂一次
// ============================================================

import * as React from "react";
import { cn } from "@/lib/utils";

type ToastKind = "info" | "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

type Listener = (items: ToastItem[]) => void;

const listeners = new Set<Listener>();
let items: ToastItem[] = [];
let uid = 0;

function emit() {
  for (const l of listeners) l(items);
}

function push(kind: ToastKind, message: string) {
  const id = ++uid;
  items = [...items, { id, kind, message }];
  emit();
  setTimeout(() => {
    items = items.filter((x) => x.id !== id);
    emit();
  }, 3200);
}

export const toast = {
  info: (msg: string) => push("info", msg),
  success: (msg: string) => push("success", msg),
  error: (msg: string) => push("error", msg),
};

export function Toaster() {
  const [list, setList] = React.useState<ToastItem[]>([]);
  React.useEffect(() => {
    const l: Listener = (x) => setList(x);
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col gap-2">
      {list.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto min-w-[240px] max-w-sm rounded-lg border px-4 py-3 text-sm shadow-md",
            t.kind === "error" &&
              "border-rose-200 bg-rose-50 text-rose-900",
            t.kind === "success" &&
              "border-emerald-200 bg-emerald-50 text-emerald-900",
            t.kind === "info" && "border-slate-200 bg-white text-slate-900",
          )}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
