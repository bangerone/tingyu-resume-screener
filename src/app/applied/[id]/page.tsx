import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { applications, jobs } from "@/lib/db/schema";
import { getCandidateSession } from "@/lib/auth/candidate";
import { CandidateNav } from "@/features/layout/candidate-nav";
import { Button } from "@/components/ui/button";
import { SuccessCheck } from "./_success-check";

export const dynamic = "force-dynamic";

export default async function AppliedPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getCandidateSession();
  if (!session) {
    redirect(`/jobs`);
  }

  const rows = await db
    .select({
      id: applications.id,
      jobId: applications.jobId,
      status: applications.status,
      jobTitle: jobs.title,
    })
    .from(applications)
    .leftJoin(jobs, eq(applications.jobId, jobs.id))
    .where(
      and(
        eq(applications.id, params.id),
        eq(applications.candidateId, session.sub),
      ),
    )
    .limit(1);
  const row = rows[0];
  if (!row) notFound();

  return (
    <div className="min-h-screen">
      <CandidateNav />
      <main className="mx-auto max-w-xl px-6 py-16 text-center">
        <SuccessCheck />
        <h1 className="mt-6 animate-fade-up text-2xl font-semibold text-slate-900 [animation-delay:200ms] opacity-0">
          我们已经收到你的简历
        </h1>
        <p className="mt-3 animate-fade-up text-sm text-slate-600 [animation-delay:320ms] opacity-0">
          你投递的岗位：
          <span className="font-medium text-slate-900">
            {row.jobTitle ?? "岗位"}
          </span>
          <br />
          HR 会在 3 个工作日内与合适的候选人联系，请留意邮箱和手机。
        </p>
        <div className="mt-8 flex animate-fade-up items-center justify-center gap-3 [animation-delay:450ms] opacity-0">
          <Link href="/my-applications">
            <Button>查看我的投递</Button>
          </Link>
          <Link href="/jobs">
            <Button variant="outline">看看其他岗位</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
