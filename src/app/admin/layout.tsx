// ============================================================
// admin/layout.tsx —— HR 工作台通用外壳
// ============================================================
// 顶部 nav（Logo · 工作台 · 岗位管理 · 退出）+ 主内容区 + Toaster
// /admin/login 通过 pathname 判断跳过 nav。
// ============================================================

import Link from "next/link";
import { Toaster } from "@/components/ui/toast";
import { AdminNav } from "./_nav";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <AdminNav />
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
      <Toaster />
      <footer className="mx-auto max-w-6xl px-6 pb-8 pt-4 text-xs text-slate-400">
        <Link href="/" className="hover:text-slate-600">
          ← 返回候选人门户
        </Link>
      </footer>
    </div>
  );
}
