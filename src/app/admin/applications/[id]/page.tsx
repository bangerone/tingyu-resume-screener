// ============================================================
// /admin/applications/[id] —— 候选人详情（RSC）
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, feishuLogs, jobs } from "@/lib/db/schema";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { ScoreBadge } from "@/features/scoring/score-badge";
import { ScoreCard } from "@/features/scoring/score-card";
import { ScoreRadar } from "@/features/scoring/score-radar";
import { ApplicationActions } from "@/features/scoring/application-actions";
import { getSignedReadUrl } from "@/lib/storage/cos";
import type { ApplicationStatus } from "@/types";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<ApplicationStatus, string> = {
  received: "已收到",
  parsing: "解析中",
  scoring: "评分中",
  scored: "已评分",
  pushed: "已推送",
  failed: "失败",
};

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [app] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, params.id))
    .limit(1);
  if (!app) notFound();

  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, app.jobId))
    .limit(1);

  const logs = await db
    .select()
    .from(feishuLogs)
    .where(eq(feishuLogs.applicationId, app.id))
    .orderBy(desc(feishuLogs.createdAt))
    .limit(10);

  let resumeUrl: string | null = null;
  let resumeUrlError: string | null = null;
  try {
    resumeUrl = getSignedReadUrl(app.resumeFileKey, 300);
  } catch (e) {
    resumeUrlError = e instanceof Error ? e.message : "无法生成预览链接";
  }

  const resumeExt =
    app.resumeFileKey.split(".").pop()?.toLowerCase() ?? "";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/applications"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 候选人池
        </Link>
      </div>

      {/* 头部卡 */}
      <Card>
        <CardContent className="py-6">
          <div className="flex items-start justify-between gap-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-slate-900">
                  {app.candidateName || "(未填)"}
                </h1>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
                  {STATUS_LABEL[app.status as ApplicationStatus] ?? app.status}
                </span>
              </div>
              <p className="text-sm text-slate-600">
                {app.candidateEmail}
                {app.candidatePhone ? ` · ${app.candidatePhone}` : ""}
              </p>
              <p className="text-sm text-slate-600">
                岗位：
                {job ? (
                  <Link
                    href={`/admin/jobs/${job.id}`}
                    className="text-brand-600 hover:underline"
                  >
                    {job.title}
                  </Link>
                ) : (
                  "—"
                )}
              </p>
              <p className="text-xs text-slate-500">
                投递时间 {formatDateTime(app.createdAt)}
                {app.pushedToFeishuAt && (
                  <>
                    {" · "}推送时间 {formatDateTime(app.pushedToFeishuAt)}
                  </>
                )}
              </p>
              {app.failReason && (
                <p className="mt-2 rounded-md bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  ⚠️ {app.failReason}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <ScoreBadge score={app.score?.total ?? null} size="lg" />
              {app.score ? (
                <span
                  className={
                    "text-xs font-medium " +
                    (app.score.passed_hard
                      ? "text-emerald-700"
                      : "text-rose-700")
                  }
                >
                  {app.score.passed_hard ? "✅ 通过硬性" : "❌ 未通过硬性"}
                </span>
              ) : (
                <span className="text-xs text-slate-400">暂无评分</span>
              )}
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-4">
            <ApplicationActions
              applicationId={app.id}
              status={app.status as ApplicationStatus}
              hasScore={!!app.score}
            />
          </div>
        </CardContent>
      </Card>

      {/* 双栏：左评分详解 / 右简历预览 + 推送日志 */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="space-y-4">
          {app.score ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">评估结论</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-700">
                    {app.score.reasoning}
                  </p>
                  <div className="border-t border-slate-100 pt-2">
                    <h4 className="mb-1 text-xs font-medium uppercase text-slate-500">
                      5 维度概览
                    </h4>
                    <ScoreRadar score={app.score} />
                  </div>
                </CardContent>
              </Card>
              <ScoreCard score={app.score} />
            </>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">暂无评分</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-500">
                点击右上角「重新评分」手动触发。
              </CardContent>
            </Card>
          )}

          {logs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">飞书推送日志</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                {logs.map((l) => (
                  <div
                    key={l.id}
                    className="rounded-md border border-slate-100 px-3 py-2"
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={
                          l.ok ? "text-emerald-700" : "text-rose-700"
                        }
                      >
                        {l.ok ? "✓ 成功" : "✗ 失败"}
                      </span>
                      <span className="text-slate-500">
                        {formatDateTime(l.createdAt)}
                      </span>
                    </div>
                    <p className="mt-1 break-all text-slate-600">
                      {l.response.slice(0, 300) || "—"}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* 简历预览 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">简历原件</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resumeUrl ? (
              <>
                {resumeExt === "pdf" ? (
                  <iframe
                    src={resumeUrl}
                    className="h-[720px] w-full rounded-md border border-slate-200 bg-white"
                    title="简历预览"
                  />
                ) : ["doc", "docx"].includes(resumeExt) ? (
                  // Microsoft Office Online Viewer —— 要求 src 是可公开访问的临时签名 URL
                  <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(resumeUrl)}`}
                    className="h-[720px] w-full rounded-md border border-slate-200 bg-white"
                    title="简历预览"
                  />
                ) : (
                  <div className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-600">
                    该格式不支持浏览器内嵌预览，请点击下方按钮下载原件。
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate">{app.resumeFileKey}</span>
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 shrink-0 text-brand-600 hover:underline"
                  >
                    新标签页打开 ↗
                  </a>
                </div>
              </>
            ) : (
              <p className="text-sm text-rose-600">
                无法生成预览链接：{resumeUrlError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 解析后简历（折叠数据） */}
      {app.parsedResume && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">解析后简历 (AI 结构化)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-3 md:grid-cols-2">
              <KV label="姓名" value={app.parsedResume.name} />
              <KV label="邮箱" value={app.parsedResume.email} />
              <KV label="电话" value={app.parsedResume.phone} />
              <KV label="城市" value={app.parsedResume.location} />
              <KV
                label="总年限"
                value={
                  app.parsedResume.total_years != null
                    ? `${app.parsedResume.total_years} 年`
                    : undefined
                }
              />
              <KV
                label="技能"
                value={app.parsedResume.skills.join("、") || "—"}
              />
            </div>
            {app.parsedResume.experience.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-medium uppercase text-slate-500">
                  工作经历
                </h4>
                <ul className="space-y-2">
                  {app.parsedResume.experience.map((e, i) => (
                    <li
                      key={i}
                      className="rounded-md bg-slate-50 px-3 py-2 text-sm"
                    >
                      <div className="font-medium text-slate-900">
                        {e.company} · {e.title}
                      </div>
                      <div className="text-xs text-slate-500">{e.period}</div>
                      <div className="mt-1 text-slate-700">{e.summary}</div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {app.parsedResume.education.length > 0 && (
              <div>
                <h4 className="mb-1 text-xs font-medium uppercase text-slate-500">
                  教育经历
                </h4>
                <ul className="space-y-1 text-sm text-slate-700">
                  {app.parsedResume.education.map((e, i) => (
                    <li key={i}>
                      {e.school} · {e.degree} · {e.major} · {e.period}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string }) {
  return (
    <div className="rounded-md bg-slate-50 px-3 py-2">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-sm text-slate-900">{value || "—"}</div>
    </div>
  );
}
