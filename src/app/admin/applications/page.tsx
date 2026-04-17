// ============================================================
// /admin/applications —— 候选人池（RSC）
// ============================================================
// 表格默认按总分降序（score.total desc，null 垫底）
// 顶部筛选：岗位 / 状态 / 是否已推送（走 searchParams，不做 client state）
// ============================================================

import Link from "next/link";
import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, jobs } from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { ScoreBadge } from "@/features/scoring/score-badge";
import type { ApplicationStatus } from "@/types";

export const dynamic = "force-dynamic";

type SearchParams = { [k: string]: string | string[] | undefined };

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  received: "已收到",
  parsing: "解析中",
  scoring: "评分中",
  scored: "已评分",
  pushed: "已推送",
  failed: "失败",
};

const STATUS_BADGE: Record<ApplicationStatus, string> = {
  received: "bg-slate-100 text-slate-700",
  parsing: "bg-slate-100 text-slate-700",
  scoring: "bg-amber-50 text-amber-700",
  scored: "bg-blue-50 text-blue-700",
  pushed: "bg-emerald-50 text-emerald-700",
  failed: "bg-rose-50 text-rose-700",
};

function pick(v: SearchParams[string]): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}

export default async function AdminApplicationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const jobFilter = pick(searchParams.job) ?? "all";
  const statusFilter = pick(searchParams.status) ?? "all";
  const pushedFilter = pick(searchParams.pushed) ?? "all"; // all / yes / no

  const jobList = await db
    .select({ id: jobs.id, title: jobs.title })
    .from(jobs)
    .orderBy(desc(jobs.createdAt));

  // 排序表达式：score.total desc, null 垫底；再按 createdAt desc
  const scoreTotal = sql<number>`CAST(JSON_EXTRACT(${applications.score}, '$.total') AS SIGNED)`;
  const scoreNullFlag = sql<number>`CASE WHEN ${applications.score} IS NULL THEN 1 ELSE 0 END`;

  const filters: SQL[] = [];
  if (jobFilter !== "all") filters.push(eq(applications.jobId, jobFilter));
  if (statusFilter !== "all")
    filters.push(eq(applications.status, statusFilter as ApplicationStatus));

  const whereExpr = filters.length > 0 ? and(...filters) : undefined;

  let rows = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      candidateName: applications.candidateName,
      candidateEmail: applications.candidateEmail,
      status: applications.status,
      score: applications.score,
      pushedToFeishuAt: applications.pushedToFeishuAt,
      createdAt: applications.createdAt,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(whereExpr)
    .orderBy(asc(scoreNullFlag), desc(scoreTotal), desc(applications.createdAt));

  if (pushedFilter === "yes") {
    rows = rows.filter((r) => r.status === "pushed");
  } else if (pushedFilter === "no") {
    rows = rows.filter((r) => r.status !== "pushed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">候选人池</h1>
        <p className="mt-1 text-sm text-slate-500">
          按总分降序。点击行查看评分详情、简历预览，可重新评分 / 推送飞书。
        </p>
      </div>

      {/* 筛选器 —— 纯 <form> GET，刷新页面 */}
      <Card>
        <CardContent className="py-4">
          <form className="flex flex-wrap items-end gap-3" method="get">
            <FilterSelect
              name="job"
              label="岗位"
              value={jobFilter}
              options={[
                { value: "all", label: "全部岗位" },
                ...jobList.map((j) => ({ value: j.id, label: j.title })),
              ]}
            />
            <FilterSelect
              name="status"
              label="状态"
              value={statusFilter}
              options={[
                { value: "all", label: "全部状态" },
                { value: "received", label: "已收到" },
                { value: "parsing", label: "解析中" },
                { value: "scoring", label: "评分中" },
                { value: "scored", label: "已评分" },
                { value: "pushed", label: "已推送" },
                { value: "failed", label: "失败" },
              ]}
            />
            <FilterSelect
              name="pushed"
              label="飞书推送"
              value={pushedFilter}
              options={[
                { value: "all", label: "全部" },
                { value: "yes", label: "已推送" },
                { value: "no", label: "未推送" },
              ]}
            />
            <button
              type="submit"
              className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm hover:bg-slate-50"
            >
              应用筛选
            </button>
            <Link
              href="/admin/applications"
              className="h-9 rounded-md px-3 text-sm text-slate-500 hover:text-slate-900 leading-9"
            >
              清空
            </Link>
          </form>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>还没有候选人</CardTitle>
            <CardDescription>
              当有候选人投递简历后，这里会按总分展示。
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3 font-medium">候选人</th>
                <th className="px-4 py-3 font-medium">岗位</th>
                <th className="px-4 py-3 font-medium">总分</th>
                <th className="px-4 py-3 font-medium">评语</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">投递时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="cursor-pointer hover:bg-slate-50/70"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/applications/${r.id}`}
                      className="font-medium text-slate-900 hover:text-brand-600"
                    >
                      {r.candidateName || "(未填)"}
                    </Link>
                    <div className="text-xs text-slate-500">
                      {r.candidateEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {r.jobTitle ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={r.score?.total ?? null} />
                    {r.score && !r.score.passed_hard && (
                      <span className="ml-2 text-xs text-rose-600">
                        ❌ 硬性
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-600 max-w-[320px]">
                    <span className="line-clamp-2">
                      {r.score?.reasoning ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
                        (STATUS_BADGE[r.status as ApplicationStatus] ??
                          STATUS_BADGE.received)
                      }
                    >
                      {STATUS_LABEL[r.status as ApplicationStatus] ?? r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">
                    {formatDateTime(r.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

function FilterSelect({
  name,
  label,
  value,
  options,
}: {
  name: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-slate-500">
      {label}
      <select
        name={name}
        defaultValue={value}
        className="h-9 rounded-md border border-slate-200 bg-white px-2 text-sm text-slate-900"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
