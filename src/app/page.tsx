import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { JobCard } from "@/features/jobs";
import { CandidateNav } from "@/features/layout/candidate-nav";
import { EmptyState } from "@/components/ui/empty-state";

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
          <span>© 2026 庭宇科技</span>
          <Link href="/admin/login" className="hover:text-slate-700">
            企业登录
          </Link>
        </div>
      </footer>
    </div>
  );
}
