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
  const selectedDept = pick(searchParams.dept);
  const selectedLoc = pick(searchParams.loc);

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

  // 先按 tab 过滤
  const tabRows =
    tab === "all"
      ? all
      : tab === "campus"
      ? all.filter((j) => j.hiringType === "campus")
      : all.filter((j) => j.hiringType !== "campus");

  // dept / loc 选项来自当前 tab 的岗位，避免显示空选项
  const deptOptions = Array.from(
    new Set(tabRows.map((j) => j.department).filter((s) => !!s)),
  ) as string[];
  const locOptions = Array.from(
    new Set(
      tabRows.flatMap((j) =>
        (j.location ?? "")
          .split("/")
          .map((s) => s.trim())
          .filter(Boolean),
      ),
    ),
  );

  // 最终可见的岗位 = tab 过滤 ∩ dept 过滤 ∩ loc 过滤
  let rows = tabRows;
  if (selectedDept) rows = rows.filter((j) => j.department === selectedDept);
  if (selectedLoc)
    rows = rows.filter((j) =>
      (j.location ?? "")
        .split("/")
        .map((s) => s.trim())
        .includes(selectedLoc),
    );

  // 构造链接时保留其它筛选
  function buildHref(o: {
    tab?: Tab;
    dept?: string | null;
    loc?: string | null;
  }) {
    const qp = new URLSearchParams();
    const t = o.tab !== undefined ? o.tab : tab;
    if (t !== "all") qp.set("tab", t);
    const d = o.dept !== undefined ? o.dept : selectedDept;
    if (d) qp.set("dept", d);
    const l = o.loc !== undefined ? o.loc : selectedLoc;
    if (l) qp.set("loc", l);
    const s = qp.toString();
    return s ? `/jobs?${s}` : "/jobs";
  }

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: counts.all },
    { key: "social", label: "社会招聘", count: counts.social },
    { key: "campus", label: "校园招聘", count: counts.campus },
  ];

  const hasFilter = !!selectedDept || !!selectedLoc;

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

        <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200">
          {tabs.map((t) => {
            const active = t.key === tab;
            // 切 tab 时把 dept / loc 重置（它们可能在另一个 tab 里不存在）
            const href = buildHref({ tab: t.key, dept: null, loc: null });
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

        {/* 筛选区 —— 当前 tab 有岗位时才显示 */}
        {tabRows.length > 0 && (
          <div className="mb-6 space-y-2">
            {deptOptions.length > 0 && (
              <FilterRow
                label="部门"
                selected={selectedDept}
                options={deptOptions}
                buildHref={(val) => buildHref({ dept: val })}
              />
            )}
            {locOptions.length > 0 && (
              <FilterRow
                label="地点"
                selected={selectedLoc}
                options={locOptions}
                buildHref={(val) => buildHref({ loc: val })}
              />
            )}
            {hasFilter && (
              <div className="pt-1 text-xs">
                <Link
                  href={buildHref({ dept: null, loc: null })}
                  className="text-brand-600 hover:underline"
                >
                  清除筛选
                </Link>
                <span className="ml-2 text-slate-400">
                  匹配 {rows.length} / {tabRows.length} 个岗位
                </span>
              </div>
            )}
          </div>
        )}

        {rows.length === 0 ? (
          <EmptyState
            icon={<Briefcase className="h-5 w-5" />}
            title="暂无匹配岗位"
            description={
              hasFilter
                ? "当前筛选条件下没有岗位，试试清除筛选或切换 tab？"
                : tab === "campus"
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

function FilterRow({
  label,
  selected,
  options,
  buildHref,
}: {
  label: string;
  selected: string | undefined;
  options: string[];
  buildHref: (val: string | null) => string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="shrink-0 text-xs font-medium text-slate-500">
        {label}
      </span>
      <Link
        href={buildHref(null)}
        className={cn(
          "rounded-full border px-3 py-1 text-xs transition",
          !selected
            ? "border-brand-500 bg-brand-50 text-brand-700"
            : "border-slate-200 bg-white text-slate-600 hover:border-brand-300",
        )}
      >
        全部
      </Link>
      {options.map((opt) => {
        const active = opt === selected;
        return (
          <Link
            key={opt}
            href={buildHref(active ? null : opt)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition",
              active
                ? "border-brand-500 bg-brand-50 text-brand-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-brand-300",
            )}
          >
            {opt}
          </Link>
        );
      })}
    </div>
  );
}
