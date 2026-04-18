import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { CandidateNav } from "@/features/layout/candidate-nav";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const [job] = await db
    .select()
    .from(jobs)
    .where(eq(jobs.id, params.id))
    .limit(1);
  if (!job || job.status !== "open") notFound();

  return (
    <div className="min-h-screen pb-24">
      <CandidateNav />
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/jobs"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 返回岗位列表
        </Link>

        <header className="mt-4">
          <h1 className="text-3xl font-semibold text-slate-900">{job.title}</h1>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-slate-500">
            {job.department ? <span>{job.department}</span> : null}
            {job.location ? <span>· {job.location}</span> : null}
            <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
              在招
            </span>
          </div>
        </header>

        <article className="mt-8 max-w-none">
          <Markdown source={job.description} />
        </article>

        <div className="mt-12 rounded-xl border border-brand-200 bg-brand-50/40 p-6">
          <div className="text-sm text-slate-700">
            提交简历后，AI 会自动解析你的背景并帮你填好申请表，你只需检查与补充。
          </div>
          <Link href={`/jobs/${job.id}/apply`}>
            <Button size="lg" className="mt-4 w-full sm:w-auto">
              立即投递 →
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
