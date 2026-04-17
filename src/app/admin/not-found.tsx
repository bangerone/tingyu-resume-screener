import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminNotFound() {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <Compass className="h-6 w-6" />
      </div>
      <h2 className="mt-3 text-base font-semibold text-slate-900">找不到该资源</h2>
      <p className="mt-1 text-sm text-slate-500">
        这个岗位或候选人可能已被删除，或 URL 错误。
      </p>
      <div className="mt-5 flex items-center justify-center gap-3">
        <Link href="/admin/jobs">
          <Button variant="outline">岗位管理</Button>
        </Link>
        <Link href="/admin/applications">
          <Button variant="outline">候选人池</Button>
        </Link>
      </div>
    </div>
  );
}
