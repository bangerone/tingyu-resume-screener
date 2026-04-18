import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db/client";
import { jobs, type Job } from "@/lib/db/schema";
import { JobCard } from "@/features/jobs";
import { CandidateNav } from "@/features/layout/candidate-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { LogoMark } from "@/components/brand/logo";

const BRAND_SITE = process.env.NEXT_PUBLIC_BRAND_SITE ?? "https://tingyu.tech";

export const dynamic = "force-dynamic";

// 招聘门户首页（公开）
// 拉真实 open 岗位做 teaser，最多展示 6 条。
// HR 入口只在 footer 的「企业登录」小字。

export default async function HomePage() {
  const all = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt));
  const social = all.filter((j) => j.hiringType !== "campus").slice(0, 6);
  const campus = all.filter((j) => j.hiringType === "campus").slice(0, 6);

  return (
    <div className="min-h-screen">
      <CandidateNav />

      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-[420px] bg-gradient-to-br from-brand-50 via-white to-sky-50"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            在庭宇科技，跟优秀的人
            <br className="sm:hidden" />
            一起做有价值的产品
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            我们正在招聘下面这些岗位，期待与你共创。
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
        </div>
      </section>

      <section className="mx-auto max-w-6xl space-y-14 px-6 pb-20">
        <JobGroup
          title="社招岗位"
          subtitle="面向有工作经验的候选人"
          rows={social}
          tab="social"
        />
        <JobGroup
          title="校招岗位"
          subtitle="面向应届毕业生与实习生"
          rows={campus}
          tab="campus"
        />
        {all.length === 0 && (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="暂无在招岗位"
            description="我们正在整理新一轮招聘需求，敬请期待。"
          />
        )}
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6 text-xs text-slate-500">
          <a
            href={BRAND_SITE}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-2 hover:text-brand-600"
            title="访问庭宇科技官网"
          >
            <LogoMark size={18} />
            <span>© 2026 庭宇科技</span>
            <span className="opacity-0 transition group-hover:opacity-100">
              ↗
            </span>
          </a>
          <Link href="/admin/login" className="hover:text-slate-700">
            企业登录
          </Link>
        </div>
      </footer>
    </div>
  );
}

function JobGroup({
  title,
  subtitle,
  rows,
  tab,
}: {
  title: string;
  subtitle: string;
  rows: Job[];
  tab: "social" | "campus";
}) {
  if (rows.length === 0) return null;
  return (
    <div>
      <div className="mb-5 flex items-end justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <Link
          href={`/jobs?tab=${tab}`}
          className="text-sm font-medium text-brand-600 hover:underline"
        >
          查看全部 →
        </Link>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((j) => (
          <JobCard key={j.id} job={j} />
        ))}
      </div>
    </div>
  );
}
