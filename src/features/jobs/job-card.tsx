import Link from "next/link";
import { Card } from "@/components/ui/card";
import type { Job } from "@/lib/db/schema";

interface Props {
  job: Pick<
    Job,
    "id" | "title" | "department" | "location" | "description" | "hiringType"
  >;
}

export function JobCard({ job }: Props) {
  const snippet = job.description
    .replace(/[#*>`_\[\]()]/g, "")
    .slice(0, 90)
    .trim();
  const isCampus = job.hiringType === "campus";

  return (
    <Link href={`/jobs/${job.id}`} className="group block">
      <Card className="h-full p-6 transition-all hover:border-brand-400 hover:shadow-md">
        <div className="flex items-center gap-2">
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
          <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
            在招
          </span>
          {job.department ? (
            <span className="text-xs text-slate-500">{job.department}</span>
          ) : null}
        </div>
        <div className="mt-3 text-lg font-semibold text-slate-900 group-hover:text-brand-700">
          {job.title}
        </div>
        <div className="mt-1 text-sm text-slate-500">
          {job.location || "不限地点"}
        </div>
        {snippet ? (
          <p className="mt-3 line-clamp-2 text-sm text-slate-600">{snippet}…</p>
        ) : null}
        <div className="mt-4 text-sm font-medium text-brand-600 group-hover:underline">
          查看详情 →
        </div>
      </Card>
    </Link>
  );
}
