import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Briefcase, Sparkles, FileCheck2, Zap } from "lucide-react";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { JobCard } from "@/features/jobs";
import { CandidateNav } from "@/features/layout/candidate-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { LogoMark } from "@/components/brand/logo";

export const dynamic = "force-dynamic";

// 招聘门户首页（公开）
// 拉真实 open 岗位做 teaser，最多展示 6 条。
// HR 入口只在 footer 的「企业登录」小字。

export default async function HomePage() {
  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt))
    .limit(6);

  return (
    <div className="min-h-screen">
      <CandidateNav />

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-[420px] bg-gradient-to-br from-brand-50 via-white to-sky-50"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/70 px-3 py-1 text-xs font-medium text-brand-700 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            AI 自动解析简历 · 一键投递
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            在庭宇科技，跟优秀的人
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
              className="rounded-lg bg-brand-600 px-6 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-brand-700"
            >
              查看所有岗位 →
            </Link>
            <Link
              href="/my-applications"
              className="rounded-lg border border-slate-200 bg-white px-6 py-3 text-sm font-medium text-slate-700 transition hover:border-brand-200 hover:text-brand-700"
            >
              我的投递
            </Link>
          </div>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
            <FeatureTile
              icon={<FileCheck2 className="h-5 w-5" />}
              title="AI 自动填表"
              desc="上传 PDF / Word 简历，自动提取姓名、经历、技能。"
            />
            <FeatureTile
              icon={<Zap className="h-5 w-5" />}
              title="更快得到反馈"
              desc="后台自动评估匹配度，高分候选人会被优先联系。"
            />
            <FeatureTile
              icon={<Sparkles className="h-5 w-5" />}
              title="也可以手动填"
              desc="没有简历文件？直接在页面上填写，同样能投递。"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <h2 className="mb-6 text-xl font-semibold">热招岗位</h2>
        {rows.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="暂无在招岗位"
            description="我们正在整理新一轮招聘需求，敬请期待。"
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <LogoMark size={18} />
            <span>© 2026 庭宇科技</span>
          </div>
          <Link href="/admin/login" className="hover:text-slate-700">
            企业登录
          </Link>
        </div>
      </footer>
    </div>
  );
}

function FeatureTile({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
        {icon}
      </div>
      <div className="mt-3 text-sm font-semibold text-slate-900">{title}</div>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
    </div>
  );
}
