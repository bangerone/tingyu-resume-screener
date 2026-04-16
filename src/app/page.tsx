import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center gap-8 p-8 text-center">
      <div className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight">
          庭宇 · 智能简历筛选系统
        </h1>
        <p className="text-slate-600">
          AI-powered resume screening · MVP scaffold ready
        </p>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <Link
          href="/jobs"
          className="rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-brand-500 hover:shadow-md"
        >
          <div className="text-sm font-medium text-brand-600">候选人入口</div>
          <div className="mt-1 text-lg font-semibold">浏览岗位 · 投递简历</div>
          <div className="mt-2 text-sm text-slate-500">
            查看在招岗位，上传简历快速申请
          </div>
        </Link>

        <Link
          href="/admin"
          className="rounded-xl border border-slate-200 bg-white p-6 text-left transition hover:border-brand-500 hover:shadow-md"
        >
          <div className="text-sm font-medium text-brand-600">HR 入口</div>
          <div className="mt-1 text-lg font-semibold">岗位管理 · 候选人评分</div>
          <div className="mt-2 text-sm text-slate-500">
            创建岗位、查看 AI 评分排序后的候选人
          </div>
        </Link>
      </div>

      <p className="text-xs text-slate-400">
        Phase D0 · scaffold complete · see <code>docs/tasks/</code> for next
        steps
      </p>
    </main>
  );
}
