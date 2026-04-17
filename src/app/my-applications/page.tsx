import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, jobs } from "@/lib/db/schema";
import { getCandidateSession } from "@/lib/auth/candidate";
import { CandidateNav } from "@/features/layout/candidate-nav";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";
import { MyApplicationsLogin } from "./_login";

export const dynamic = "force-dynamic";

// 状态展示策略（候选人永不看分数）
function statusLabel(s: ApplicationStatus): { text: string; color: string } {
  switch (s) {
    case "received":
    case "parsing":
    case "scoring":
      return { text: "评估中", color: "bg-amber-50 text-amber-700" };
    case "scored":
    case "pushed":
      return { text: "已收到", color: "bg-emerald-50 text-emerald-700" };
    case "failed":
      return {
        text: "处理异常，请联系 HR",
        color: "bg-rose-50 text-rose-700",
      };
    default:
      return { text: "已收到", color: "bg-slate-100 text-slate-700" };
  }
}

export default async function MyApplicationsPage() {
  const session = await getCandidateSession();

  if (!session) {
    return (
      <div className="min-h-screen">
        <CandidateNav />
        <main className="mx-auto max-w-md px-6 py-16">
          <Card>
            <CardHeader>
              <CardTitle>请先登录</CardTitle>
              <CardDescription>
                登录后才能查看你投递过的岗位与进度。
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MyApplicationsLogin />
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const rows = await db
    .select({
      id: applications.id,
      status: applications.status,
      createdAt: applications.createdAt,
      jobId: applications.jobId,
      jobTitle: jobs.title,
      jobDepartment: jobs.department,
      jobLocation: jobs.location,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(eq(applications.candidateId, session.sub))
    .orderBy(desc(applications.createdAt));

  return (
    <div className="min-h-screen">
      <CandidateNav />
      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-slate-900">我的投递</h1>
          <p className="mt-1 text-sm text-slate-500">
            共 {rows.length} 条记录 · 评估中的投递结果 HR 会邮件/电话通知你
          </p>
        </header>

        {rows.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-sm text-slate-600">你还没有投递过岗位。</p>
              <div className="mt-4">
                <Link
                  href="/jobs"
                  className="text-sm font-medium text-brand-600 hover:underline"
                >
                  去看看在招岗位 →
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">岗位</th>
                  <th className="px-4 py-3 font-medium">投递时间</th>
                  <th className="px-4 py-3 font-medium">状态</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((r) => {
                  const s = statusLabel(r.status as ApplicationStatus);
                  return (
                    <tr key={r.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">
                          {r.jobTitle ?? "已下架岗位"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {r.jobDepartment || "—"} · {r.jobLocation || "不限"}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-500">
                        {formatDateTime(r.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${s.color}`}
                        >
                          {s.text}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/applied/${r.id}`}
                          className="text-xs font-medium text-brand-600 hover:underline"
                        >
                          查看回执
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Card>
        )}
      </main>
    </div>
  );
}
