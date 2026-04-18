// ============================================================
// /admin/jobs/[id] —— 编辑岗位（RSC 取值 → 交给 JobForm）
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { jobs } from "@/lib/db/schema";
import { JobForm, emptyCriteria, type JobInput } from "@/features/jobs";

export const dynamic = "force-dynamic";

export default async function EditJobPage({
  params,
}: {
  params: { id: string };
}) {
  const [row] = await db.select().from(jobs).where(eq(jobs.id, params.id));
  if (!row) notFound();

  const defaultValues: JobInput = {
    title: row.title,
    department: row.department,
    location: row.location,
    description: row.description,
    criteria: { ...emptyCriteria, ...(row.criteria ?? {}) },
    pushThreshold: row.pushThreshold,
    status: row.status,
    hiringType: row.hiringType ?? "social",
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/jobs"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 岗位管理
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">
          编辑岗位
        </h1>
        <p className="mt-1 text-sm text-slate-500">ID：{row.id}</p>
      </div>
      <JobForm mode="edit" jobId={row.id} defaultValues={defaultValues} />
    </div>
  );
}
