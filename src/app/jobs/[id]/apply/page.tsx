import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { CandidateNav } from "@/features/layout/candidate-nav";
import { ApplyStepper } from "@/features/applications";

export const dynamic = "force-dynamic";

export default async function ApplyPage({
  params,
}: {
  params: { id: string };
}) {
  const [job] = await db
    .select({ id: jobs.id, title: jobs.title, status: jobs.status })
    .from(jobs)
    .where(eq(jobs.id, params.id))
    .limit(1);
  if (!job || job.status !== "open") notFound();

  return (
    <div className="min-h-screen pb-24">
      <CandidateNav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/jobs/${job.id}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 返回岗位详情
        </Link>
        <h1 className="mt-4 text-2xl font-semibold text-slate-900">
          投递 · {job.title}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          上传简历可 AI 自动填表，也可以直接在下方手动填写
        </p>

        <div className="mt-8">
          <ApplyStepper jobId={job.id} jobTitle={job.title} />
        </div>
      </main>
    </div>
  );
}
