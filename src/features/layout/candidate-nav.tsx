"use client";

// ============================================================
// 公共候选人顶部 nav
// - logo 左
// - 桌面：横排链接 + 登录态信息
// - 移动端：汉堡菜单折叠链接与登出
// ============================================================

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Toaster } from "@/components/ui/toast";
import { candidateLogout, useCandidateSession } from "@/features/auth";
import { BrandLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

export function CandidateNav() {
  const router = useRouter();
  const { user, loading, refresh } = useCandidateSession();
  const [open, setOpen] = useState(false);

  async function onLogout() {
    await candidateLogout();
    await refresh();
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="flex items-center gap-2"
            onClick={() => setOpen(false)}
          >
            <BrandLogo
              size={28}
              textClassName="text-base font-semibold text-slate-900"
            />
            <span className="hidden text-sm font-medium text-brand-600 sm:inline">
              Careers
            </span>
          </Link>

          {/* 桌面菜单 */}
          <div className="hidden items-center gap-4 text-sm sm:flex">
            <Link href="/jobs" className="text-slate-600 hover:text-slate-900">
              在招岗位
            </Link>
            {user && (
              <Link
                href="/my-applications"
                className="text-slate-600 hover:text-slate-900"
              >
                我的投递
              </Link>
            )}
            {loading ? null : user ? (
              <>
                <span className="hidden text-xs text-slate-400 md:inline">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs text-slate-500 hover:text-slate-900"
                >
                  退出
                </button>
              </>
            ) : (
              <Link
                href="/my-applications"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-brand-700"
              >
                登录
              </Link>
            )}
          </div>

          {/* 移动端汉堡 */}
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 sm:hidden"
            onClick={() => setOpen((x) => !x)}
            aria-label="切换菜单"
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* 移动端折叠面板 */}
        <div
          className={cn(
            "overflow-hidden border-t border-slate-100 bg-white transition-[max-height] duration-200 ease-out sm:hidden",
            open ? "max-h-72" : "max-h-0",
          )}
        >
          <div className="space-y-1 px-4 py-3 text-sm">
            <Link
              href="/jobs"
              className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
              onClick={() => setOpen(false)}
            >
              在招岗位
            </Link>
            {user && (
              <Link
                href="/my-applications"
                className="block rounded-md px-3 py-2 text-slate-700 hover:bg-slate-50"
                onClick={() => setOpen(false)}
              >
                我的投递
              </Link>
            )}
            {user ? (
              <div className="mt-2 flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
                <span className="truncate text-xs text-slate-500">
                  {user.email}
                </span>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-medium text-slate-700 hover:text-slate-900"
                >
                  退出
                </button>
              </div>
            ) : (
              <Link
                href="/my-applications"
                onClick={() => setOpen(false)}
                className="mt-1 block rounded-md bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white"
              >
                登录
              </Link>
            )}
          </div>
        </div>
      </nav>
      <Toaster />
    </>
  );
}
