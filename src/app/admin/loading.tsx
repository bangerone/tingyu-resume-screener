import { Skeleton, SkeletonTableRows } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-7 w-48" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="rounded-xl border border-slate-200 bg-white">
        <SkeletonTableRows rows={6} />
      </div>
    </div>
  );
}
