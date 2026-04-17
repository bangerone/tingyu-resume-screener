// ============================================================
// ScoreBadge —— 列表/详情共用的总分数字
// ============================================================
// 颜色阈值（与 lib/utils.ts scoreColor 保持一致）：
//   ≥85 emerald · 70-84 blue · 50-69 amber · <50 rose
// size:
//   sm  → 列表行（18px）
//   lg  → 详情页大字（48px）
// ============================================================

import { cn } from "@/lib/utils";

export interface ScoreBadgeProps {
  score: number | null | undefined;
  size?: "sm" | "lg";
  className?: string;
}

export function scoreTierClass(score: number): string {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-blue-600";
  if (score >= 50) return "text-amber-600";
  return "text-rose-600";
}

export function ScoreBadge({ score, size = "sm", className }: ScoreBadgeProps) {
  if (score === null || score === undefined) {
    return <span className={cn("text-slate-400", className)}>—</span>;
  }
  return (
    <span
      className={cn(
        "font-semibold tabular-nums",
        scoreTierClass(score),
        size === "lg" ? "text-5xl" : "text-base",
        className,
      )}
    >
      {score}
    </span>
  );
}
