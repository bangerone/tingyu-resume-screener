"use client";

// ============================================================
// 公共候选人顶部 nav
// - logo 左
// - 右：在招岗位 / 我的投递（登录后）/ 登出（登录后）/ 邮箱前缀（登录后）
// ============================================================

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Toaster } from "@/components/ui/toast";
import { candidateLogout, useCandidateSession } from "@/features/auth";

export function CandidateNav() {
  const router = useRouter();
  const { user, loading, refresh } = useCandidateSession();

  async function onLogout() {
    await candidateLogout();
    await refresh();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            庭宇 <span className="text-brand-600">Careers</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
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
                <span className="hidden text-xs text-slate-400 sm:inline">
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
            ) : null}
          </div>
        </div>
      </nav>
      <Toaster />
    </>
  );
}
