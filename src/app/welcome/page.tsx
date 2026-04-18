// ============================================================
// /welcome —— D6.5 演示访问码门禁落地页
// ============================================================
// 流程：
//   · 用户带 ?k=<code>&next=<path> 进入 → middleware 若 k 命中 env，
//     种 cookie 并 302 到 next（本组件不会被渲染）
//   · 若 k 错/缺失 → middleware 放行，渲染本组件：
//       - k 存在 → 提示访问码错误
//       - k 缺失 → 提示「请使用面试官链接」+ 手工输入表单
//   · 表单用 <form method="get" action="/welcome">，提交后 middleware 再判定
// ============================================================

import Link from "next/link";

export const runtime = "nodejs";

type Props = {
  searchParams: { k?: string | string[]; next?: string | string[] };
};

function str(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default function WelcomePage({ searchParams }: Props) {
  const attemptedCode = str(searchParams.k);
  const nextPath = str(searchParams.next) || "/";
  const attemptedWrong = attemptedCode.length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-semibold text-white">
            庭
          </div>
          <div>
            <div className="text-sm font-semibold text-slate-900">
              庭宇 · 智能简历筛选
            </div>
            <div className="text-xs text-slate-500">演示环境</div>
          </div>
        </div>

        <h1 className="text-lg font-semibold text-slate-900">
          请输入访问码进入演示环境
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-500">
          这是一个面试作业的在线 demo。为避免数据污染与资源滥用，访问需要一个短期访问码。
        </p>

        {attemptedWrong && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            访问码不正确，请核对后重试。
          </div>
        )}

        <form method="get" action="/welcome" className="mt-5 space-y-3">
          <input type="hidden" name="next" value={nextPath} />
          <label className="block">
            <span className="text-xs text-slate-500">访问码</span>
            <input
              type="text"
              name="k"
              autoFocus
              autoComplete="off"
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              placeholder="请输入"
            />
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            进入
          </button>
        </form>

        <p className="mt-6 text-xs text-slate-400">
          由 Claude Code + Next.js 搭建 ·{" "}
          <Link
            href="https://github.com/"
            className="underline-offset-2 hover:underline"
          >
            了解更多
          </Link>
        </p>
      </div>
    </div>
  );
}
