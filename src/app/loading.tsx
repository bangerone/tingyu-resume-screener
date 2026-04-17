import { Skeleton, SkeletonCardGrid } from "@/components/ui/skeleton";

// 根级 loading：候选人门户/公开页的过渡态
export default function RootLoading() {
  return (
    <div className="min-h-screen">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-40" />
        </div>
      </div>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-3 h-4 w-64" />
        <div className="mt-8">
          <SkeletonCardGrid />
        </div>
      </main>
    </div>
  );
}
