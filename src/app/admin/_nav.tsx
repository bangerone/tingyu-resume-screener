"use client";

// 单独拎出来是因为要用 usePathname 区分登录页（不渲染 nav）+ 高亮当前 tab
// D6：加移动端汉堡折叠。
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand/logo";

const tabs = [
  { href: "/admin", label: "工作台", match: (p: string) => p === "/admin" },
  {
    href: "/admin/jobs",
    label: "岗位管理",
    match: (p: string) => p.startsWith("/admin/jobs"),
  },
  {
    href: "/admin/applications",
    label: "候选人池",
    match: (p: string) => p.startsWith("/admin/applications"),
  },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname?.startsWith("/admin/login")) return null;

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/admin"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <LogoMark size={24} />
            <span className="text-sm font-semibold text-slate-900">
              庭宇科技
            </span>
            <span className="hidden text-xs text-slate-400 md:inline">
              · HR 工作台
            </span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
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

        <div className="flex items-center gap-2">
          <form action="/api/admin/logout" method="post" className="hidden md:block">
            <Button variant="outline" size="sm" type="submit">
              退出
            </Button>
          </form>
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
            onClick={() => setOpen((x) => !x)}
            aria-label="切换菜单"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* 移动端折叠面板 */}
      <div
        className={cn(
          "overflow-hidden border-t border-slate-100 bg-white transition-[max-height] duration-200 ease-out md:hidden",
          open ? "max-h-72" : "max-h-0",
        )}
      >
        <div className="space-y-1 px-4 py-3 text-sm">
          {tabs.map((t) => {
            const active = t.match(pathname ?? "");
            return (
              <Link
                key={t.href}
                href={t.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "block rounded-md px-3 py-2",
                  active
                    ? "bg-brand-50 text-brand-700"
                    : "text-slate-700 hover:bg-slate-50",
                )}
              >
                {t.label}
              </Link>
            );
          })}
          <form action="/api/admin/logout" method="post" className="pt-1">
            <button
              type="submit"
              className="w-full rounded-md px-3 py-2 text-left text-slate-500 hover:bg-slate-50"
            >
              退出
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
