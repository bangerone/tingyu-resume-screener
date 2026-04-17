import { Skeleton } from "@/components/ui/skeleton";

export default function AdminApplicationDetailLoading() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-4 w-24" />
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-start justify-between gap-6">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-56" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-16 w-20" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-60 w-full rounded-xl" />
        </div>
        <Skeleton className="h-[720px] w-full rounded-xl" />
      </div>
    </div>
  );
}
