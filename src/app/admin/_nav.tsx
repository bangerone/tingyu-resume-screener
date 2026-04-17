"use client";

// 单独拎出来是因为要用 usePathname 区分登录页（不渲染 nav）+ 高亮当前 tab
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const tabs = [
  { href: "/admin", label: "工作台", match: (p: string) => p === "/admin" },
  {
    href: "/admin/jobs",
    label: "岗位管理",
    match: (p: string) => p.startsWith("/admin/jobs"),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin/login")) return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link href="/admin" className="text-sm font-semibold text-slate-900">
            庭宇 · HR 工作台
          </Link>
          <nav className="flex items-center gap-1">
            {tabs.map((t) => {
              const active = t.match(pathname ?? "");
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-100",
                  )}
                >
                  {t.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <form action="/api/admin/logout" method="post">
          <Button variant="outline" size="sm" type="submit">
            退出
          </Button>
        </form>
      </div>
    </header>
  );
}
