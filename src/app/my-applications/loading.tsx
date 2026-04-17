import { Skeleton, SkeletonTableRows } from "@/components/ui/skeleton";

export default function MyApplicationsLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-48" />
        <div className="mt-8 rounded-xl border border-slate-200 bg-white">
          <SkeletonTableRows rows={4} />
        </div>
      </main>
    </div>
  );
}
