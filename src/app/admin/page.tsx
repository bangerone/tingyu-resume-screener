// HR 工作台首页 — 外壳在 admin/layout.tsx，这里只渲染内容
import Link from "next/link";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import {
  Briefcase,
  Users,
  Send,
  ArrowRight,
  Plus,
  CircleCheck,
  Clock,
} from "lucide-react";
import { db } from "@/lib/db/client";
import { applications, jobs } from "@/lib/db/schema";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreBadge } from "@/features/scoring/score-badge";
import { formatDateTime, cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHomePage() {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

  const [openJobsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobs)
    .where(eq(jobs.status, "open"));
  const [totalAppsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications);
  const [weekAppsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(gte(applications.createdAt, sevenDaysAgo));
  const [pushedRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(eq(applications.status, "pushed"));
  const [pendingRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(applications)
    .where(
      and(
        sql`${applications.status} IN ('received','parsing','scoring')`,
      ),
    );

  const recent = await db
    .select({
      id: applications.id,
      jobTitle: jobs.title,
      candidateName: applications.candidateName,
      candidateEmail: applications.candidateEmail,
      status: applications.status,
      score: applications.score,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .orderBy(desc(applications.createdAt))
    .limit(6);

  const stats = [
    {
      label: "在招岗位",
      value: Number(openJobsRow?.count ?? 0),
      icon: <Briefcase className="h-4 w-4" />,
      tone: "brand" as const,
      href: "/admin/jobs",
    },
    {
      label: "近 7 天投递",
      value: Number(weekAppsRow?.count ?? 0),
      sub: `累计 ${Number(totalAppsRow?.count ?? 0)}`,
      icon: <Users className="h-4 w-4" />,
      tone: "blue" as const,
      href: "/admin/applications",
    },
    {
      label: "待处理",
      value: Number(pendingRow?.count ?? 0),
      sub: "解析中 / 评分中",
      icon: <Clock className="h-4 w-4" />,
      tone: "amber" as const,
      href: "/admin/applications?status=scoring",
    },
    {
      label: "已推送飞书",
      value: Number(pushedRow?.count ?? 0),
      icon: <Send className="h-4 w-4" />,
      tone: "emerald" as const,
      href: "/admin/applications?pushed=yes",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-sky-500 p-6 text-white shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-white/70">
              HR 工作台
            </div>
            <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
              欢迎回来，今天也要找到对的人 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm text-white/80">
              管理岗位、查看 AI 评分后的候选人池，高分候选人会自动推送到你的飞书群。
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/jobs/new"
              className="inline-flex items-center gap-1 rounded-lg bg-white px-4 py-2 text-sm font-medium text-brand-700 shadow-sm transition hover:bg-brand-50"
            >
              <Plus className="h-4 w-4" /> 新建岗位
            </Link>
            <Link
              href="/admin/applications"
              className="inline-flex items-center gap-1 rounded-lg bg-white/15 px-4 py-2 text-sm font-medium text-white backdrop-blur transition hover:bg-white/25"
            >
              查看候选人池 <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} />
        ))}
      </section>

      {/* Two-column: quick actions + recent */}
      <section className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Briefcase className="h-4 w-4" />
              </span>
              <h2 className="text-base font-semibold text-slate-900">
                快速入口
              </h2>
            </div>
            <div className="space-y-2">
              <QuickLink
                href="/admin/jobs"
                title="岗位管理"
                desc="创建、编辑、发布与下架岗位"
              />
              <QuickLink
                href="/admin/applications"
                title="候选人池"
                desc="按总分查看所有投递"
              />
              <QuickLink
                href="/admin/jobs/new"
                title="新建岗位"
                desc="配置筛选标准并发布"
                accent
              />
              <QuickLink
                href="/"
                title="候选人门户"
                desc="看看候选人看到的样子"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-0">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <Users className="h-4 w-4" />
                </span>
                <h2 className="text-base font-semibold text-slate-900">
                  最近投递
                </h2>
              </div>
              <Link
                href="/admin/applications"
                className="text-xs font-medium text-brand-600 hover:underline"
              >
                查看全部 →
              </Link>
            </div>
            {recent.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-slate-500">
                还没有候选人投递。先去
                <Link
                  href="/admin/jobs"
                  className="mx-1 text-brand-600 hover:underline"
                >
                  岗位管理
                </Link>
                发布一个岗位吧。
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {recent.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/admin/applications/${r.id}`}
                      className="flex items-center justify-between gap-3 px-6 py-3 transition hover:bg-slate-50"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="truncate font-medium text-slate-900">
                            {r.candidateName || "(未填)"}
                          </span>
                          {r.status === "pushed" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              <CircleCheck className="h-3 w-3" />
                              已推送
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-slate-500">
                          {r.jobTitle ?? "—"} · {r.candidateEmail}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <ScoreBadge score={r.score?.total ?? null} />
                        <span className="hidden text-xs text-slate-400 sm:inline">
                          {formatDateTime(r.createdAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

const TONE_MAP = {
  brand: "bg-brand-50 text-brand-700",
  blue: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  emerald: "bg-emerald-50 text-emerald-700",
} as const;

function StatCard({
  label,
  value,
  sub,
  icon,
  tone,
  href,
}: {
  label: string;
  value: number;
  sub?: string;
  icon: React.ReactNode;
  tone: keyof typeof TONE_MAP;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand-200 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500">{label}</span>
        <span
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg",
            TONE_MAP[tone],
          )}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3 text-2xl font-semibold tabular-nums text-slate-900 sm:text-3xl">
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs text-slate-400">{sub}</div>
      )}
    </Link>
  );
}

function QuickLink({
  href,
  title,
  desc,
  accent,
}: {
  href: string;
  title: string;
  desc: string;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border p-3 transition",
        accent
          ? "border-brand-100 bg-brand-50/50 hover:border-brand-300 hover:bg-brand-50"
          : "border-slate-200 bg-white hover:border-brand-200 hover:bg-slate-50",
      )}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">{desc}</div>
      </div>
      <ArrowRight
        className={cn(
          "h-4 w-4 shrink-0 transition group-hover:translate-x-0.5",
          accent ? "text-brand-600" : "text-slate-400",
        )}
      />
    </Link>
  );
}
