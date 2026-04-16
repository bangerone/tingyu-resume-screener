import Link from "next/link";

// 招聘门户首页（D0 占位）
// D3 会把「在招岗位」section 替换为从 Supabase 拉取真实 jobs。
// HR 入口刻意不在首页展示 —— HR 通过 /admin/login 直接访问。

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Top nav */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="text-lg font-bold tracking-tight">
            庭宇 <span className="text-brand-600">Careers</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/jobs"
              className="text-slate-600 hover:text-slate-900"
            >
              在招岗位
            </Link>
            <Link
              href="/my-applications"
              className="text-slate-600 hover:text-slate-900"
            >
              我的投递
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          在庭宇，跟优秀的人
          <br className="sm:hidden" />
          一起做有价值的产品
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          我们正在招聘下面这些岗位。投递简历后，AI
          会自动解析并帮你完成申请表，你只需检查确认即可。
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/jobs"
            className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            查看所有岗位 →
          </Link>
        </div>
      </section>

      {/* Open positions teaser (D3 will replace this with real data) */}
      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-xl font-semibold">热招岗位</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Placeholder cards — D3 will fetch from Supabase */}
          {[
            { t: "前端工程师", d: "技术部 · 杭州" },
            { t: "产品经理", d: "产品部 · 北京" },
            { t: "后端工程师", d: "技术部 · 远程" },
          ].map((j) => (
            <div
              key={j.t}
              className="rounded-xl border border-slate-200 bg-white p-6 opacity-60"
            >
              <div className="text-xs font-medium uppercase text-brand-600">
                即将开放
              </div>
              <div className="mt-2 text-lg font-semibold">{j.t}</div>
              <div className="mt-1 text-sm text-slate-500">{j.d}</div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-slate-400">
          D3 任务将在此处渲染真实岗位列表
        </p>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-slate-500">
          <span>© 2026 庭宇科技</span>
          {/* HR 入口：藏在 footer，只有知道的人能看到 */}
          <Link href="/admin/login" className="hover:text-slate-700">
            企业登录
          </Link>
        </div>
      </footer>
    </div>
  );
}
