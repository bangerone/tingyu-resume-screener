// ============================================================
// /admin/jobs —— 岗位列表（RSC）
// ============================================================
// middleware 已守卫登录；这里 RSC 直接读 DB 拉全量。
// 行内操作 (发布/下架/删除) 走 client 子组件。
// ============================================================

import Link from "next/link";
import { desc } from "drizzle-orm";
import { Briefcase } from "lucide-react";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/utils";
import { JobStatusActions } from "@/features/jobs";

export const dynamic = "force-dynamic";

export default async function AdminJobsListPage() {
  const rows = await db.select().from(jobs).orderBy(desc(jobs.createdAt));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">岗位管理</h1>
          <p className="mt-1 text-sm text-slate-500">
            创建岗位、配置筛选标准、发布到候选人门户。
          </p>
        </div>
        <Link href="/admin/jobs/new">
          <Button>+ 新建岗位</Button>
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" />}
          title="还没有岗位"
          description="新建时默认为草稿，发布后候选人才能在招聘门户看到。"
          action={
            <Link href="/admin/jobs/new">
              <Button>+ 创建第一个岗位</Button>
            </Link>
          }
        />
      ) : (
        <>
          {/* 移动端：卡片 */}
          <div className="space-y-3 md:hidden">
            {rows.map((job) => (
              <div
                key={job.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="min-w-0 flex-1 font-medium text-slate-900 hover:text-brand-600"
                  >
                    {job.title}
                  </Link>
                  <div className="flex items-center gap-1">
                    <HiringTypeBadge type={job.hiringType} />
                    <StatusBadge status={job.status} />
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-500">
                  {job.department || "—"} · {job.location || "不限"} · 阈值{" "}
                  {job.pushThreshold}
                </div>
                <div className="mt-1 text-xs text-slate-400">
                  {formatDateTime(job.createdAt)}
                </div>
                <div className="mt-3">
                  <JobStatusActions jobId={job.id} status={job.status} />
                </div>
              </div>
            ))}
          </div>

          {/* 桌面：表格 */}
          <Card className="hidden overflow-hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">标题</th>
                    <th className="px-4 py-3 font-medium">类型</th>
                    <th className="px-4 py-3 font-medium">部门</th>
                    <th className="px-4 py-3 font-medium">地点</th>
                    <th className="px-4 py-3 font-medium">状态</th>
                    <th className="px-4 py-3 font-medium">阈值</th>
                    <th className="px-4 py-3 font-medium">创建于</th>
                    <th className="px-4 py-3 text-right font-medium">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {rows.map((job) => (
                    <tr key={job.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/jobs/${job.id}`}
                          className="font-medium text-slate-900 hover:text-brand-600"
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <HiringTypeBadge type={job.hiringType} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {job.department || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {job.location || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={job.status} />
                      </td>
                      <td className="px-4 py-3 tabular-nums text-slate-600">
                        {job.pushThreshold}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateTime(job.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <JobStatusActions jobId={job.id} status={job.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function HiringTypeBadge({ type }: { type: string }) {
  const isCampus = type === "campus";
  return (
    <span
      className={
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium " +
        (isCampus
          ? "bg-violet-50 text-violet-700"
          : "bg-sky-50 text-sky-700")
      }
    >
      {isCampus ? "校园招聘" : "社会招聘"}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    draft: "bg-slate-100 text-slate-700",
    open: "bg-emerald-50 text-emerald-700",
    closed: "bg-rose-50 text-rose-700",
  };
  const label: Record<string, string> = {
    draft: "草稿",
    open: "在招",
    closed: "已下架",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${map[status] ?? map.draft}`}
    >
      {label[status] ?? status}
    </span>
  );
}
