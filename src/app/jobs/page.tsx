import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { JobCard } from "@/features/jobs";
import { CandidateNav } from "@/features/layout/candidate-nav";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

type Tab = "all" | "social" | "campus";

function pick(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: { [k: string]: string | string[] | undefined };
}) {
  const raw = pick(searchParams.tab) ?? "all";
  const tab: Tab =
    raw === "campus" ? "campus" : raw === "social" ? "social" : "all";

  const all = await db
    .select()
    .from(jobs)
    .where(eq(jobs.status, "open"))
    .orderBy(desc(jobs.createdAt));

  const counts = {
    all: all.length,
    social: all.filter((j) => j.hiringType !== "campus").length,
    campus: all.filter((j) => j.hiringType === "campus").length,
  };

  const rows =
    tab === "all"
      ? all
      : tab === "campus"
      ? all.filter((j) => j.hiringType === "campus")
      : all.filter((j) => j.hiringType !== "campus");

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: counts.all },
    { key: "social", label: "社会招聘", count: counts.social },
    { key: "campus", label: "校园招聘", count: counts.campus },
  ];

  return (
    <div className="min-h-screen">
      <CandidateNav />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">在招岗位</h1>
          <p className="mt-2 text-sm text-slate-500">
            共 {counts.all} 个岗位 · 点击卡片查看详情与投递。
          </p>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-slate-200">
          {tabs.map((t) => {
            const active = t.key === tab;
            const href =
              t.key === "all"
                ? "/jobs"
                : `/jobs?tab=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={cn(
                  "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition",
                  active
                    ? "border-brand-600 text-brand-700"
                    : "border-transparent text-slate-500 hover:text-slate-900",
                )}
              >
                {t.label}
                <span
                  className={cn(
                    "ml-2 rounded-full px-1.5 py-0.5 text-xs",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  {t.count}
                </span>
              </Link>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="暂无岗位"
            description={
              tab === "campus"
                ? "当前没有校园招聘岗位在招，试试看社会招聘？"
                : tab === "social"
                ? "当前没有社会招聘岗位在招，试试看校园招聘？"
                : "我们正在整理新一轮招聘需求，敬请期待。"
            }
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
