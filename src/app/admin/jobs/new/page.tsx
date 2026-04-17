// ============================================================
// /admin/jobs/new —— 新建岗位
// ============================================================

import Link from "next/link";
import { JobForm } from "@/features/jobs";

export default function NewJobPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/jobs"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← 岗位管理
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-slate-900">新建岗位</h1>
        <p className="mt-1 text-sm text-slate-500">
          填写岗位信息与筛选标准。保存草稿可随时回来编辑，发布后候选人可在招聘门户看到。
        </p>
      </div>
      <JobForm mode="create" />
    </div>
  );
}
