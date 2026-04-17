import { cn } from "@/lib/utils";

/**
 * 骨架块 —— 列表/详情 loading 用。
 * 背景是 shimmer 渐变动画，比静态灰条有生命力。
 */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-slate-200",
        "bg-[linear-gradient(90deg,#e2e8f0_0px,#f1f5f9_100px,#e2e8f0_200px)] bg-[length:800px_100%]",
        className,
      )}
    />
  );
}

/** 表格行骨架 */
export function SkeletonTableRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** 卡片网格骨架 */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-slate-200 bg-white p-5"
        >
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="mt-3 h-3 w-1/2" />
          <Skeleton className="mt-6 h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-5/6" />
        </div>
      ))}
    </div>
  );
}
